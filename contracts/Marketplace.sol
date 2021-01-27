// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./tokens/HouseToken.sol";
import "./TsaishenUsers.sol";
import "./TsaishenEscrow.sol";


interface AggregatorV3Interface {

  function decimals() external view returns (uint8);
  function description() external view returns (string memory);
  function version() external view returns (uint256);

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

contract Marketplace is ReentrancyGuard, TsaishenEscrow {
    HouseToken private _houseToken;
    TsaishenUsers private _tsaishenUsers;
    
    struct Offer {
        address payable seller;
        uint256 price;
        uint256 income;
        uint256 loan;
        uint256 index;
        uint256 tokenId;
        bool active;
    }

    event MarketTransaction (string, address, uint);

    address payable internal feeRecipient;
    uint256 housePrice = 100000000; //1USD (in function, must multiple by the price in GUI)
    uint256 txFee = 2; //2% transaction fee

    mapping (address => address) availableOracles;
    mapping(uint256 => Offer) internal offerDetails;
    Offer [] offers;
    

    // *** CONSTRUCTOR ***
    constructor(
        address _userContractAddress, 
        address _houseTokenAddress, 
        address payable _feeRecipient
        ) public {
        _tsaishenUsers = TsaishenUsers(_userContractAddress);
        _houseToken = HouseToken(_houseTokenAddress);
        feeRecipient = _feeRecipient;
        addOracle(address(0), 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e); //ETH
        addOracle(0x6B175474E89094C44Da98b954EedeAC495271d0F, 0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF); //DAI
        addOracle(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, 0xa24de01df22b63d23Ebc1882a5E3d4ec0d907bFB); //USDC
    }

    // *** ORACLE GETTER FUNCTIONS ***
    function getOracleUsdPrice(address token) public view returns(int256, uint256){
        // oracle instance
        address oracleAddress = availableOracles[token];
        require(oracleAddress != address(0), "Token not supported.");

        // get the latest price
        (, int256 answer, , uint256 updatedAt, ) = AggregatorV3Interface(oracleAddress).latestRoundData();
        
        
        return (answer, updatedAt);
        //for local testing ONLY
        // return (10000000000, 1607202219); 
    }

    // *** ORACLE SETTER FUNCTIONS ***
    function addOracle(address token, address oracle) public onlyOwner{
        availableOracles[token] = oracle;
    }

    function removeOracle(address token) public onlyOwner{
        delete availableOracles[token];
    }

    // *** MARKETPLACE GETTER FUNCTIONS PUBLIC *** 
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

    //*** INTERNAL FUNCTIONS ***
    function _ownsHouse(address _address, uint256 _tokenId) internal view returns (bool) {
        return (_houseToken.ownerOf(_tokenId) == _address);
    }

    // *** PUBLIC SETTER FUNCTIONS ***
    function sellHouse(uint256 price, uint256 tokenId) public nonReentrant {
        require(_ownsHouse(msg.sender, tokenId), "Not authorized.");
        require(offerDetails[tokenId].active == false, "Already active.");
        // comment this out for local testing
        require(_houseToken.isApprovedForAll(msg.sender, address(this)), "Not approved.");

        // get income amount from houseToken
        ( , uint256 income, ) = _houseToken.getHouse(tokenId);

        //create offer by inserting items into the array
        Offer memory _offer = Offer({
            seller: msg.sender,
            price: price,
            income: income,
            loan: 0,
            active: true,
            tokenId: tokenId,
            index: offers.length
        });

        offerDetails[tokenId] = _offer; //add offer to the mapping
        offers.push(_offer); //add to the offers array

        emit MarketTransaction("House listed", msg.sender, tokenId);
    }

    function removeOffer(uint256 tokenId) public {
        Offer storage offer = offerDetails[tokenId]; //first access the offer
        require(offer.seller == msg.sender, "Not authorized."); //ensure owner only can do this
   
        delete offers[offer.index]; //first delete the index within the array
        delete offerDetails[tokenId]; //then remove the id from the mapping

        emit MarketTransaction("Offer removed", msg.sender, tokenId);
    }

    function buyHouse (IERC20 token, uint256 tokenId) public nonReentrant{
        // access offer
        Offer storage offer = offerDetails[tokenId];  

        // make sure it's active 
        require(offer.active == true, "Must be active.");

        // get price conversion
        (int256 currentPrice, uint256 updatedAt) = (getOracleUsdPrice(address (token)));

        // convert USD house price to crypto
        uint256 cryptoHousePrice = offer.price.mul(housePrice).mul(1 ether).div(uint(currentPrice));

        //ensure oracle price data is recent
        require(updatedAt >= now - 1 hours, "Data too old.");

        // calculate transaction fee
        uint256 houseTransactionFee = cryptoHousePrice.mul(txFee).div(100);

        // transfer funds from buyer
        token.universalTransferFromSenderToThis(cryptoHousePrice);

        // pay the fee collector
        require(token.universalTransfer(feeRecipient, houseTransactionFee));

        // pay the seller
        require(token.universalTransfer(offer.seller, cryptoHousePrice.sub(houseTransactionFee)));
        
        // transfer house to buyer
        _houseToken.safeTransferFrom(offer.seller, msg.sender, tokenId);

        // make offer inactive and take off market
        offers[offer.index].active = false;

        // remove from mapping to prevent double sale
        delete offerDetails[tokenId];

        // handle user ledger
        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, tokenId);

        emit MarketTransaction("House purchased", msg.sender, tokenId);
    }
 
    function buyHouseWithEscrow (IERC20 token, uint256 tokenId) public nonReentrant{
        Offer storage offer = offerDetails[tokenId];      
        require(offer.active == true, "House not for sale."); 

        (int256 currentPrice, uint256 updatedAt) = (getOracleUsdPrice(address (token)));
        uint256 cryptoHousePrice = offer.price.mul(housePrice).mul(1 ether).div(uint(currentPrice));
        require(updatedAt >= now - 1 hours, "Data too old.");

        //transfer funds into escrow
        _deposit(token, offer.seller, msg.sender, cryptoHousePrice, tokenId);

        offers[offer.index].active = false;

        // add/update user
        _tsaishenUsers.addUser(msg.sender);

        emit MarketTransaction("House in Escrow", msg.sender, tokenId);
    }

    function permitRefunds(uint256 tokenId) public onlyOwner {
        Offer storage offer = offerDetails[tokenId];
        _enableRefunds(tokenId);
        _issueRefund(escrowById[tokenId].buyer, tokenId);

        offers[offer.index].active = true;

        emit MarketTransaction("Escrow Refunded", escrowById[tokenId].buyer, tokenId);
    }

    function closeEscrow(uint256 tokenId) public onlyOwner {
        Offer storage offer = offerDetails[tokenId];
        require(escrowById[tokenId].amount > 0, "No sufficient funds in escrow.");
        
        _resetState(tokenId);
        _close(tokenId);
        
        _beneficiaryWithdraw(offer.seller, tokenId);

        //remove token from the mapping
        delete offerDetails[tokenId];    

        // finalize transaction with users
        _tsaishenUsers.addHouseToUser(escrowById[tokenId].buyer, tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, tokenId);

        emit MarketTransaction("House SOLD", offer.seller, tokenId);
    }

}