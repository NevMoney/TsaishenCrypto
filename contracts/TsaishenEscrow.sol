// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./libs/UniversalERC20.sol";

contract TsaishenEscrow is Ownable{

    using SafeMath for uint256;
    using Address for address payable;
    using UniversalERC20 for IERC20;

    event Deposited(string, address indexed seller, uint256 weiAmount);
    event Withdrawn(string, address indexed seller, uint256 weiAmount);
    event RefundsClosed(string, address, uint256);
    event RefundsEnabled(string, address, uint256);

    enum State { Active, Refunding, Closed }

    // timelock will be 10 days; TESTING: 1 minute
    uint256 private constant _TIMELOCK= 1 minutes;
    address payable internal feeRecipient;
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

    // *** GETTER ***
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

    // *** INTERNAL ***
    function _deposit(IERC20 _token, address _seller, address _buyer, uint256 _amount, uint256 _tokenId) internal {
        require(_seller != address(0), "TE: Address can't be zero.");

        // transfer funds from buyer
        _token.universalTransferFromSenderToThis(_amount);

        Escrow memory _escrow = Escrow(_token, payable(_seller), payable(_buyer), State.Active, _amount, now + _TIMELOCK);
        escrowById[_tokenId] = _escrow;

        emit Deposited("Funds deposited in escrow.", _seller, _amount);
    }

    //gives ability to either party to get out of the deal, even if in escrow
    function _cancelEscrowSale(uint256 _tokenId) internal {
        require(escrowById[_tokenId].state != State.Closed, "TE: Cannot be closed.");

        uint256 _refund = escrowById[_tokenId].amount;
        escrowById[_tokenId].amount = 0;
        
        uint256 _paymentToProducer = 1 ether;
        uint256 _paymentToHarmedParty = 1 ether;

        require(escrowById[_tokenId].token.universalTransfer(feeRecipient, _paymentToProducer));
        require(escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].buyer, _refund));
        // house token transfer will be done in marketplace

        if(msg.sender == escrowById[_tokenId].buyer){
            require(escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].seller, _paymentToHarmedParty));
        }
        else {
            require(escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].buyer, _paymentToHarmedParty));
        }
    }

    // this if for buyer only
    function _confirmDelivery(uint256 _tokenId) internal {
        require(msg.sender == escrowById[_tokenId].buyer, "TE: Not authorized.");

        escrowById[_tokenId].state = State.Closed;
        escrowById[_tokenId].timelock = 0;
        
        _beneficiaryWithdraw(escrowById[_tokenId].seller, _tokenId, feeRecipient);
    }

    function _beneficiaryWithdraw(address payable _seller, uint256 _tokenId, address payable _feeRecipient) internal {
        require(msg.sender == escrowById[_tokenId].seller || msg.sender == owner(), "TE: Not authorized.");
        require(now >= escrowById[_tokenId].timelock, "TE: Timelocked.");
        require(escrowById[_tokenId].state == State.Closed, "TE: Must be closed.");

        uint256 transactionFee = escrowById[_tokenId].amount.mul(fee).div(100);
        uint256 paymentToSeller = escrowById[_tokenId].amount.sub(transactionFee);
        escrowById[_tokenId].amount = 0;
        
        // transfer fee to producer
        require(escrowById[_tokenId].token.universalTransfer(_feeRecipient, transactionFee));

        // transfer proceeds to seller
        require(escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].seller, paymentToSeller));

        // transfer house to buyer done in marketplace

        emit Withdrawn("Funds transferred to seller.", _seller, paymentToSeller);
    }

    // -- onlyOwner --
    // this extends timelock for 3 days (30 seconds for testing)
    function _extendTimelock(uint256 _tokenId) internal onlyOwner {
        escrowById[_tokenId].timelock = 30 seconds;
    }

    function _cancelTimelock(uint256 _tokenId) internal onlyOwner {
        escrowById[_tokenId].timelock = 0;
    } 

    function _resetState(uint256 _tokenId) internal onlyOwner {
        escrowById[_tokenId].state = State.Active;
    }
    
    function _enableRefunds(uint256 _tokenId) internal onlyOwner {
        require(now >= escrowById[_tokenId].timelock, "TE: Timelocked.");
        require(escrowById[_tokenId].state == State.Active, "TE: Must be active.");
        escrowById[_tokenId].state = State.Refunding;
        
        emit RefundsEnabled("Escrow refund enabled.", escrowById[_tokenId].buyer, _tokenId);
    }

    function _close(uint256 _tokenId) internal onlyOwner {
        require(escrowById[_tokenId].state == State.Active, "TE: Must be active.");
        escrowById[_tokenId].state = State.Closed;
        escrowById[_tokenId].timelock = 30 seconds; //give buyer 3 days to confirm

        emit RefundsClosed("Refund closed.", escrowById[_tokenId].buyer, _tokenId);
    }

    function _issueRefund(address payable _buyer, uint256 _tokenId) internal onlyOwner{
        require(now >= escrowById[_tokenId].timelock, "TE: Timelocked.");
        require(escrowById[_tokenId].state == State.Refunding, "TE: Must be refunding.");         
        
        uint256 _refund = escrowById[_tokenId].amount;
        escrowById[_tokenId].amount = 0;

        // refund buyer
        require(escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].buyer, _refund));

        // return house to seller done in marketplace

        emit Withdrawn("Funds refunded to buyer.", _buyer, _refund);
    }

}