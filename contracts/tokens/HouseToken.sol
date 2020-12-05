// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../Storage.sol";
import "../TsaishenUsers.sol";

contract HouseToken is ERC721PresetMinterPauserAutoId, Ownable, ReentrancyGuard, Storage {
    TsaishenUsers private _tsaishenUsers;

    mapping (uint256 => address) public houseIndexToApproved;

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;

    address public _contractOwner;
    bool public _initialized;

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
        // TsaishenUsers.addUser(msg.sender);

        return _tokenIdTracker.current();
    }

    function getHouse(uint256 _id) public view returns(uint256 value, uint256 income, string memory uri) {
        //change to mapping & uri
        value = houseInfo[_id].value;
        income = houseInfo[_id].income;
        uri = tokenURI(_id);
    }

    function withdrawAll() public onlyOwner returns(uint){
        uint toTransfer = balance;
        balance = 0;
        msg.sender.transfer(toTransfer);
        return toTransfer;
    }
    
    // this checks if they own the house BUT I need to export this function into Users Contract
    function ownsHouse(address _address) public view returns(bool){
        if(balanceOf(_address) >= 1) return true;
        return false;
    }

}