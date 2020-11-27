// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract Storage {

    mapping (string => uint256) _uintStorage;
    mapping (string => address) _addressStorage;
    mapping (string => bool) _boolStorage;
    mapping (string => string) _stringStorage;
    mapping (string => bytes4) _bytesStorage;
    
    // store house information
    mapping (uint256 => House) public houseInfo;

    // store user information
    mapping(address => User) public userInfo;
    
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;

    address public _owner;
    bool public _initialized;
  
    User [] users;

    struct House {
        uint256 value;
        uint256 income;
    }

    struct User {
        address payable user;
        uint256 points;
        uint256 index;
        bool active;
    }

}