// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

// import "./CRUD.sol";

contract Storage {

    mapping (string => uint256) _uintStorage;
    mapping (string => address) _addressStorage;
    mapping (string => bool) _boolStorage;
    mapping (string => string) _stringStorage;
    mapping (string => bytes4) _bytesStorage;

    struct House {
        uint256 value;
        uint256 income;
    }

    mapping (uint256 => House) internal houseInfo;

}