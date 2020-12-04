// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

// import "./CRUD.sol";
// import "./Storage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";
// import "./tokens/HouseToken.sol";

contract TsaishenUsers is Ownable, Storage {
    // using AddressSet for AddressSet.Set;
    // AddressSet.Set users;
    // using UintSet for UintSet.Set;
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
    // User [] userArray;

    event userAdded(string, address user, bool active);
    event userDeleted(string, address user, bool active);

    function addUser (address newUser) public {
        Storage.House memory _House;
        // userArray.push(newUser);
        address payable user = address(uint160(newUser));
        userInfo[newUser] = userArray.length - 1;
        userInfo[newUser] = User(user, _House, false, false, false, false);
        users.add(newUser);

        emit userAdded("New user added", msg.sender, true);
    }

    function isUser(address userToSearch) public view returns(bool){
        return users.contains(userToSearch);
    }

    function deleteUser(address userToDelete) public onlyOwner {
        users.remove(userToDelete);
        // userArray.pop(); //don't know if i need this

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

    function ownsHouse(address _address) public view returns(bool){
        if(balanceOf(address owner) >= 1) return true;
        return false;
    }

    function boughtHouse(address buyer) public view returns(bool){
        if(safeTransferFrom(address to) == 0) return false;
        return true;
    }

    function soldHouse(address seller) public view returns(bool){
        if(safeTransferFrom(address from) == 0) return false;
        return true;
    }

    function borrowedMoney(address borrower) public view returns(bool){
        return userInfo[borrower].borrower;
    }

    function lentMoney(address lender) public view returns(bool){
        return userInfo[lender].lender;
    }

    function getUserInfo(address user) public view returns(House, bool, bool, bool, bool, uint256){
        userInfo[user].House;
        userInfo[user].houseOwner;
        userInfo[user].borrower;
        userInfo[user].lender;
        userInfo[user].reward;
    }
}