// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Storage.sol";

contract TsaishenEscrow is Ownable, Storage{
    using SafeMath for uint256;
    using Address for address payable;
    
    event Deposited(string, address indexed seller, uint256 weiAmount);
    event Withdrawn(string, address indexed seller, uint256 weiAmount);
    event RefundsClosed(string, address, uint256);
    event RefundsEnabled(string, address, uint256);

    uint256 private constant _TIMELOCK= 10 days;
    address payable internal feeRecipient;
    uint256 fee = 3;

     // *** GETTER ***
    function escrowInfo(uint256 _tokenId) public view returns(
        IERC20 token,
        address seller, 
        address buyer, 
        State state, 
        uint256 amount, 
        uint256 timelock,
        uint256 tokenId){
        return (
            escrowById[_tokenId].token,
            escrowById[_tokenId].seller, 
            escrowById[_tokenId].buyer, 
            escrowById[_tokenId].state, 
            escrowById[_tokenId].amount, 
            escrowById[_tokenId].timelock,
            escrowById[_tokenId].tokenId);
    }

    function getEscrowByBuyer(address _buyer) public view returns(uint256){
        return escrowBuyerToId[_buyer];
    }

    function refundAllowed(uint256 tokenId) public view returns (bool) {
       return escrowById[tokenId].state == State.Refunding;
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

        Escrow memory _escrow = Escrow(_token, payable(_seller), payable(_buyer), State.Active, _amount, now + _TIMELOCK, _tokenId);
        escrowBuyerToId[_buyer] = _tokenId;
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

        escrowById[_tokenId].token.universalTransfer(feeRecipient, _paymentToProducer);
        escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].buyer, _refund);

        if(msg.sender == escrowById[_tokenId].buyer){
            escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].seller, _paymentToHarmedParty);
        }
        else {
            escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].buyer, _paymentToHarmedParty);
        }

        address _buyer = escrowById[_tokenId].buyer;

        delete escrowById[_tokenId];
        delete escrowBuyerToId[_buyer];
    }

    // this extends escrow by 3 days
    function _extendTimelock(uint256 _tokenId) internal {
        escrowById[_tokenId].timelock = now.add(3 days);
    }

    function _enableRefunds(uint256 _tokenId) internal {
        require(now >= escrowById[_tokenId].timelock, "TE: Timelocked.");
        require(escrowById[_tokenId].state == State.Active, "TE: Must be active.");
        escrowById[_tokenId].state = State.Refunding;
        
        emit RefundsEnabled("Escrow refund enabled.", escrowById[_tokenId].buyer, _tokenId);
    }

    function _issueRefund(address payable _buyer, uint256 _tokenId) internal {
        require(now >= escrowById[_tokenId].timelock, "TE: Timelocked.");
        require(escrowById[_tokenId].state == State.Refunding, "TE: Must be refunding.");         
        
        uint256 _refund = escrowById[_tokenId].amount;
        escrowById[_tokenId].amount = 0;

        // refund buyer
        escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].buyer, _refund);

        delete escrowById[_tokenId];
        delete escrowBuyerToId[_buyer];

        emit Withdrawn("Funds refunded to buyer.", _buyer, _refund);
    }

    function _confirmDelivery(uint256 _tokenId) internal {
        require(msg.sender == escrowById[_tokenId].buyer, "TE: Buyer only.");

        escrowById[_tokenId].state = State.Closed;
        escrowById[_tokenId].timelock = 0;
        
        _beneficiaryWithdraw(escrowById[_tokenId].seller, _tokenId, feeRecipient);
    }   

    function _beneficiaryWithdraw(address payable _seller, uint256 _tokenId, address payable _feeRecipient) internal {
        // require(msg.sender == escrowById[_tokenId].seller || msg.sender == owner(), "TE: Not authorized.");
        require(now >= escrowById[_tokenId].timelock, "TE: Timelocked.");
        require(escrowById[_tokenId].state == State.Closed, "TE: Must be closed.");

        uint256 transactionFee = escrowById[_tokenId].amount.mul(fee).div(100);
        uint256 paymentToSeller = escrowById[_tokenId].amount.sub(transactionFee);
        escrowById[_tokenId].amount = 0;
        
        // transfer fee to producer
        escrowById[_tokenId].token.universalTransfer(_feeRecipient, transactionFee);

        // transfer proceeds to seller
        escrowById[_tokenId].token.universalTransfer(escrowById[_tokenId].seller, paymentToSeller);

        address _buyer = escrowById[_tokenId].buyer;

        delete escrowById[_tokenId];
        delete escrowBuyerToId[_buyer];

        emit Withdrawn("Funds transferred to seller.", _seller, paymentToSeller);
    }

    function _close(uint256 _tokenId) internal {
        require(escrowById[_tokenId].state == State.Active, "TE: Must be active.");
        escrowById[_tokenId].state = State.Closed;
        _extendTimelock(_tokenId);

        emit RefundsClosed("Refund closed.", escrowById[_tokenId].buyer, _tokenId);
    }  

    // -- onlyOwner --
    function _cancelTimelock(uint256 _tokenId) internal onlyOwner {
        escrowById[_tokenId].timelock = 0;
    } 

    function _resetState(uint256 _tokenId) internal onlyOwner {
        escrowById[_tokenId].state = State.Active;
    }  

}