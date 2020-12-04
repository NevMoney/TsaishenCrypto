// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

// import "./CRUD.sol";

contract Storage {
    // using AddressSet for AddressSet.Set;
    // using UintSet for UintSet.Set;

    mapping (string => uint256) _uintStorage;
    mapping (string => address) _addressStorage;
    mapping (string => bool) _boolStorage;
    mapping (string => string) _stringStorage;
    mapping (string => bytes4) _bytesStorage;

}