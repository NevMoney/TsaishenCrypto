// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Storage.sol";
import "./tokens/HouseToken.sol";

interface AggregatorV3Interface {

  function decimals() external view returns (uint8);
  function description() external view returns (string memory);
  function version() external view returns (uint256);

  // getRoundData and latestRoundData should both raise "No data present"
  // if they do not have data to report, instead of returning unset values
  // which could be misinterpreted as actual reported values.
  function getRoundData(uint80 _roundId) external view returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );

  function latestRoundData() external view returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );

}

contract Marketplace is Ownable, Storage {
    HouseToken private _houseToken;

    struct Offer {
        address payable seller;
        uint256 price;
        uint256 index;
        uint256 tokenId;
        bool active;
    }

    // store offer information
    mapping(uint256 => Offer) public tokenIdToOffer;
    Offer [] offers;

    using SafeMath for uint256;

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;
        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        return c;
    }
    
    // using chainlink for realtime ETH/USD conversion -- @Dev this is TESTNET rinkeby!!
    AggregatorV3Interface internal priceFeedETH = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);

    uint housePrice = 100000000; //1USD (in function, must multiple by the price in GUI)

    constructor(address _houseTokenAddress) public {
        setHouseToken(_houseTokenAddress);
    }

    event MarketTransaction (string, address, uint);

    // @notice get latest ETH/USD price from Chainlink
    function getPrice() public view returns (int256, uint256){
        (, int256 answer, , uint256 updatedAt, ) = priceFeedETH.latestRoundData();
        return (answer, updatedAt);
    }

    function setHouseToken(address _houseTokenAddress) public onlyOwner{
        _houseToken = HouseToken(_houseTokenAddress);
    }
        
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
        require(_ownsHouse(msg.sender, _tokenId), "Seller not owner");
        require(tokenIdToOffer[_tokenId].active == false, "House not for sale");
        require(_houseToken.isApprovedForAll(msg.sender, address(this)), "Not approved");

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
        require(offer.seller == msg.sender, "Seller not owner"); //ensure owner only can do this

        delete offers[offer.index]; //first delete the index within the array
        delete tokenIdToOffer[_tokenId]; //then remove the id from the mapping

        emit MarketTransaction("Offer removed", msg.sender, _tokenId);
    }

    function buyHouse(uint256 _tokenId) public payable{
        Offer storage offer = tokenIdToOffer[_tokenId];      
        require(offer.active == true, "House not for sale"); 

        // get ETHUSD conversion
        (int256 currentEthPrice, uint256 updatedAt) = (getPrice());

         // check if the user sent enough ether according to the price of the housePrice
        uint256 priceConversion = mul(offer.price, housePrice);
        uint256 priceXETH = mul(priceConversion, 1 ether);
        uint256 housePriceInETH = div(priceXETH, uint(currentEthPrice));

        // set 1% transaction fee and make it house specific (MIGHT NOT BE WORKING)
        uint256 txFee = div(1, 100);
        uint256 houseTransactionFee = mul(txFee, housePriceInETH);

        // convert offer price from USD to ETH and ensure enough funds are sent by buyer
        offer.price = housePriceInETH;
        require(msg.value > housePriceInETH, "Price not matching");

        //price data should be fresher than 1 hour
        require(updatedAt >= now - 1 hours, "Data too old");

        // transfer the funds to the seller minus the 1% transaction fee
        offer.seller.transfer(sub(housePriceInETH, houseTransactionFee));

        // transfer fee to creator (NOT WORKING)
        address payable creator = (0xb0F6d897C9FEa7aDaF2b231bFbB882cfbf831D95);
        creator.transfer(houseTransactionFee);

        //finalize by transfering token ownership
        _houseToken.transferFrom(offer.seller, msg.sender, _tokenId);

        // set the id to inactive
        offers[offer.index].active = false;

        // remove from mapping BEFORE transfer takes place to ensure there is no double sale
        delete tokenIdToOffer[_tokenId];

        // refund user if sent more than the price
        if (msg.value > housePriceInETH){
            msg.sender.transfer(msg.value - housePriceInETH);
        }

        emit MarketTransaction("House purchased", msg.sender, _tokenId);
    }

    // function for owner to borrow funds
    function borrow(uint256 id) public {
        houseInfo[id].value;
        houseInfo[id].income;
    }
}