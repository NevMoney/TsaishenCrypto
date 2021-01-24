// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./Storage.sol";

contract TsaishenUsers is Ownable, Storage {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet internal users;

    using EnumerableSet for EnumerableSet.UintSet;

    address marketplace;
    address houseToken;

    // for local testing we won't use it but for testNet and mainNet we will
    modifier onlyAuthorized(){
        require(msg.sender == marketplace || msg.sender == houseToken || msg.sender == owner(), "Not authorized.");
        _;
    }

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

    function setMarketplaceAddress(address _marketplace) public onlyOwner{
        marketplace = _marketplace;
    }

    function setHouseTokenAddress(address _houseToken) public onlyOwner{
        houseToken = _houseToken;
    }

    function addUser (address newUser) public onlyAuthorized{
        EnumerableSet.UintSet memory _houses;
        address payable user = address(uint160(newUser));
        userInfo[newUser] = User(user, false, false, false, false, _houses);
        users.add(newUser);

        emit userAdded("New user added", newUser, true);
    }

    function addHouseToUser(address user, uint256 houseId) public onlyAuthorized{
        userInfo[user].houses.add(houseId);
        userInfo[user].houseOwner = true;
    }

    function deleteHouseFromUser(address user, uint256 houseId) public onlyAuthorized{
        userInfo[user].houses.remove(houseId);
    }

    function isUser(address userToSearch) public view returns(bool){
        return users.contains(userToSearch);
    }

    function deleteUser(address userToDelete) public onlyAuthorized{
        users.remove(userToDelete);

        emit userDeleted("User deleted", userToDelete, false);
    }

    function userCount() public view returns(uint256){
        return users.length();
    }

    function userAtIndex (uint256 index) public view returns (address){
        return users.at(index);
    }

    function getAllUsers() public view returns(bytes32[] memory _users){
        return _users = users._inner._values;
    }

    function borrowedMoney(address borrower) public view returns(bool){
        return userInfo[borrower].borrower;
    }

    function lentMoney(address lender) public view returns(bool){
        return userInfo[lender].lender;
    }

    function getUserInfo(address user) public view returns(bool houseOwner, bool borrower, bool lender, bool reward, bytes32[] memory houses){
        houseOwner = userInfo[user].houseOwner;
        borrower = userInfo[user].borrower;
        lender = userInfo[user].lender;
        reward = userInfo[user].reward;
        houses = userInfo[user].houses._inner._values;
    }

    function getUserHomes(address user) public view returns(bytes32[] memory homes){
        return homes = userInfo[user].houses._inner._values;
    }
}