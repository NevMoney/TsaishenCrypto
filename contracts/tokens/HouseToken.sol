// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../Storage.sol";
import "../TsaishenUsers.sol";

contract HouseToken is ERC721PresetMinterPauserAutoId, Ownable, ReentrancyGuard, Storage {

    using SafeMath for uint256;

    event Minted(address _owner, uint256 id, string uri);
    
    TsaishenUsers private _tsaishenUsers;
    address public _contractOwner;
    bool public _initialized;
    address payable internal _creator;
    uint public balance;    
    uint256 public houseCounter;
    address marketplace;

    mapping (uint256 => address) public houseIndexToApproved;
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;

    // *** CONSTRUCTOR ***
    // while opensea.io says use "ipfs://" as baseUri it cannot be read outside Brave browser for now, thus creating challenges
    constructor(address _userContractAddress, address payable creator) public ERC721PresetMinterPauserAutoId("Tsaishen Real Estate", "HOUS", "https://ipfs.io/ipfs/") {
        setUserContract(_userContractAddress);
        _creator = creator;
    }

    // *** MODIFIER ***
    modifier costs (uint cost){
        require(msg.value >= cost, "HT: Insufficient funds.");
        _;
    }

    modifier onlyAuthorized(){
        require(msg.sender == marketplace || msg.sender == owner(), "HT: Not authorized.");
        _;
    }

    // *** SETTER ***
    function createHouse (uint256 value, uint256 income, string memory ipfsHash) public payable costs (1 ether) returns (uint256) {
        // require identification of the user KYC/AML before execution
        balance.add(msg.value);

        houseCounter++;//might not need this

        return _createHouse(value, income, msg.sender, ipfsHash);
    }

    function destroyHouse (uint256 tokenId) public {
        _burn(tokenId);

        delete houseInfo[tokenId];
        _tsaishenUsers.deleteHouseFromUser(msg.sender, tokenId);
        emit Minted(msg.sender, tokenId, "Token burned");
    }

    // *** GETTER ***
    function getHouse (uint256 id) public view returns (uint256 value, uint256 income, string memory uri) {
        value = houseInfo[id].value;
        income = houseInfo[id].income;
        uri = tokenURI(id);
    }

    function ownsHouse (address _address) public view returns (bool){
        if(balanceOf(_address) > 0) return true;
        return false;
    }

    // === OWNER ===
    function setUserContract (address _userContractAddress) internal onlyOwner {
        _tsaishenUsers = TsaishenUsers(_userContractAddress);
    }

    function setMarketplaceAddress(address _marketplace) public onlyOwner {
        marketplace = _marketplace;
    }

    function withdrawAll() public payable onlyOwner nonReentrant{
        msg.sender.transfer(address(this).balance);
    }

    function updateUri (uint256 _tokenId, string memory _ipfsHash) public onlyAuthorized {
        House storage house = houseInfo[_tokenId];

        _setTokenURI(_tokenId, _ipfsHash);
        houseInfo[_tokenId] = house;
        emit Minted(msg.sender, _tokenId, "Updated uri");
    }

    // === PRIVATE ===
    function _createHouse (uint256 _value, uint256 _income, address _owner, string memory _ipfsHash) private returns (uint256) {    
        House memory _house = House({
            value: _value,
            income: _income
        });

        //places house in mapping and assigns ID
        houseInfo[_tokenIdTracker.current()] = _house;

        //mint new token, transfer to the owner with the house ID
        _mint(_owner, _tokenIdTracker.current());
        _setTokenURI(_tokenIdTracker.current(), _ipfsHash);
        emit Minted(_owner, _tokenIdTracker.current(), tokenURI(_tokenIdTracker.current()));
        
        // add user if new
        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, _tokenIdTracker.current());

        _tokenIdTracker.increment();
        return _tokenIdTracker.current();
    }
    
}