// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HouseToken is ERC721PresetMinterPauserAutoId, Ownable {
    constructor() public ERC721PresetMinterPauserAutoId("Tsaishen House", "HOUS", "BASE_URI") {
    }
}