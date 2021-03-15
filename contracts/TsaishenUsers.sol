// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Storage.sol";

contract TsaishenUsers is Ownable, Storage {

    event userAdded(string, address user, bool active);
    event userDeleted(string, address user, bool active);
    event houseAdded(string, address user);
    event houseDeleted(string, address user);

    address marketplace;
    address houseToken; 

    // MUST USE
    modifier onlyAuthorized(){
        require(msg.sender == marketplace || msg.sender == houseToken || msg.sender == owner(), "TU: Not authorized.");
        _;
    }

    // *** GETTER ***
    function isUser(address userToSearch) public view returns(bool){
        return users.contains(userToSearch);
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

    // function borrowedMoney(address borrower) public view returns(bool){
    //     return userInfo[borrower].borrower;
    // }

    // function lentMoney(address lender) public view returns(bool){
    //     return userInfo[lender].lender;
    // }

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

    // *** SETTER onlyOwner ***
    function setMarketplaceAddress(address _marketplace) public onlyOwner{
        marketplace = _marketplace;
    }

    function setHouseTokenAddress(address _houseToken) public onlyOwner{
        houseToken = _houseToken;
    }

    function addUser (address newUser) public onlyAuthorized{
        if(!users.contains(newUser)){
            EnumerableSet.UintSet memory _houses;
            address payable user = address(uint160(newUser));
            userInfo[newUser] = User(user, false, false, false, false, _houses);
            users.add(newUser);

            emit userAdded("New user added", newUser, true);
        }
    }

    function addHouseToUser(address user, uint256 houseId) public onlyAuthorized{
        userInfo[user].houses.add(houseId);
        userInfo[user].houseOwner = true;

        emit houseAdded("House added", user);
    }

    function deleteHouseFromUser(address user, uint256 houseId) public onlyAuthorized{
        userInfo[user].houses.remove(houseId);
        if(userInfo[user].houses.length() == 0){
            userInfo[user].houseOwner = false;
        }

        emit houseDeleted("House removed", user);
    }

    function setAsLender(address user) public onlyAuthorized{
        userInfo[user].lender = true;
    }

    function removeLenderTag(address user) public onlyAuthorized{
        userInfo[user].lender = false;
    }

    function setAsBorrower(address user) public onlyAuthorized{
        userInfo[user].borrower = true;
    }

    function removeBorrowerTag(address user) public onlyAuthorized{
        userInfo[user].borrower = false;
    }

    function rewardIssued(address user) public onlyAuthorized{
        userInfo[user].reward = true;
    }
    
    function deleteUser(address userToDelete) public onlyAuthorized{
        users.remove(userToDelete);

        emit userDeleted("User deleted", userToDelete, false);
    }
}