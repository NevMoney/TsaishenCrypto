// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "./CRUD.sol";
import "./Storage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TsaishenUsers is Ownable, Storage {
    using AddressSet for AddressSet.Set;
    AddressSet.Set users;

    using UintSet for UintSet.Set;

    struct User {
        string name;
        string emailAddress;
        uint256 cellPhone;
        address payable user;
        uint256 points;
        uint256 index;
        bool active;
        // House house;
        UintSet.Set homes;
    }    

    // store user information
    mapping(address => User) internal userInfo;

    event userAdded(string, address user, bool active);
    event userDeleted(string, address user, bool active);

    function addUser(address newUser) public{
        users.insert(newUser);

        emit userAdded("New user added", msg.sender, true);
    }

    function isUser(address userToSearch) public view returns(bool){
        return users.exists(userToSearch);
    }

    function deleteUser(address userToDelete) public{
        users.remove(userToDelete);

        emit userDeleted("User deleted", msg.sender, false);
    }

    function userAmount() public view returns(uint256){
        return users.count();
    }

    function getAllUsers() public view returns(address[] memory){
        return users.keyList;
    }

}