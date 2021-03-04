// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./libs/UniversalERC20.sol";

contract Storage {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet internal users;

    using EnumerableSet for EnumerableSet.UintSet;
    using UniversalERC20 for IERC20;

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

    mapping(address => User) internal userInfo;

    struct User {
        address payable user;
        bool houseOwner;
        bool borrower;
        bool lender;
        bool reward;
        EnumerableSet.UintSet houses;
    } 

    // tokenId to Struct
    mapping(uint256 => Escrow) escrowById;

    struct Escrow {
        IERC20 token; 
        address payable seller; 
        address payable buyer; 
        State state;
        uint256 amount;
        uint256 timelock;
    }

    enum State { Active, Refunding, Closed }

    mapping (address => address) availableOracles;
    mapping(uint256 => Offer) internal offerDetails;
    Offer [] offers;

    struct Offer {
        address payable seller;
        uint256 price;
        uint256 income;
        uint256 loan;
        uint256 index;
        uint256 tokenId;
        bool active;
    }
}