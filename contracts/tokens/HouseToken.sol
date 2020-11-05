// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HouseToken is ERC721PresetMinterPauserAutoId, Ownable {
    constructor() public ERC721PresetMinterPauserAutoId("Tsaishen House", "HOUS", "https://ipfs.daonomic.com/ipfs/") {
    }

    struct House {
        uint256 value;
        uint256 taxes;
    }

    mapping (uint256 => House) houseInfo;

    function ownerOfHouse (uint256 id) public view returns (address){
        return ownerOf(id);
    }

    function sell(uint256 id) {
        houseInfo[id].value;
    }

}