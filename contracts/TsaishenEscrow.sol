// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract TsaishenEscrow is Ownable{

    using SafeMath for uint256;
    using Address for address payable;

    event Deposited(address indexed seller, uint256 weiAmount);
    event Withdrawn(address indexed seller, uint256 weiAmount);
    event RefundsClosed();
    event RefundsEnabled();

    enum State { Active, Refunding, Closed }

    // create a struct to hold all information about escrow
    struct Escrow {
        address payable seller; //this is beneficiary
        address payable buyer; //this is refundee
        State state;
        uint256 amount;
        uint256 timelock;
    }

    // tokenId is the key to the struct within mapping
    mapping(uint256 => Escrow) escrowById;

    address payable internal eFeeRecipient;
    uint256 fee = 3;

     // timelock will be 10 days; for testing it's 1 minute
    uint256 private constant _TIMELOCK= 1 minutes;
    
    // // modifier to check if NOW is greater than when activated timelock
    // modifier notLocked(State _st){
    //     require(timelock[_st] !=0 && timelock[_st] <= now, "Function is timelocked");
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
        
    // deposit funds to be held for the beneficiary (seller)
    function deposit(address seller, address buyer, uint256 amount, uint256 tokenId) internal {
        require(seller != address(0), "Address can't be zero.");
        
        Escrow memory escrow = Escrow(payable(seller), payable(buyer), State.Active, amount, now + _TIMELOCK);
        escrowById[tokenId] = escrow;

        emit Deposited(seller, amount);
    }

    function escrowInfo(uint256 tokenId) public view returns(address seller, address buyer, State state, uint256 amount, uint256 timelock){
        return (escrowById[tokenId].seller, escrowById[tokenId].buyer, escrowById[tokenId].state, escrowById[tokenId].amount, escrowById[tokenId].timelock);
    }

    function sellerDeposits(uint256 tokenId) public view returns (address, uint256) {  
        return (escrowById[tokenId].seller, escrowById[tokenId].amount);
    }

    function buyerDeposits(uint256 tokenId) public view returns (address, uint256) {
        return (escrowById[tokenId].buyer, escrowById[tokenId].amount);   
    }

    function enableRefunds(uint256 tokenId) internal onlyOwner {
        require(now >= _TIMELOCK, "Timelocked.");
        require(escrowById[tokenId].state == State.Active, "Must be active.");
        escrowById[tokenId].state = State.Refunding;
        
        emit RefundsEnabled();
    }

    function refundAllowed(uint256 tokenId) public view returns (bool) {
       return escrowById[tokenId].state == State.Refunding;
    }

    function escrowState(uint256 tokenId) public view returns (State) {
        return escrowById[tokenId].state;
    }

    function confirmDelivery(uint256 tokenId) public {
        require(msg.sender == escrowById[tokenId].buyer, "Not Authorized.");
        if(escrowById[tokenId].state == State.Refunding){
            resetState(tokenId);
        }
        escrowById[tokenId].timelock = 0;
        escrowById[tokenId].state = State.Closed;
        beneficiaryWithdraw(escrowById[tokenId].seller, tokenId);
    }

    function close(uint256 tokenId) internal onlyOwner {
        require(escrowById[tokenId].state == State.Active, "Must be active.");
        escrowById[tokenId].state = State.Closed;
        escrowById[tokenId].timelock = 30 seconds; //give buyer 3 days to confirm

        emit RefundsClosed();
    }

    function withdrawalAllowed(uint256 tokenId) public view returns (bool){
        if(escrowById[tokenId].state != State.Closed) return false;
        return true;
    }

    function beneficiaryWithdraw(address payable seller, uint256 tokenId) internal onlyOwner{
        require(now >= escrowById[tokenId].timelock, "Timelocked.");
        require(escrowById[tokenId].state == State.Closed, "Must be closed.");
        uint256 transactionFee = escrowById[tokenId].amount.mul(fee).div(100);
        uint256 paymentToSeller = escrowById[tokenId].amount.sub(transactionFee);
        escrowById[tokenId].amount = 0;
        eFeeRecipient.transfer(transactionFee);
        escrowById[tokenId].seller.transfer(paymentToSeller);
        escrowById[tokenId].buyer.transfer(tokenId);

        emit Withdrawn(seller, paymentToSeller);
    }

    function issueRefund(address payable buyer, uint256 tokenId) internal onlyOwner{
        require(now >= escrowById[tokenId].timelock, "Timelocked.");
        require(escrowById[tokenId].state == State.Refunding, "Must be refunding.");         
        uint256 refund = escrowById[tokenId].amount;
        escrowById[tokenId].amount = 0;
        escrowById[tokenId].buyer.transfer(refund);
        escrowById[tokenId].seller.transfer(tokenId);

        emit Withdrawn(buyer, refund);
    }

    function resetState(uint256 tokenId) internal {
        escrowById[tokenId].state = State.Active;
    }

}

   
    
