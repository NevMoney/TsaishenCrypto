// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";
import "../Storage.sol";

contract TsaishenToken is ERC20PresetMinterPauser, Storage {
    
    constructor() public ERC20PresetMinterPauser("Tsaishen Coin", "CASH") {
        _mint(msg.sender, 100e6 * 1 ether); //1 ether - same as saying 18 decimals
    }

}