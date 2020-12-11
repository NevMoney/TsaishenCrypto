// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
// import "@openzeppelin/contracts/payment/escrow/RefundEscrow.sol";
import "./Marketplace.sol";

/** 
money goes into the escrow until deed has been filled out and mailed to county.
When completed or time runs out the money is released from Escrow
We will use oracle to verify deed transfer with easypost (through Chainlink). 

beneficiary = buyer
*/

contract TsaishenEscrow is Ownable{
    // Marketplace private _marketplace;
    using SafeMath for uint256;
    using Address for address payable;

    event Deposited(address indexed seller, uint256 weiAmount);
    event Withdrawn(address indexed seller, uint256 weiAmount);
    event RefundsClosed();
    event RefundsEnabled();

    enum State { Active, Refunding, Closed }
    State private _state;

    uint256 txFee = 2; //2% transaction fee  
    address payable internal feeRecipient;
    address marketplace;
    address payable buyer;
    // address payable seller;

    mapping(address => uint256) private _beneficiary;
    mapping(address => uint256) private _refundee;

    modifier onlyAuthorized(){
        require(msg.sender == owner() || msg.sender == marketplace || msg.sender == buyer);
        _;
    }

    // MUST ALWAYS BE PUBLIC!
    constructor(/*address _escrowAgent, */address payable _feeRecipient) public {
        // _marketplace = Marketplace(_escrowAgent);
        feeRecipient = _feeRecipient;
        // buyer = _buyer;
        // seller = _seller;
        _state = State.Active;
    }

    function setMarketplaceAddress(address _marketplace) public {
        marketplace = _marketplace;
    }

    function setBuyerAddress(address _buyer) public {
        buyer = payable (_buyer);
    }

    // deposit funds to be held for the beneficiary (seller)
    function deposit(address seller, address buyer) public payable  {
        require(seller != address(0), "Beneficiary cannot be zero address.");
        require(_state == State.Active, "Can only deposit while active");
        uint256 amount = msg.value;
        _beneficiary[seller] = _beneficiary[seller].add(amount);
        _refundee[buyer] = _refundee[buyer].add(amount);

        emit Deposited(seller, amount);
    }

    function sellerDeposits(address recipient) public view returns (uint256) {  
        return _beneficiary[recipient];
    }

    function buyerDeposits(address refundee) public view returns (uint256) {
        return _refundee[refundee];
        
    }

    function enableRefunds() public  {
        require(_state == State.Active, "Can only enable refunds while active");
        _state = State.Refunding;
        
        emit RefundsEnabled();
    }

    function refundAllowed() public view returns (bool) {
       return _state == State.Refunding;
    }

    function state() public view returns (State) {
        return _state;
    }

    // function to confirm that deed was indeed transfered
    function confirmDelivery() public /*onlyAuthorized*/{
        close();
    }

    // closes the escrow, which closes the refunds - this should use timelock functionality
    // PROBLEM: can only close if active but not in refund
    // perhaps a way to close both in refund and active BUT to verify first that funds are there??
    function close() public /*onlyAuthorized*/ {
        require(_state == State.Active, "RefundEscrow: can only close while active");
        _state = State.Closed;

        emit RefundsClosed();
    }

    function withdrawalAllowed() public view returns (bool){
        if(_state != State.Closed) return false;
        return true;
    }

    function beneficiaryWithdraw(address payable seller) public payable {
        require(_state == State.Closed, "Escrow not closed.");
        uint256 proceeds = _beneficiary[seller];
        uint256 transactionFee = proceeds.mul(txFee).div(100);
        uint256 paymentToSeller = proceeds.sub(transactionFee);
        _beneficiary[seller] = 0;
        feeRecipient.transfer(transactionFee);
        seller.transfer(paymentToSeller);

        emit Withdrawn(seller, paymentToSeller);
    }

    // this might not be working - TEST in truffle failed!
    function issueRefund(address payable buyer) public payable {
        require(_state == State.Refunding, "Can only refund while refunding");         
        uint256 refund = _refundee[buyer];
        _refundee[buyer] = 0;
        buyer.transfer(refund);
    }

    // function enterEscrow(address payable buyer, address payable seller, uint256 sellingPrice) public payable onlyOwner {
    //     State = State.Active;
    //     _beneficiary = seller;
    //     deposit(buyer);
    //     startTimelock(State.Active);
    // }
 
    // function permitBuyerRefund() public notLocked(State.Active) {
    //     enableRefunds();
    //     withdrawalAllowed(true);
    // }

    // function payout() public {
    //     uint256 houseTransactionFee = msg.value.mul(txFee).div(100);
    //     feeRecipient.transfer(houseTransactionFee);
    //     uint256 fundsToSeller = msg.value.sub(houseTransactionFee);
    //     close();
    //     beneficiaryWithdraw();
    // }

    // timelock will be 10 days, however for testing purposes we'll make it 1 minute
    // uint256 private constant _TIMELOCK = 1 minutes;
    // mapping (State => uint256) public timelock;

    
    // // modifier to check if NOW is greater than when activated timelock
    // modifier notLocked(State _st){
    //     require(timelock[_st]!=0 && timelock[_st] <= now, "Function is timelocked");
    //     _;
    // }

    // // timelock unlock function after the declared TIMELOCK timeline
    // function startTimelock(State _st) public onlyOwner {
    //     timelock[_st] = now + _TIMELOCK;
    // }

    // // lock timelock
    // function cancelTimelock(State _st) public onlyOwner {
    //     timelock[_st] = 0;
    // }
        
}

   
    
