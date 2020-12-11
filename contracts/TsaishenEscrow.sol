// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/** 
money goes into the escrow until deed has been filled out and mailed to county.
When completed or time runs out the money is released from Escrow
We will use oracle to verify deed transfer with easypost (through Chainlink). 

beneficiary = buyer
*/

contract TsaishenEscrow is Ownable{

    using SafeMath for uint256;
    using Address for address payable;

    event Deposited(address indexed seller, uint256 weiAmount);
    event Withdrawn(address indexed seller, uint256 weiAmount);
    event RefundsClosed();
    event RefundsEnabled();

    enum State { Active, Refunding, Closed }
    State private _state;

    // might NOT need this!
    address payable buyer;
    address payable seller;

    address payable internal eFeeRecipient;

    mapping(address => uint256) private _beneficiary;
    mapping(address => uint256) private _refundee;

    // MUST ALWAYS BE PUBLIC!
    constructor() public {
        _state = State.Active;
        // eFeeRecipient = _eFeeRecipient;
    }

    // deposit funds to be held for the beneficiary (seller)
    function deposit(address seller, address buyer, uint256 amount) internal {
        require(seller != address(0), "Beneficiary cannot be zero address.");
        require(_state == State.Active, "Can only deposit while active");
        _beneficiary[seller] = _beneficiary[seller].add(amount);
        _refundee[buyer] = _refundee[buyer].add(amount);
        startTimelock(State.Active);

        emit Deposited(seller, amount);
    }

    function sellerDeposits(address recipient) public view returns (uint256) {  
        return _beneficiary[recipient];
    }

    function buyerDeposits(address refundee) public view returns (uint256) {
        return _refundee[refundee];   
    }

    function enableRefunds() internal onlyOwner notLocked(State.Active){
        require(_state == State.Active, "Escrow not active");
        _state = State.Refunding;
        
        emit RefundsEnabled();
    }

    function refundAllowed() public view returns (bool) {
       return _state == State.Refunding;
    }

    function escrowState() public view returns (State) {
        return _state;
    }

    // function to confirm that deed was indeed transfered
    function confirmDelivery() public {
        require(msg.sender == buyer, "Not authorized.");
        if(_state == State.Refunding){
            resetState();
        }
        cancelTimelock(State.Active);
        close();
    }

    // closes the escrow and refunds - DOES IT NEED to be onlyOwner if internal???
    function close() internal onlyOwner notLocked(State.Active){
        require(_state == State.Active, "Can only close while active");
        _state = State.Closed;

        emit RefundsClosed();
    }

    function withdrawalAllowed() public view returns (bool){
        if(_state != State.Closed) return false;
        return true;
    }

    // doesn't reset buyer to 0
    function beneficiaryWithdraw(address payable seller) public {
        require(_state == State.Closed, "Escrow not closed.");
        uint256 proceeds = _beneficiary[seller];
        uint256 transactionFee = proceeds.mul(3).div(100);
        uint256 paymentToSeller = proceeds.sub(transactionFee);
        _beneficiary[seller] = 0;
        _refundee[buyer] = 0;
        eFeeRecipient.transfer(transactionFee);
        seller.transfer(paymentToSeller);
        // seller.transfer(proceeds);

        emit Withdrawn(seller, /*proceeds*/paymentToSeller);
    }

    // doesn't reset seller to 0
    function issueRefund(address payable buyer) internal {
        require(_state == State.Refunding, "Can only refund while refunding");         
        uint256 refund = _refundee[buyer];
        _refundee[buyer] = 0;
        _beneficiary[seller] = 0;
        buyer.transfer(refund);
    }

    function resetState() internal onlyOwner{
        _state = State.Active;
    }

    // timelock will be 10 days, however for testing purposes we'll make it 1 minute
    uint256 private constant _TIMELOCK = 1 minutes;
    mapping (State => uint256) public timelock;

    
    // modifier to check if NOW is greater than when activated timelock
    modifier notLocked(State _st){
        require(timelock[_st] !=0 && timelock[_st] <= now, "Function is timelocked");
        _;
    }

    // timelock unlock function after the declared TIMELOCK timeline
    function startTimelock(State _st) public onlyOwner {
        timelock[_st] = now + _TIMELOCK;
    }

    // lock timelock
    function cancelTimelock(State _st) public onlyOwner {
        timelock[_st] = 0;
    }
        
}

   
    
