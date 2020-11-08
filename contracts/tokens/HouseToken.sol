// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Storage.sol";

contract HouseToken is ERC721PresetMinterPauserAutoId, Ownable, Storage {
    constructor() public ERC721PresetMinterPauserAutoId("Real Estate Token", "HOUS", "https://ipfs.daonomic.com/ipfs/") {
    }

    struct House {
        uint256 value;
        bool incomeProducing;
    }

    // generate house on blockchain: value, ID, owner address
    // QUESTION: do i need to have address(0) or have as address only?
    // QUESTION: do i need both value and ID and should ID be displayed as uint256(-1)??
    constructor () public {
        _createHouse(uint256, uint256, address(0));
    }

    function createHouse (uint256) public returns (uint256) {
        // would need to require identification of the user KYC/AML 
        // would that be called here?! 
        houseCounter++;
        return _createHouse(uint256, uint256, address(0))
    }

    //returns ID - needs to be "internal"
    function _createHouse(uint256 _value) private returns (uint256) {    
        House memory _house = House({
            value: _value
        });

        //this creates new house and places it in array, then assigns ID
        // QUESTION: does it need "-1" & wouldn't we want to "burn" zero ID???
        uint256 newHouseId = houses.push(_house) - 1;  

        emit Minted(_owner, newHouseId);

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
    
    function balanceOf(address owner) external view returns (uint256 balance){
        return ownershipTokenCount[owner];
    }

    // QUESTION: will this work or do I even need it since ERC721 already has this
    function totalSupply() public view returns (uint){
        return houses.length;
    }     
        
    function ownerOfHouse (uint256 id) public view returns (address){
        return ownerOf(id);
    }

    // function for owner to sell house
    function sell(uint256 id) {
        houseInfo[id].value;
    }

    // function for owner to borrow funds
    function borrow(uint256 id) {
        houseInfo[id].value;
        houseInfo[id].incomeProducing;
    }

}