// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Storage.sol";
import "./tokens/HouseToken.sol";

contract Marketplace is Ownable, Storage {
    HouseToken private _houseToken;

    function setHouseToken(address _houseTokenAddress) public onlyOwner{
        _houseToken = HouseToken(_houseTokenAddress);
    }

    constructor(address _houseTokenAddress) public {
        setHouseToken(_houseTokenAddress);
    }

    event MarketTransaction (string, address, uint);
        
    function getOffer(uint256 _tokenId) public view returns (address seller, uint256 price, uint256 index, uint256 tokenId, bool active){
        Offer storage offer = tokenIdToOffer[_tokenId];//get the tokenId from the mapping

        return (offer.seller, offer.price, offer.index, offer.tokenId, offer.active);//return details for that offer
    }

    function getAllTokenOnSale() public view returns(uint256[] memory listOfOffers){
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
    function _ownsHouse(address _address, uint256 _tokenId) internal view returns (bool){
        return (_houseToken.ownerOf(_tokenId) == _address);
    }

    function setOffer(uint256 _price, uint256 _tokenId) public {
        require(_ownsHouse(msg.sender, _tokenId), "ERR20");
        require(tokenIdToOffer[_tokenId].active == false, "ERR30");
        require(_houseToken.isApprovedForAll(msg.sender, address(this)), "ERR40");

        //create offer by inserting items into the array
        Offer memory _offer = Offer({
            seller: msg.sender,
            price: _price,
            active: true,
            tokenId: _tokenId,
            index: offers.length
        });

        tokenIdToOffer[_tokenId] = _offer; //add offer to the mapping
        offers.push(_offer); //add to the offers array

        emit MarketTransaction("Offer created", msg.sender, _tokenId);
    }

    function removeOffer(uint256 _tokenId) public{
        Offer storage offer = tokenIdToOffer[_tokenId]; //first access the offer
        require(offer.seller == msg.sender, "ERR20"); //ensure owner only can do this

        delete offers[offer.index]; //first delete the index within the array
        delete tokenIdToOffer[_tokenId]; //then remove the id from the mapping

        emit MarketTransaction("Offer removed", msg.sender, _tokenId);
    }

    function buyHouse(uint256 _tokenId) public payable{
        Offer storage offer = tokenIdToOffer[_tokenId];
        require(msg.value == offer.price, "ERR10"); 
        require(offer.active == true, "ERR50"); 

        // transfer the funds to the seller
        offer.seller.transfer(offer.price);
        //finalize by transfering the token/cat ownership
        _houseToken.transferFrom(offer.seller, msg.sender, _tokenId);

        // set the id to inactive
        offers[offer.index].active = false;
        // remove from mapping BEFORE transfer takes place to ensure there is no double sale
        delete tokenIdToOffer[_tokenId];
        

        emit MarketTransaction("House purchased", msg.sender, _tokenId);
    }

    // function for owner to sell house
    function sell(uint256 id) public {
        houseInfo[id].value;
        houseInfo[id].income;
    }

    // function for owner to borrow funds
    function borrow(uint256 id) public {
        houseInfo[id].value;
        houseInfo[id].income;
    }
}