// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../Storage.sol";
import "../TsaishenUsers.sol";

contract HouseToken is ERC721PresetMinterPauserAutoId, Ownable, ReentrancyGuard, Storage {
    TsaishenUsers private _tsaishenUsers;

    using SafeMath for uint256;

    mapping (uint256 => address) public houseIndexToApproved;

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;

    address public _contractOwner;
    bool public _initialized;
    address payable internal _creator;

    // MUST ALWAYS BE PUBLIC!
    constructor(address _userContractAddress) public ERC721PresetMinterPauserAutoId("Tsaishen Real Estate", "HOUS", "https://ipfs.daonomic.com/ipfs/") {
        setUserContract(_userContractAddress);
    }

    modifier costs (uint cost){
        require(msg.value >= cost);
        _;
    }

    uint public balance;    
    uint256 public houseCounter;

    mapping(uint256 => string) ipfsHash;

    event Minted(address _owner, uint256 id, string tokenURI);

    function setUserContract(address _userContractAddress) internal onlyOwner {
        _tsaishenUsers = TsaishenUsers(_userContractAddress);
    }
      
    // generate house on blockchain: value, ID, owner address
    function createHouse (uint256 value, uint256 income) public payable costs (1 ether) returns (uint256) {
        // require identification of the user KYC/AML before execution
        balance += msg.value;

        houseCounter++;

        return _createHouse(value, income, msg.sender);
    }

    function _createHouse(uint256 _value, uint256 _income, address _owner) private returns (uint256) {    
        House memory _house = House({
            value: _value,
            income: _income
        });

        //places house in mapping and assigns ID
        houseInfo[_tokenIdTracker.current()] = _house;

        emit Minted(_owner, _tokenIdTracker.current(), "");

        //mint new token, transfer to the owner with the house ID
        _mint(_owner, _tokenIdTracker.current());
        _tokenIdTracker.increment();
        
        // add user if new
        _tsaishenUsers.addUser(msg.sender);
        _tsaishenUsers.addHouseToUser(msg.sender, _tokenIdTracker.current());

        return _tokenIdTracker.current();
    }

    function getHouse(uint256 _id) public view returns(uint256 value, uint256 income, string memory uri) {
        value = houseInfo[_id].value;
        income = houseInfo[_id].income;
        uri = tokenURI(_id); 
        //OR use uri = ipfsHash[_id];
    }

    function withdrawAll() public onlyOwner nonReentrant returns(uint){
        uint toTransfer = balance;
        balance = 0;
        // sendValue(msg.sender, toTransfer);
        msg.sender.transfer(toTransfer);
        return toTransfer;
    }

    // NEED TO GET THIS FIXED!
    function _autoWithdraw() internal {
        if(balance >= 2 ether)
            balance = balance.sub(1 ether);
            _creator.transfer(1 ether);
    }
    
    function sendEth() public payable nonReentrant{
        _autoWithdraw();
    }
    
    // this checks if they own the house
    function ownsHouse(address _address) public view returns(bool){
        if(balanceOf(_address) > 0) return true;
        return false;
    }

}