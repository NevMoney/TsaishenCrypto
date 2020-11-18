// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../Storage.sol";

contract HouseToken is ERC721PresetMinterPauserAutoId, Ownable, Storage {
    constructor() public ERC721PresetMinterPauserAutoId("Real Estate Token", "HOUS", "https://ipfs.daonomic.com/ipfs/") {
    }

    // QUESTION: does it make sense for this to live here or do I put it in storage?
    modifier costs (uint cost){
        require(msg.value >= cost);
        _;
    }

    // using EnumerableMap for EnumerableMap.UintToAddressMap;
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using EnumerableSet for EnumerableSet.UintSet;
    EnumerableSet.UintSet private ownershipTokenCount;
    EnumerableMap.UintToAddressMap private houseIndexToOwner;

    event Minted(address _owner, uint256 id, string tokenURI);

    // generate house on blockchain: value, ID, owner address
    function createHouse (uint256 value, uint256 income) public payable costs (1 ether) returns (uint256) {
        // require identification of the user KYC/AML before execution
        balance += msg.value;

        ownershipTokenCount.add;
        houseIndexToOwner.set;

        houseCounter++;

        return _createHouse(value, income, msg.sender);
    }

    function _createHouse(uint256 _value, uint256 _income, address _owner) private returns (uint256) {    
        House memory _house = House({
            value: _value,
            income: _income
        });

        //this creates new house and places it in array, then assigns ID
        houses.push(_house);
        uint256 newHouseId = houses.length - 1;

        emit Minted(_owner, newHouseId, "");

        //mint new token, transfer to the owner with the house ID
        _mint(_owner, _tokenIdTracker.current());
        _tokenIdTracker.increment();

        return newHouseId;
    }

    function getHouse(uint256 _id) public view returns(uint256 value, uint256 income) {
        //change to mapping & uri
        House storage house = houses[_id];
        value = uint256 (house.value);
        income = uint256 (house.income);
    }
}