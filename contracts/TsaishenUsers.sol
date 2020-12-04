// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;
// pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";
import "./Storage.sol";
// import "./tokens/HouseToken.sol";

contract TsaishenUsers is Ownable, Storage {

    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet internal users;

    // user stuff
    struct User {
        address payable user;
        House house;
        bool houseOwner;
        bool borrower;
        bool lender;
        bool reward;
    }    

    // store user information
    mapping(address => User) internal userInfo;


    event userAdded(string, address user, bool active);
    event userDeleted(string, address user, bool active);

    function addUser (address newUser) public {
        Storage.House memory _House;
        address payable user = address(uint160(newUser));
        userInfo[newUser] = User(user, _House, false, false, false, false);
        users.add(newUser);

        emit userAdded("New user added", msg.sender, true);
    }

    function isUser(address userToSearch) public view returns(bool){
        return users.contains(userToSearch);
    }

    function deleteUser(address userToDelete) public onlyOwner {
        users.remove(userToDelete);

        emit userDeleted("User deleted", userToDelete, false);
    }

    function userCount() public view returns(uint256){
        return users.length();
    }

    function userAtIndex (uint256 index) public view returns (address){
        return users.at(index);
    }

    // CAN'T GET THIS ONE TO WORK!!!
    // function getAllUsers() public view returns(address[] memory){
    //     return users._values;
    // }

    function borrowedMoney(address borrower) public view returns(bool){
        return userInfo[borrower].borrower;
    }

    function lentMoney(address lender) public view returns(bool){
        return userInfo[lender].lender;
    }

    function getUserInfo(address user) public view returns(bool, bool, bool, bool, uint256){
        // House memory house;
        // userInfo[user].house;
        userInfo[user].houseOwner;
        userInfo[user].borrower;
        userInfo[user].lender;
        userInfo[user].reward;
    }
}