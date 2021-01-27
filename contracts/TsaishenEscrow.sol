// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./UniversalERC20.sol";

contract TsaishenEscrow is Ownable{

    using SafeMath for uint256;
    using Address for address payable;
    using UniversalERC20 for IERC20;

    event Deposited(address indexed seller, uint256 weiAmount);
    event Withdrawn(address indexed seller, uint256 weiAmount);
    event RefundsClosed();
    event RefundsEnabled();

    enum State { Active, Refunding, Closed }

    // timelock will be 10 days; TESTING: 1 minute
    uint256 private constant _TIMELOCK= 1 minutes;
    address payable internal eFeeRecipient;
    uint256 fee = 3;
    
    // tokenId to Struct
    mapping(uint256 => Escrow) escrowById;

    struct Escrow {
        IERC20 token; //does this need to say address IERC20 token???
        address payable seller; //beneficiary
        address payable buyer; //refundee
        State state;
        uint256 amount;
        uint256 timelock;
    }
   
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

    
    // *** INTERNAL SETTER FUNCTIONS ***
    function _deposit(IERC20 _token, address _seller, address _buyer, uint256 _amount, uint256 _tokenId) internal {
        require(_seller != address(0), "Address can't be zero.");

        // transfer funds from buyer
        _token.universalTransferFromSenderToThis(_amount);

        Escrow memory _escrow = Escrow(_token, payable(_seller), payable(_buyer), State.Active, _amount, now + _TIMELOCK);
        escrowById[_tokenId] = _escrow;

        emit Deposited(_seller, _amount);
    }

    function _resetState(uint256 _tokenId) internal {
        escrowById[_tokenId].state = State.Active;
    }

    // === ONLY OWNER ===
    function _enableRefunds(uint256 _tokenId) internal onlyOwner {
        require(now >= _TIMELOCK, "Timelocked.");
        require(escrowById[_tokenId].state == State.Active, "Must be active.");
        escrowById[_tokenId].state = State.Refunding;
        
        emit RefundsEnabled();
    }

    function _issueRefund(address payable _buyer, uint256 _tokenId) internal onlyOwner{
        require(now >= escrowById[_tokenId].timelock, "Timelocked.");
        require(escrowById[_tokenId].state == State.Refunding, "Must be refunding.");         
        
        uint256 _refund = escrowById[_tokenId].amount;
        escrowById[_tokenId].amount = 0;

        // refund buyer
        escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].buyer, _refund);

        // return house to seller
        escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].seller, _tokenId);

        emit Withdrawn(_buyer, _refund);
    }

    function _close(uint256 _tokenId) internal onlyOwner {
        require(escrowById[_tokenId].state == State.Active, "Must be active.");
        escrowById[_tokenId].state = State.Closed;
        escrowById[_tokenId].timelock = 30 seconds; //give buyer 3 days to confirm

        emit RefundsClosed();
    }

    function _beneficiaryWithdraw(address payable _seller, uint256 _tokenId) internal onlyOwner{
        require(now >= escrowById[_tokenId].timelock, "Timelocked.");
        require(escrowById[_tokenId].state == State.Closed, "Must be closed.");

        uint256 transactionFee = escrowById[_tokenId].amount.mul(fee).div(100);
        uint256 paymentToSeller = escrowById[_tokenId].amount.sub(transactionFee);
        escrowById[_tokenId].amount = 0;
        
        // transfer fee to producer
        escrowById[_tokenId].token.universalTransfer(eFeeRecipient, transactionFee);

        // transfer proceeds to seller
        escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].seller, paymentToSeller);

        // transfer house to buyer
        escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].buyer, _tokenId);

        emit Withdrawn(_seller, paymentToSeller);
    } 

    // *** PUBLIC GETTER FUNCTIONS ***
    function escrowInfo(uint256 tokenId) public view returns(
        address seller, 
        address buyer, 
        State state, 
        uint256 amount, 
        uint256 timelock){
        return (
            escrowById[tokenId].seller, 
            escrowById[tokenId].buyer, 
            escrowById[tokenId].state, 
            escrowById[tokenId].amount, 
            escrowById[tokenId].timelock);
    }

    function sellerDeposits(uint256 tokenId) public view returns (address, uint256) {  
        return (escrowById[tokenId].seller, escrowById[tokenId].amount);
    }

    function buyerDeposits(uint256 tokenId) public view returns (address, uint256) {
        return (escrowById[tokenId].buyer, escrowById[tokenId].amount);   
    }

    function refundAllowed(uint256 tokenId) public view returns (bool) {
       return escrowById[tokenId].state == State.Refunding;
    }

    function escrowState(uint256 tokenId) public view returns (State) {
        return escrowById[tokenId].state;
    }

    function withdrawalAllowed(uint256 tokenId) public view returns (bool){
        if(escrowById[tokenId].state != State.Closed) return false;
        return true;
    }

    // only Buyer
    function confirmDelivery(uint256 tokenId) public {
        require(msg.sender == escrowById[tokenId].buyer, "Not authorized.");
        if(escrowById[tokenId].state == State.Refunding){
            _resetState(tokenId);
        }
        escrowById[tokenId].timelock = 0;
        escrowById[tokenId].state = State.Closed;
        _beneficiaryWithdraw(escrowById[tokenId].seller, tokenId);
    }
}

   
    
