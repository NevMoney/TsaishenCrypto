// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./tokens/HouseToken.sol";
import "./Storage.sol";
import "./TsaishenUsers.sol";
import "./TsaishenEscrow.sol";

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

contract Marketplace is Ownable, Storage, ReentrancyGuard, TsaishenEscrow {
    HouseToken private _houseToken;
    TsaishenUsers private _tsaishenUsers;

    using SafeMath for uint256;

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
 
    // using chainlink for realtime crypto/USD conversion -- @Dev this is TESTNET rinkeby!!
    AggregatorV3Interface internal priceFeedETH = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
    AggregatorV3Interface internal priceFeedDAI = AggregatorV3Interface(0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF);
    AggregatorV3Interface internal priceFeedUSDC = AggregatorV3Interface(0xa24de01df22b63d23Ebc1882a5E3d4ec0d907bFB);

    //pull DAI & USDC addresses
    address daiAddress = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address usdcAddress = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    IERC20 public dai;
    IERC20 public usdc;

    uint256 housePrice = 100000000; //1USD (in function, must multiple by the price in GUI)
    uint256 txFee = 2; //2% transaction fee
    
    address payable internal feeRecipient;

    // MUST ALWAYS BE PUBLIC!
    constructor(
        address _userContractAddress, 
        address _houseTokenAddress, 
        address payable _feeRecipient, 
        IERC20 _dai, 
        IERC20 _usdc) public {
        setUserContract(_userContractAddress);
        setHouseToken(_houseTokenAddress);
        feeRecipient = _feeRecipient;
        dai = _dai;
        usdc = _usdc;
    }

    event MarketTransaction (string, address, uint);
    
    function setHouseToken(address _houseTokenAddress) internal onlyOwner {
        _houseToken = HouseToken(_houseTokenAddress);
    }

    function setUserContract(address _userContractAddress) internal onlyOwner {
        _tsaishenUsers = TsaishenUsers(_userContractAddress);
    }

    // @notice get latest ETH/USD price from Chainlink
    function getEthPrice() public pure returns (int256, uint256) {
        // (, int256 answer, , uint256 updatedAt, ) = priceFeedETH.latestRoundData();
        // return (answer, updatedAt);
        return (10000000000, 1607202219); //this is for local testing DO NOT USE for other networks
    }

    // @notice get latest DAI/USD price from Chainlink
    function getDaiPrice() public view returns (int256, uint256) {
        (, int256 answer, , uint256 updatedAt, ) = priceFeedDAI.latestRoundData();
        return (answer, updatedAt);
        // return (10000000000, 1607202219); //this is for local testing DO NOT USE for other networks
    }

    // @notice get latest USDC/USD price from Chainlink
    function getUsdcPrice() public view returns (int256, uint256) {
        (, int256 answer, , uint256 updatedAt, ) = priceFeedUSDC.latestRoundData();
        return (answer, updatedAt);
        // return (10000000000, 1607202219); //this is for local testing DO NOT USE for other networks
    }
        
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

    function sellHouse(uint256 _price, uint256 _tokenId) public nonReentrant{
        require(_ownsHouse(msg.sender, _tokenId), "Seller not owner");
        require(offerDetails[_tokenId].active == false, "House already listed");
        // comment this out for local testing
        require(_houseToken.isApprovedForAll(msg.sender, address(this)), "Not approved");

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

        emit MarketTransaction("House listed for sale", msg.sender, _tokenId);
    }

    function removeOffer(uint256 _tokenId) public {
        Offer storage offer = offerDetails[_tokenId]; //first access the offer
        require(offer.seller == msg.sender, "Not an owner"); //ensure owner only can do this
   
        delete offers[offer.index]; //first delete the index within the array
        delete offerDetails[_tokenId]; //then remove the id from the mapping

        emit MarketTransaction("Offer removed", msg.sender, _tokenId);
    }

    function buyHouseWithETH (uint256 _tokenId) public payable nonReentrant{
        Offer storage offer = offerDetails[_tokenId];      
        require(offer.active == true, "House not for sale");

        // get ETHUSD conversion
        (int256 currentEthPrice, uint256 updatedAt) = (getEthPrice());

        // convert USD house price to ETH
        uint256 housePriceInETH = offer.price.mul(housePrice).mul(1 ether).div(uint(currentEthPrice));

        // make transaction fee house specific
        uint256 houseTransactionFee = housePriceInETH.mul(txFee).div(100);

        // convert offer price from USD to ETH and ensure enough funds are sent by buyer
        require(msg.value > housePriceInETH, "Price not matching");

        //price data should be fresher than 1 hour
        require(updatedAt >= now - 1 hours, "Data too old");

        // transfer fee to feeRecipient
        feeRecipient.transfer(houseTransactionFee);

        // transfer proceeds to seller - txFee
         offer.seller.transfer(housePriceInETH.sub(houseTransactionFee));

        //finalize by transfering token ownership
        _houseToken.safeTransferFrom(offer.seller, msg.sender, _tokenId);

        // set the id to inactive
        offers[offer.index].active = false;

        // remove from mapping BEFORE transfer takes place to ensure there is no double sale
        delete offerDetails[_tokenId];

        // refund user if sent more than the price
        if (msg.value > housePriceInETH){
            msg.sender.transfer(msg.value - housePriceInETH);
        }

        // add/update user info
        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, _tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, _tokenId);

        emit MarketTransaction("House purchased", msg.sender, _tokenId);
    }

    // function to allow users to purchase with DAI
    function buyWithDAI (uint256 _tokenId) public payable nonReentrant{
        Offer storage offer = offerDetails[_tokenId];      
        require(offer.active == true, "House not for sale");

        (int256 currentDaiPrice, uint256 daiUpdatedAt) = (getDaiPrice());
        uint256 housePriceInDAI = offer.price.mul(housePrice).mul(1 ether).div(uint(currentDaiPrice));

        require(daiUpdatedAt >= now - 1 hours, "Data too old");
        require(dai.approve(address(this), housePriceInDAI), "DAI: approve");
        require(dai.transferFrom(msg.sender, address(this), housePriceInDAI), "Price not matching");
        
        dai.transferFrom(msg.sender, address(this), housePriceInDAI);
        uint256 houseTransactionFee = housePriceInDAI.mul(txFee).div(100);

        feeRecipient.transfer(houseTransactionFee);
        offer.seller.transfer(housePriceInDAI.sub(houseTransactionFee));

        _houseToken.safeTransferFrom(offer.seller, msg.sender, _tokenId);
        offers[offer.index].active = false;
        delete offerDetails[_tokenId];

        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, _tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, _tokenId);

        emit MarketTransaction("House purchased", msg.sender, _tokenId);
    }

    function buyHouseWithUSDC (uint256 _tokenId) public payable nonReentrant{
        Offer storage offer = offerDetails[_tokenId];      
        require(offer.active == true, "House not for sale");

        (int256 currentUsdcPrice, uint256 usdcUpdatedAt) = (getUsdcPrice());
        uint256 housePriceInUSDC = offer.price.mul(housePrice).mul(1 ether).div(uint(currentUsdcPrice));

        require(usdcUpdatedAt >= now - 1 hours, "Data too old");
        require(dai.approve(address(this), housePriceInUSDC), "USDC: approve");
        require(usdc.transferFrom(msg.sender, address(this), housePriceInUSDC), "Price not matching");
        
        usdc.transferFrom(msg.sender, address(this), housePriceInUSDC);
        uint256 houseTransactionFee = housePriceInUSDC.mul(txFee).div(100);

        feeRecipient.transfer(houseTransactionFee);
        offer.seller.transfer(housePriceInUSDC.sub(houseTransactionFee));

        _houseToken.safeTransferFrom(offer.seller, msg.sender, _tokenId);
        offers[offer.index].active = false;
        delete offerDetails[_tokenId];

        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, _tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, _tokenId);

        emit MarketTransaction("House purchased", msg.sender, _tokenId);
    }

    // function ethEscrowBuy (uint256 _tokenId) public payable nonReentrant{
    //     Offer storage offer = offerDetails[_tokenId];      
    //     require(offer.active == true, "House not for sale"); 

    //     (int256 currentEthPrice, uint256 updatedAt) = (getEthPrice());
    //     uint256 housePriceInETH = offer.price.mul(housePrice).mul(1 ether).div(uint(currentEthPrice));
        
    //     require(msg.value > housePriceInETH, "Price not matching");
    //     require(updatedAt >= now - 1 hours, "Data too old");

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

    // // need easypost API
    // function permitRefunds(uint256 _tokenId) public onlyOwner nonReentrant{
    //     Offer storage offer = offerDetails[_tokenId];
    //     enableRefunds();
    //     issueRefund(msg.sender); //IS THIS ACCURATE?? initial funds go back to buyer.

    //     delete offerDetails[_tokenId];

    //     emit MarketTransaction("Escrow Refunded", msg.sender, _tokenId);
    // }

    // // If time has run out after easypost API showed delivery & buyer didn't confirm this executes
    // function closeEscrow(uint256 _tokenId) public onlyOwner nonReentrant{
    //     Offer storage offer = offerDetails[_tokenId];

    //     // first, we have to verify mailing API, is received
    //     // second, wait 3 days for buyer verification/inspection
    //     // THEN close and release funds

    //     // OR if buyer confirmed delivery, release funds

    //     resetState();
    //     close();
    //     beneficiaryWithdraw(offer.seller);
        
    //     //this should be deleted after transfer
    //     delete offerDetails[_tokenId];    

    //     // HOW do I add house to buyer from here???
    //     _tsaishenUsers.addHouseToUser(msg.sender, _tokenId);
    //     _tsaishenUsers.deleteHouseFromUser(offer.seller, _tokenId);

    //     emit MarketTransaction("House SOLD", msg.sender, _tokenId);
    // }

}