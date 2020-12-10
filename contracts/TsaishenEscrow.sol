// // SPDX-License-Identifier: MIT

// pragma solidity ^0.6.10;

// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/math/SafeMath.sol";
// import "@openzeppelin/contracts/utils/Address.sol";
// import "./Marketplace.sol";

// /** 
// money goes into the escrow until deed has been filled out and mailed to county.
// When completed or time runs out the money is released from Escrow
// We will use oracle to verify deed transfer with easypost (through Chainlink). 

// beneficiary = buyer
// */

// contract TsaishenEscrow {
//     Marketplace private _marketplace;
//     using SafeMath for uint256;
//     using Address for address payable;

//     event Deposited(address indexed seller, uint256 weiAmount);
//     event Withdrawn(address indexed seller, uint256 weiAmount);
//     event RefundsClosed();
//     event RefundsEnabled();

//     enum State { Active, Refunding, Closed }
//     State private _state;

//     uint256 txFee = 2; //2% transaction fee  
//     address payable internal feeRecipient;
//     address payable buyer;
//     address payable seller;

//     mapping(address => uint256) private _deposits;

//     // MUST ALWAYS BE PUBLIC!
//     constructor(address _escrowAgent, address payable _feeRecipient, address _buyer, address _seller) public {
//         _marketplace = Marketplace(_escrowAgent);
//         feeRecipient = _feeRecipient;
//         buyer = _buyer;
//         seller = _seller;
//         _state = State.Active;
//     }

//     // deposit funds to be held for the beneficiary (seller)
//     function depositForSeller(address seller) public payable onlyOwner {
//         require(_state == State.Active, "Can only deposit while active");
//         uint256 amount = msg.value;
//         _deposits[seller] = _deposits[seller].add(amount);

//         emit Deposited(seller, amount);
//     }

//     // houseIds deposited for beneficiary (buyer)
//     function depositForBuyer(address buyer, uint256 houseId) public onlyOwner {
//         require(_state == State.Active, "Can only deposit while active");
//         _deposits[buyer] = _deposits[buyer].add(houseId);

//         emit Deposited(buyer, houseId);
//     }

//     function deposistsFor(address recipient) public view returns (uint256) {  
//         return _deposits[recipient];
//     }

//     function enableRefunds() public onlyOwner {
//         require(_state == State.Active, "Can only enable refunds while active");
//         _state = State.Refunding;
        
//         emit RefundsEnabled();
//     }

//     function refundAllowed() public view returns (bool) {
//        return _state == State.Refunding;
//     }

//     function issueRefund(address payable refundee) public returns (uint256){
//         require(_state == State.Refunding, "Can only refund while refunding");         
//         uint256 refund = _deposits[refundee];
//         _deposits[refundee] = 0;
//         refundee.transfer(refund);
//     }

//     function state() public view returns (State) {
//         return _state;
//     }

//     // function to confirm that deed was indeed transfered
//     function confirmDelivery() public {
//         require(_state == State.Active, "Escrow not active.");
//         _state = State.Closed;

//         emit RefundsClosed();
//     }

//     // closes the escrow, which closes the refunds - this should use timelock functionality
//     function close() public onlyOwner {
//         require(_state == State.Active, "RefundEscrow: can only close while active");
//         _state = State.Closed;

//         emit RefundsClosed();
//     }

//     function withdrawalAllowed() public view virtual returns (bool);

//     function beneficiaryWithdraw() public {
//         require(_state == State.Closed, "Escrow not closed.");
//         _beneficiary.transfer(address(this).balance);
//     }

//     function sellerWithdraw(address payable seller) public onlyOwner {
//         require(withdrawalAllowed(), "Not allowed to withdraw");
//         uint256 payment = _deposits[seller];
//         _deposits[seller] = 0;
//         seller.sendValue(payment);

//         emit Withdrawn(seller, payment);
//     }

//     function buyerWithdraw(address payable buyer) public onlyOwner {
//         require(withdrawalAllowed(), "Not allowed to withdraw");
//         uint256 payment = _deposits[buyer];
//         _deposits[buyer] = 0;
//         seller.sendValue(payment);

//         emit Withdrawn(buyer, payment);
//     }



//     // function enterEscrow(address payable buyer, address payable seller, uint256 sellingPrice) public payable onlyOwner {
//     //     State = State.Active;
//     //     _beneficiary = seller;
//     //     deposit(buyer);
//     //     startTimelock(State.Active);
//     // }
 
//     // function permitBuyerRefund() public notLocked(State.Active) {
//     //     enableRefunds();
//     //     withdrawalAllowed(true);
//     // }

//     // function payout() public {
//     //     uint256 houseTransactionFee = msg.value.mul(txFee).div(100);
//     //     feeRecipient.transfer(houseTransactionFee);
//     //     uint256 fundsToSeller = msg.value.sub(houseTransactionFee);
//     //     close();
//     //     beneficiaryWithdraw();
//     // }

//     // timelock will be 10 days, however for testing purposes we'll make it 1 minute
//     // uint256 private constant _TIMELOCK = 1 minutes;
//     // mapping (State => uint256) public timelock;

    
//     // // modifier to check if NOW is greater than when activated timelock
//     // modifier notLocked(State _st){
//     //     require(timelock[_st]!=0 && timelock[_st] <= now, "Function is timelocked");
//     //     _;
//     // }

//     // // timelock unlock function after the declared TIMELOCK timeline
//     // function startTimelock(State _st) public onlyOwner {
//     //     timelock[_st] = now + _TIMELOCK;
//     // }

//     // // lock timelock
//     // function cancelTimelock(State _st) public onlyOwner {
//     //     timelock[_st] = 0;
//     // }
        
// }

   
    
