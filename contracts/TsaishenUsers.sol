// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./Storage.sol";

contract TsaishenUsers is Ownable, Storage {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet internal users;

    using EnumerableSet for EnumerableSet.UintSet;

    struct User {
        address payable user;
        bool houseOwner;
        bool borrower;
        bool lender;
        bool reward;
        EnumerableSet.UintSet houses;
    }    

    mapping(address => User) internal userInfo;

    event userAdded(string, address user, bool active);
    event userDeleted(string, address user, bool active);

    function addUser (address newUser) public {
        EnumerableSet.UintSet memory _houses;
        address payable user = address(uint160(newUser));
        userInfo[newUser] = User(user, false, false, false, false, _houses);
        users.add(newUser);

        emit userAdded("New user added", newUser, true);
    }

    function addHouseToUser(address user, uint256 houseId) public{
        userInfo[user].houses.add(houseId);
        userInfo[user].houseOwner = true;
    }

    function deleteHouseFromUser(address user, uint256 houseId) internal{
        userInfo[user].houses.remove(houseId);
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
    //     return users.value;
    // }

    function borrowedMoney(address borrower) public view returns(bool){
        return userInfo[borrower].borrower;
    }

    function lentMoney(address lender) public view returns(bool){
        return userInfo[lender].lender;
    }

    function getUserInfo(address user) public view returns(bool, bool, bool, bool, uint[] memory){
        EnumerableSet.UintSet memory houses;
        userInfo[user].houseOwner; //showing false even when true - WHY
        userInfo[user].borrower;
        userInfo[user].lender;
        userInfo[user].reward;
        userInfo[user].houses; //returns empty even when there is a house - WHY
    }

    // function getUserHomes(address user) public view returns(uint[] memory){
    //     return userInfo[user].houses._values;
    // }
}