// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./tokens/HouseToken.sol";
import "./TsaishenUsers.sol";
import "./TsaishenEscrow.sol";
import "./TokenPrices.sol";
import "./UniversalERC20.sol";

contract Marketplace is Ownable, ReentrancyGuard, TsaishenEscrow {
    HouseToken private _houseToken;
    TsaishenUsers private _tsaishenUsers;
    TokenPrices private _tokenPrices;

    using SafeMath for uint256;
    using UniversalERC20 for IERC20;

    struct Offer {
        address payable seller;
        uint256 price;
        uint256 income;
        uint256 loan;
        uint256 index;
        uint256 tokenId;
        bool active;
    }

    // store offer information
    mapping(uint256 => Offer) internal offerDetails;
    Offer [] offers;

    uint256 housePrice = 100000000; //1USD (in function, must multiple by the price in GUI)
    uint256 txFee = 2; //2% transaction fee
    
    address payable internal feeRecipient;

    // MUST ALWAYS BE PUBLIC!
    constructor(
        address _userContractAddress, 
        address _houseTokenAddress, 
        address payable _feeRecipient,
        address _tokenPricesAddress
        ) public {
        _tsaishenUsers = TsaishenUsers(_userContractAddress);
        _houseToken = HouseToken(_houseTokenAddress);
        feeRecipient = _feeRecipient;
        _tokenPrices = TokenPrices(_tokenPricesAddress);
    }

    event MarketTransaction (string, address, uint);
 
    function getOffer(uint256 _tokenId) public view returns 
        (address seller, 
        uint256 price, 
        uint256 income, 
        uint256 loan, 
        uint256 index, 
        uint256 tokenId, 
        bool active) {
        Offer storage offer = offerDetails[_tokenId];//get the tokenId from the mapping

        //return details for that offer
        return 
        (offer.seller, 
        offer.price, 
        offer.income, 
        offer.loan, 
        offer.index, 
        offer.tokenId, 
        offer.active); 
    }

    function getAllTokenOnSale() public view returns(uint256[] memory listOfOffers) {
        uint256 forSaleList = offers.length;//this gives us the length of the offers array

        if(forSaleList == 0) {
            return new uint256[](0);
        }
        else{
            uint256[] memory result = new uint256[](forSaleList);
            uint256 offerId;

            for(offerId = 0; offerId < forSaleList; offerId++)
                if(offers[offerId].active == true){
                    result[offerId] = offers[offerId].tokenId;
                }
            return result;

        }
    }

    //internal function to verify that particular address owns particular tokenID
    function _ownsHouse(address _address, uint256 _tokenId) internal view returns (bool) {
        return (_houseToken.ownerOf(_tokenId) == _address);
    }

    function sellHouse(uint256 _price, uint256 _tokenId) public nonReentrant {
        require(_ownsHouse(msg.sender, _tokenId), "ERR11");
        require(offerDetails[_tokenId].active == false, "ERR20");
        // comment this out for local testing
        require(_houseToken.isApprovedForAll(msg.sender, address(this)), "ERR10");

        // get income amount from houseToken
        ( , uint256 _income, ) = _houseToken.getHouse(_tokenId);

        //create offer by inserting items into the array
        Offer memory _offer = Offer({
            seller: msg.sender,
            price: _price,
            income: _income,
            loan: 0,
            active: true,
            tokenId: _tokenId,
            index: offers.length
        });

        offerDetails[_tokenId] = _offer; //add offer to the mapping
        offers.push(_offer); //add to the offers array

        emit MarketTransaction("House listed", msg.sender, _tokenId);
    }

    function removeOffer(uint256 _tokenId) public {
        Offer storage offer = offerDetails[_tokenId]; //first access the offer
        require(offer.seller == msg.sender, "ERR11"); //ensure owner only can do this
   
        delete offers[offer.index]; //first delete the index within the array
        delete offerDetails[_tokenId]; //then remove the id from the mapping

        emit MarketTransaction("Offer removed", msg.sender, _tokenId);
    }

    // function to allow users to purchase with any valid crypto
    function buyHouse (IERC20 token, uint256 _tokenId) public nonReentrant{
        // access offer
        Offer storage offer = offerDetails[_tokenId];

        // make sure it's active  
        require(offer.active == true, "ERR20");
        
        // get price conversion
        (int256 currentPrice, uint256 updatedAt) = (_tokenPrices.getOracleUsdPrice(address (token)));

        // convert USD price to crypto
        uint256 cryptoHousePrice = offer.price.mul(housePrice).mul(1 ether).div(uint(currentPrice));
        
        // ensure oracle price data is recent
        require(updatedAt >= now - 1 hours, "ERR22");

        // calculate transaction fee
        uint256 houseTransactionFee = cryptoHousePrice.mul(txFee).div(100);

        // transfer funds from buyer
        token.universalTransferFromSenderToThis(cryptoHousePrice);
        
        // pay the fee collector
        require(token.universalTransfer(feeRecipient, houseTransactionFee));
        
        // pay the seller
        require(token.universalTransfer(offer.seller, cryptoHousePrice.sub(houseTransactionFee)));
        
        // transfer house to buyer
        _houseToken.safeTransferFrom(offer.seller, msg.sender, _tokenId);
        
        // make offer inactive and take off market
        offers[offer.index].active = false;
        
        // remove from offer mapping to prevent double sale
        delete offerDetails[_tokenId];

        // handle users ledger
        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, _tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, _tokenId);

        emit MarketTransaction("House purchased", msg.sender, _tokenId);
    }

    // function buyHouseWithEscrowEth (uint256 _tokenId) public payable nonReentrant{
    //     Offer storage offer = offerDetails[_tokenId];      
    //     require(offer.active == true, "ERR20"); 

    //     (int256 currentEthPrice, uint256 updatedAt) = (getEthPrice());
    //     uint256 housePriceInETH = offer.price.mul(housePrice).mul(1 ether).div(uint(currentEthPrice));
        
    //     require(msg.value > housePriceInETH, "ERR21");
    //     require(updatedAt >= now - 1 hours, "ERR22");

    //     //transfer funds into escrow
    //     deposit(offer.seller, msg.sender, housePriceInETH, _tokenId);

    //     offers[offer.index].active = false;

    //     // add/update user
    //     _tsaishenUsers.addUser(msg.sender);

    //     // refund user if sent more than the price
    //     if (msg.value > housePriceInETH){
    //         msg.sender.transfer(msg.value.sub(housePriceInETH));
    //     }

    //     emit MarketTransaction("House in Escrow", msg.sender, _tokenId);
    // }

    // function escrowBuyUsdc (uint256 _tokenId) public payable nonReentrant{
    //     Offer storage offer = offerDetails[_tokenId];      
    //     require(offer.active == true, "ERR20"); 

    //     (int256 currentUsdcPrice, uint256 usdcUpdatedAt) = (getUsdcPrice());
    //     uint256 housePriceInUSDC = offer.price.mul(housePrice).mul(1 ether).div(uint(currentUsdcPrice));

    //     require(usdcUpdatedAt >= now - 1 hours, "ERR22");
    //     require(usdc.approve(address(this), housePriceInUSDC), "ERR10");
    //     require(usdc.transferFrom(msg.sender, address(this), housePriceInUSDC), "ERR21");

    //     //transfer funds into escrow
    //     deposit(offer.seller, msg.sender, housePriceInUSDC, _tokenId);

    //     offers[offer.index].active = false;

    //     // add/update user
    //     _tsaishenUsers.addUser(msg.sender);

    //     emit MarketTransaction("House in Escrow", msg.sender, _tokenId);
    // }

    function permitRefunds(uint256 _tokenId) public onlyOwner {
        Offer storage offer = offerDetails[_tokenId];
        enableRefunds(_tokenId);
        issueRefund(escrowById[_tokenId].buyer, _tokenId);

        offers[offer.index].active = true;

        emit MarketTransaction("Escrow Refunded", escrowById[_tokenId].buyer, _tokenId);
    }

    // This releases funds to seller and transfers token to buyer
    function closeEscrow(uint256 _tokenId) public onlyOwner {
        Offer storage offer = offerDetails[_tokenId];
        require(escrowById[_tokenId].amount > 0, "ERR20");
        
        resetState(_tokenId);
        close(_tokenId);
        
        beneficiaryWithdraw(offer.seller, _tokenId);

        //remove token from the mapping
        delete offerDetails[_tokenId];    

        // finalize transaction with users
        _tsaishenUsers.addHouseToUser(escrowById[_tokenId].buyer, _tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, _tokenId);

        emit MarketTransaction("House SOLD", offer.seller, _tokenId);
    }

}