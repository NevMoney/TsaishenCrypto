// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

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

    address payable internal eFeeRecipient; //might not need this if handled in the marketplace

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
    function deposit(address seller, address buyer, uint256 tokenId) internal {
        require(seller != address(0), "Beneficiary cannot be zero address.");
        uint256 amount = msg.value;
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
        require(now >= _TIMELOCK, "Cannot enable refunds while timelock in effect.");
        require(escrowById[tokenId].state == State.Active, "Escrow not active");
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
        require(msg.sender == escrowById[tokenId].buyer, "Only buyer can confirm delivery.");
        if(escrowById[tokenId].state == State.Refunding){
            resetState(tokenId);
        }
        escrowById[tokenId].timelock = 0;
        beneficiaryWithdraw(escrowById[tokenId].seller, tokenId);
    }

    // closes the escrow
    function close(uint256 tokenId) internal onlyOwner {
        require(escrowById[tokenId].state == State.Active, "Can only close while active");
        escrowById[tokenId].state = State.Closed;
        escrowById[tokenId].timelock = 30 seconds; //give buyer 3 days to confirm

        emit RefundsClosed();
    }

    function withdrawalAllowed(uint256 tokenId) public view returns (bool){
        if(escrowById[tokenId].state != State.Closed) return false;
        return true;
    }

    // doesn't reset buyer to 0
    function beneficiaryWithdraw(address payable seller, uint256 tokenId) internal {
        require(now >= escrowById[tokenId].timelock, "Cannot withdraw when timelocked.");
        require(escrowById[tokenId].state == State.Closed, "Escrow not closed.");
        uint256 transactionFee = escrowById[tokenId].amount.mul(3).div(100);
        uint256 paymentToSeller = escrowById[tokenId].amount.sub(transactionFee);
        escrowById[tokenId].amount = 0;
        eFeeRecipient.transfer(transactionFee);
        // address payable seller = address(uint160(_seller));
        escrowById[tokenId].seller.transfer(paymentToSeller);
        escrowById[tokenId].buyer.transfer(tokenId);

        emit Withdrawn(seller, paymentToSeller);
    }

    // doesn't reset seller to 0
    function issueRefund(address payable buyer, uint256 tokenId) internal {
        require(now >= escrowById[tokenId].timelock, "Cannot refund when timelocked.");
        require(escrowById[tokenId].state == State.Refunding, "Can only refund while refunding");         
        uint256 refund = escrowById[tokenId].amount;
        escrowById[tokenId].amount = 0;
        escrowById[tokenId].buyer.transfer(refund);
        escrowById[tokenId].seller.transfer(tokenId);

        emit Withdrawn(buyer, refund);
    }

    //this may need to get reworked
    function resetState(uint256 tokenId) internal onlyOwner{
        escrowById[tokenId].state = State.Active;
    }

}

   
    
