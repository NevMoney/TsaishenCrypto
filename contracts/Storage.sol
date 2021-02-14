// SPDX-License-Identifier: MIT
pragma solidity 0.6.10;

contract Storage {

    mapping (string => uint256) _uintStorage;
    mapping (string => address) _addressStorage;
    mapping (string => bool) _boolStorage;
    mapping (string => string) _stringStorage;
    mapping (string => bytes4) _bytesStorage;
    mapping (uint256 => House) internal houseInfo;

    struct House {
        uint256 value;
        uint256 income;
    }

    House[] homes;
}