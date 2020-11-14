// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract Storage {

    mapping (string => uint256) _uintStorage;
    mapping (string => address) _addressStorage;
    mapping (string => bool) _boolStorage;
    mapping (string => string) _stringStorage;
    mapping (string => bytes4) _bytesStorage;
    
    mapping (uint256 => address) public houseIndexToOwner;
    mapping (address => uint256) public ownershipTokenCount;
    mapping (uint256 => address) public houseIndexToApproved;
    mapping (address => mapping (address => bool)) private operatorApprovals;
    mapping(uint256 => Offer) tokenIdToOffer;

    // this is where we'll store house information about each property for easy recall
    mapping (uint256 => House) houseInfo;

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;

    address public _owner;
    bool public _initialized;
    uint public balance;

    House [] houses;
    Offer[] offers;

    uint256 public houseCounter;

    struct House {
        uint256 value;
        uint256 income;
    }

    struct Offer {
        address payable seller;
        uint256 price;
        uint256 index;
        uint256 tokenId;
        bool active;
    }

}