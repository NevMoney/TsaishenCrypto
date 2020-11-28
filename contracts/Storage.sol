// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./CRUD.sol";

contract Storage {

    using UintSet for UintSet.Set;
    // UintSet.Set offers;

    mapping (string => uint256) _uintStorage;
    mapping (string => address) _addressStorage;
    mapping (string => bool) _boolStorage;
    mapping (string => string) _stringStorage;
    mapping (string => bytes4) _bytesStorage;
    
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;

    address public _owner;
    bool public _initialized;

    //houseToken Stuff
    uint public balance;    
    uint256 public houseCounter;

    struct House {
        uint256 value;
        uint256 income;
        // UintSet.Set offers;
    }

    mapping (uint256 => address) public houseIndexToApproved;
    mapping (uint256 => House) public houseInfo;

    // marketplace & lending stuff
    struct Offer {
        address payable seller;
        uint256 price;
        uint256 income;
        uint256 loan;
        uint256 index;
        uint256 tokenId;
        bool active;
    }

    // store offer information
    mapping(uint256 => Offer) public tokenIdToOffer;
    Offer [] offers;

}