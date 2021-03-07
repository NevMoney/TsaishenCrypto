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

    event MarketTransaction (string TxType, address actor, uint256 tokenId);

    HouseToken private _houseToken;
    TsaishenUsers private _tsaishenUsers;
    uint256 housePrice = 100000000; //1USD (in function, must multiple by the price in GUI)
    uint256 txFee = 2; //2% transaction fee
    uint256 private balance;
    
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

        // get the latest price // FOR TEST comment this
        // (, int256 answer, , uint256 updatedAt, ) = AggregatorV3Interface(oracleAddress).latestRoundData();
        
        // FOR TEST comment this
        // return (answer, updatedAt);
        //for local testing ONLY //set at 1+10 zeros(100.00000000)
        return (10000000000, now); 
    }

    function getOffer(uint256 _tokenId) public view returns 
        (address seller, 
        uint256 price, 
        uint256 income, 
        uint256 index, 
        uint256 tokenId,
        OfferState offerstate) {
        return 
        (offerDetails[_tokenId].seller, 
        offerDetails[_tokenId].price, 
        offerDetails[_tokenId].income, 
        offerDetails[_tokenId].index,
        offerDetails[_tokenId].tokenId,
        offerDetails[_tokenId].offerstate); 
    }

    // may not need this function
    function getOfferState(uint256 tokenId) public view returns(OfferState){
        return offerDetails[tokenId].offerstate;
    }
    
    function getAllTokensOnSale() public view returns(uint256[] memory listOfOffers) {
        uint256 forSaleList = offers.length;

        if(forSaleList == 0) {
            return new uint256[](0);
        }
        else{
            uint256[] memory result = new uint256[](forSaleList);
            uint256 offerId;

            for(offerId = 0; offerId < forSaleList; offerId++)
                if(offers[offerId].offerstate == OfferState.Active || offers[offerId].offerstate == OfferState.Escrow){
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
        require(offerDetails[tokenId].offerstate == OfferState.Dormant, "Mp: Already active.");
        require(_houseToken.isApprovedForAll(msg.sender, address(this)), "Mp: Not approved.");

        // get income from houseToken
        ( , uint256 income, ) = _houseToken.getHouse(tokenId);

        Offer memory _offer = Offer({
            seller: msg.sender,
            price: price,
            income: income,
            offerstate: OfferState.Active,
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
        require(offerDetails[tokenId].offerstate == OfferState.Active, "Mp: Not active.");

        offerDetails[tokenId].offerstate = OfferState.Dormant;
   
        delete offers[offer.index]; //first delete the index within the array
        delete offerDetails[tokenId]; //then remove the id from the mapping

        emit MarketTransaction("Offer removed", msg.sender, tokenId);
    }

    // -- house transaction --
    function buyHouse (IERC20 token, uint256 tokenId) public payable nonReentrant{
        // access offer
        Offer storage offer = offerDetails[tokenId];  

        // make sure it's active 
        require(offerDetails[tokenId].offerstate == OfferState.Active, "Mp: Not active.");

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
        token.universalTransfer(feeRecipient, houseTransactionFee);
        // pay the seller
        token.universalTransfer(offer.seller, cryptoHousePrice.sub(houseTransactionFee));
        
        // transfer house to buyer
        _houseToken.safeTransferFrom(offer.seller, msg.sender, tokenId);

        // make offer inactive and take off market
        offers[offer.index].offerstate = OfferState.Dormant;
        offerDetails[tokenId].offerstate = OfferState.Dormant;

        // handle user ledger
        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, tokenId);

        // remove from mapping/array
        delete offers[offer.index];
        delete offerDetails[tokenId];
        emit MarketTransaction("House purchased", msg.sender, tokenId);
    }
 
    function buyHouseWithEscrow (IERC20 token, uint256 tokenId) public payable nonReentrant{
        Offer storage offer = offerDetails[tokenId];      
        require(offerDetails[tokenId].offerstate == OfferState.Active, "Mp: Not active.");

        (int256 currentPrice, uint256 updatedAt) = (getOracleUsdPrice(address (token)));
        uint256 cryptoHousePrice = offer.price.mul(housePrice).mul(1 ether).div(uint(currentPrice));
        require(updatedAt >= now - 1 hours, "Mp: Data too old.");

        //transfer funds into escrow
        _deposit(token, offer.seller, msg.sender, cryptoHousePrice, tokenId);

        // mark in Escrow
        offers[offer.index].offerstate = OfferState.Escrow;
        offerDetails[tokenId].offerstate = OfferState.Escrow;

        // add/update user
        _tsaishenUsers.addUser(msg.sender);

        emit MarketTransaction("House in Escrow", msg.sender, tokenId);
    }

    // -- ESCROW MANAGEMENT --
    function refundEscrow(uint256 tokenId) public payable nonReentrant{
        require(msg.sender == escrowById[tokenId].buyer || msg.sender == escrowById[tokenId].seller || msg.sender == owner(), "Mp: Not authorized.");
        require(now > escrowById[tokenId].timelock, "TM: Timelocked.");

        if(now >= escrowById[tokenId].timelock){
            Offer storage offer = offerDetails[tokenId];
            _enableRefunds(tokenId);
            _issueRefund(escrowById[tokenId].buyer, tokenId);

            offers[offer.index].offerstate = OfferState.Active;
            offerDetails[tokenId].offerstate = OfferState.Active;

            emit MarketTransaction("Escrow Refunded", escrowById[tokenId].buyer, tokenId);
        }
    }

    function closeEscrow(uint256 tokenId) public onlyOwner {
        require(offerDetails[tokenId].offerstate == OfferState.Escrow, "Mp: Not in escrow.");
        Offer storage offer = offerDetails[tokenId];
        
        _resetState(tokenId);
        _close(tokenId); //this extends timelock

        emit MarketTransaction("Escrow closed. Buyer has 3 days to verify.", offer.seller, tokenId);
    }    

    function sellerComplete(uint256 tokenId) public {
        require(msg.sender == escrowById[tokenId].seller, "Mp: Only seller.");

        _close(tokenId);

        emit MarketTransaction("Seller uploaded docs.", msg.sender, tokenId);
    }

    // buyer to verifies receipt and escrow transfers complete
    function buyerVerify(uint256 tokenId) public payable nonReentrant {
        require(offerDetails[tokenId].offerstate == OfferState.Escrow, "Mp: Not in escrow.");
        Offer storage offer = offerDetails[tokenId];
        
        _confirmDelivery(tokenId);

        // transfer house to buyer
        _houseToken.safeTransferFrom(offer.seller, escrowById[tokenId].buyer, tokenId);

        // finalize transaction with users
        _tsaishenUsers.addHouseToUser(escrowById[tokenId].buyer, tokenId);
        _tsaishenUsers.deleteHouseFromUser(offer.seller, tokenId);

        //remove from the array/mapping
        delete offers[offer.index];
        delete offerDetails[tokenId];  

        emit MarketTransaction("Buyer verified, house SOLD.", offer.seller, tokenId);
    }

    // buyer notices error in documents and requests change/review
    function buyerReviewRequest(uint256 tokenId) public {
        require(offerDetails[tokenId].offerstate == OfferState.Escrow, "Mp: Not in escrow.");
        require(msg.sender == escrowById[tokenId].buyer, "Mp: Buyer only.");
    
        // allow 3 days for seller to update documents
        _extendTimelock(tokenId);

        emit MarketTransaction("3-day document update request issued.", escrowById[tokenId].buyer, tokenId);
    }

    function finalizeEscrowTransaction(uint256 tokenId) public payable onlyOwner {
        require(offerDetails[tokenId].offerstate == OfferState.Escrow, "Mp: Not in escrow.");
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

        //remove from array/mapping
        delete offers[offer.index];
        delete offerDetails[tokenId];  

        emit MarketTransaction("House SOLD.", offer.seller, tokenId);
    }

    function cancelEscrowSale(uint256 tokenId) public payable costs(2 ether) {
        require(msg.sender == escrowById[tokenId].buyer || msg.sender == escrowById[tokenId].seller, "Mp: Not authorized.");
        require(offerDetails[tokenId].offerstate == OfferState.Escrow, "Mp: Not in escrow.");
        Offer storage offer = offerDetails[tokenId];
        balance.add(msg.value);//don't know that i need this

        _cancelEscrowSale(tokenId);
        offers[offer.index].offerstate = OfferState.Active;
        offerDetails[tokenId].offerstate = OfferState.Active;

        emit MarketTransaction("Escrow Cancelled.", msg.sender, tokenId);
    }   

    //*** INTERNAL ***
    function _ownsHouse(address _address, uint256 _tokenId) internal view returns (bool) {
        return (_houseToken.ownerOf(_tokenId) == _address);
    }
}