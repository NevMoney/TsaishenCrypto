// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import "../Storage.sol";
// import "../CRUD.sol";
import "../TsaishenUsers.sol";

contract HouseToken is ERC721PresetMinterPauserAutoId, Ownable, TsaishenUsers, ReentrancyGuard {
    using UintSet for UintSet.Set;
    UintSet.Set homes;

    struct House {
        uint256 value;
        uint256 income;
        // UintSet.Set offerDetails;
    }

    mapping (uint256 => address) public houseIndexToApproved;
    mapping (uint256 => House) internal houseInfo;

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;

    address public _owner;
    bool public _initialized;

    constructor() public ERC721PresetMinterPauserAutoId("Tsaishen Real Estate", "HOUS", "https://ipfs.daonomic.com/ipfs/") {
    }

    modifier costs (uint cost){
        require(msg.value >= cost);
        _;
    }

    uint public balance;    
    uint256 public houseCounter;


    event Minted(address _owner, uint256 id, string tokenURI);

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

        // add users and house info
        User memory _user = User('', '', 0, msg.sender, _house, homes);
        
        // add user if new
        if(isUser(msg.sender)!= true){
            users.insert(msg.sender);
        }
        
        // add house to user to get array of all homes user has THIS IS NOT WORKING!
        userInfo[msg.sender].homes.insert(_tokenIdTracker.current());
        addHome(_owner, _tokenIdTracker.current());
        
        // add user to userInfo mapping
        userInfo[msg.sender] = _user;

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

}