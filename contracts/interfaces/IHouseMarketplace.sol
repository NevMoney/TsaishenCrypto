pragma solidity ^0.6.0;

import "./HouseToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


interface IHouseMarketplace {

    event MarketTransaction(string txType, address owner, uint256 tokenId);

    
    function setHouseContract(address _houseContractAddress) external;
 
    function getOffer(uint256 _tokenId) external view returns ( address seller, uint256 price, uint256 index, uint256 tokenId, bool active);
 
    function getAllTokenOnSale() external view  returns(uint256[] memory listOfOffers);
  
    function setOffer(uint256 _price, uint256 _tokenId) external;

    function removeOffer(uint256 _tokenId) external;

    function buyHouse(uint256 _tokenId) external payable;
}