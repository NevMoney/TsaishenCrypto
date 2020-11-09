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

    event Minted(address _owner, uint256 id, string _tokenURI);

    // generate house on blockchain: value, ID, owner address
    // QUESTION: do i need to have address(0) or have as address only?
    // QUESTION: do i need both value and ID and should ID be displayed as uint256(-1)??
    // can't use this as I already have a constructor, but HOW do I get value & index and address of owner?
    // constructor () public {
    //     _createHouse(uint256, uint256, address(0));
    // }

    // QUESTION: is this possible, the payable part?!
    function createHouse (uint256 value, uint256 income) public payable costs (1 ether) returns (uint256) {
        // would need to require identification of the user KYC/AML 
        // would that be called here?! 
        balance += msg.value;

        houseCounter++;
        return _createHouse(value, income, msg.sender);
    }

    function _createHouse(uint256 _value, uint256 _income, address _owner) private returns (uint256) {    
        House memory _house = House({
            value: _value,
            income: _income
        });

        //this creates new house and places it in array, then assigns ID
        // WARNING: Following line does NOT compile!
        uint256 newHouseId = houses.push(_house);

        emit Minted(_owner, newHouseId, _tokenURI);

        //mint new token, transfer to the owner with the house ID
        _transfer(address(0), _owner, newHouseId);

        return newHouseId;
    }

    function getHouseByOwner(address _owner) external view returns(uint[] memory){
        uint[] memory result = new uint[](ownershipTokenCount[_owner]);
        uint counter = 0;
        for (uint i = 0; i < houses.length; i++) {
            if (houseIndexToOwner[i] == _owner) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }

    function getHouse(uint256 _id) public view returns(uint256 value) {
        House storage house = houses[_id];
        value = uint256 (house.value);
    }
        
    function ownerOfHouse (uint256 id) public view returns (address){
        return ownerOf(id);
    }

}