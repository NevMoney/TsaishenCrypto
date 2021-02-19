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

    event MarketTransaction (string TxType, address actor, uint tokenId);

    HouseToken private _houseToken;
    TsaishenUsers private _tsaishenUsers;
    uint256 housePrice = 100000000; //1USD (in function, must multiple by the price in GUI)
    uint256 txFee = 2; //2% transaction fee
    uint256 private balance;

    mapping (address => address) availableOracles;
    mapping(uint256 => Offer) internal offerDetails;
    Offer [] offers;

    struct Offer {
        address payable seller;
        uint256 price;
        uint256 income;
        uint256 loan;
        uint256 index;
        uint256 tokenId;
        bool active;
    }
    
    // *** MODIFIER ***
    modifier costs (uint cost){
        require(msg.value >= cost, "Mp: Insufficient funds.");
        _;
    }

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

    // *** GETTER ***
    function getOracleUsdPrice(address token) public view returns(int256, uint256){
        // oracle instance
        address oracleAddress = availableOracles[token];
        require(oracleAddress != address(0), "Mp: Token not supported.");

        // get the latest price
        // FOR TEST comment this
        // (, int256 answer, , uint256 updatedAt, ) = AggregatorV3Interface(oracleAddress).latestRoundData();
        
        // FOR TEST comment this
        // return (answer, updatedAt);
        //for local testing ONLY
        return (10000000000, now); 
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

    function getAllTokensOnSale() public view returns(uint256[] memory listOfOffers) {
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

    // *** SETTER ***
    //  -- oracles --
    function addOracle(address token, address oracle) public onlyOwner{
        availableOracles[token] = oracle;
    }

    function removeOracle(address token) public onlyOwner{
        delete availableOracles[token];
    }

    // -- house on/off market --
    function sellHouse(uint256 price, uint256 tokenId) public nonReentrant {
        require(_ownsHouse(msg.sender, tokenId), "Mp: Not authorized.");
        require(offerDetails[tokenId].active == false, "Mp: Already active.");
        // comment this out for local testing
        require(_houseToken.isApprovedForAll(msg.sender, address(this)), "Mp: Not approved.");

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
        require(offer.seller == msg.sender, "Mp: Not authorized."); //ensure owner only can do this
   
        delete offers[offer.index]; //first delete the index within the array
        delete offerDetails[tokenId]; //then remove the id from the mapping

        emit MarketTransaction("Offer removed", msg.sender, tokenId);
    }

    // -- house transaction --
    function buyHouse (IERC20 token, uint256 tokenId) public nonReentrant{
        // access offer
        Offer storage offer = offerDetails[tokenId];  

        // make sure it's active 
        require(offer.active == true, "Mp: Must be active.");

        // get price conversion
        (int256 currentPrice, uint256 updatedAt) = (getOracleUsdPrice(address (token)));

        // convert USD house price to crypto
        uint256 cryptoHousePrice = offer.price.mul(housePrice).mul(1 ether).div(uint(currentPrice));

        //ensure oracle price data is recent
        require(updatedAt >= now - 1 hours, "Mp: Data too old.");

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

        // handle user ledger
        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, tokenId);

        // remove from mapping to prevent double sale
        delete offerDetails[tokenId];
        emit MarketTransaction("House purchased", msg.sender, tokenId);
    }
 
    function buyHouseWithEscrow (IERC20 token, uint256 tokenId) public nonReentrant{
        Offer storage offer = offerDetails[tokenId];      
        require(offer.active == true, "Mp: Must be active."); 

        (int256 currentPrice, uint256 updatedAt) = (getOracleUsdPrice(address (token)));
        uint256 cryptoHousePrice = offer.price.mul(housePrice).mul(1 ether).div(uint(currentPrice));
        require(updatedAt >= now - 1 hours, "Mp: Data too old.");

        //transfer funds into escrow
        _deposit(token, offer.seller, msg.sender, cryptoHousePrice, tokenId);

        // take off market
        offers[offer.index].active = false;

        // add/update user
        _tsaishenUsers.addUser(msg.sender);

        emit MarketTransaction("House in Escrow", msg.sender, tokenId);
    }

    // -- ESCROW MANAGEMENT --
    // can this be open to all???
    function refundEscrow(uint256 tokenId) public {
        require(msg.sender == escrowById[tokenId].buyer || msg.sender == escrowById[tokenId].seller || msg.sender == owner(), "Mp: Not authorized.");

        Offer storage offer = offerDetails[tokenId];
        if(now >= escrowById[tokenId].timelock){
            _enableRefunds(tokenId);
            _issueRefund(escrowById[tokenId].buyer, tokenId);

            offers[offer.index].active = true;

            emit MarketTransaction("Escrow Refunded", escrowById[tokenId].buyer, tokenId);
        }
    }

    function closeEscrow(uint256 tokenId) public onlyOwner {
        Offer storage offer = offerDetails[tokenId];
        
        _resetState(tokenId);
        _close(tokenId); //this extends timelock

        emit MarketTransaction("Escrow closed. Buyer has 3 days to verify.", offer.seller, tokenId);
    }    

    // buyer to verifies receipt and escrow transfers complete
    function buyerVerify(uint256 tokenId) public nonReentrant {
        Offer storage offer = offerDetails[tokenId];
        
        _confirmDelivery(tokenId);

        // transfer house to buyer
        _houseToken.safeTransferFrom(offer.seller, escrowById[tokenId].buyer, tokenId);

        // finalize transaction with users
        _tsaishenUsers.addHouseToUser(escrowById[tokenId].buyer, tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, tokenId);

        //remove token from the mapping
        delete offerDetails[tokenId];  

        emit MarketTransaction("Buyer verified, house SOLD.", offer.seller, tokenId);
    }

    // buyer notices error in documents and requests change/review
    function buyerReviewRequest(uint256 tokenId) public {
        require(msg.sender == escrowById[tokenId].buyer, "Mp: Buyer only.");
        Offer storage offer = offerDetails[tokenId];

        // allow 3 days for seller to update documents
        _resetState(tokenId);
        _extendTimelock(tokenId);

        emit MarketTransaction("3-day document update request issued.", offer.seller, tokenId);
    }

    function finalizeEscrowTransaction(uint256 tokenId) public onlyOwner {
        Offer storage offer = offerDetails[tokenId];

        _resetState(tokenId);
        _close(tokenId);
        _cancelTimelock(tokenId);
        _beneficiaryWithdraw(offer.seller, tokenId, feeRecipient);

        // transfer house to buyer
        _houseToken.safeTransferFrom(offer.seller, escrowById[tokenId].buyer, tokenId);

        // finalize transaction with users
        _tsaishenUsers.addHouseToUser(escrowById[tokenId].buyer, tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, tokenId);       

        //remove token from the mapping
        delete offerDetails[tokenId];  

        emit MarketTransaction("House SOLD.", offer.seller, tokenId);
    }

    function cancelEscrowSale(uint256 tokenId) public payable costs(2 ether) {
        require(msg.sender == escrowById[tokenId].buyer || msg.sender == escrowById[tokenId].seller, "Mp: Not authorized.");
        Offer storage offer = offerDetails[tokenId];
        balance.add(msg.value);

        _cancelEscrowSale(tokenId);
        offers[offer.index].active = true;

        emit MarketTransaction("Escrow Cancelled.", msg.sender, tokenId);
    }   

    //*** INTERNAL ***
    function _ownsHouse(address _address, uint256 _tokenId) internal view returns (bool) {
        return (_houseToken.ownerOf(_tokenId) == _address);
    }

}