// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

// import "./CRUD.sol";
import "./Storage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TsaishenUsers is Ownable, Storage {
    using AddressSet for AddressSet.Set;
    AddressSet.Set users;

    using UintSet for UintSet.Set;

    event userAdded(string, address user, bool active);
    event userDeleted(string, address user, bool active);

    function addUser (string memory _name, string memory _email, uint _phone) public onlyOwner {
        UintSet.Set memory _homes;
        Storage.House memory _House;
        userInfo[msg.sender] = User(_name, _email, _phone, msg.sender, _House, _homes);
        users.insert(msg.sender);

        emit userAdded("New user added", msg.sender, true);
    }

    // this MUST be internal once testing/debuging done!
    function addHome (address _user, uint homeId) public onlyOwner {
        userInfo[_user].homes.insert(homeId);
    }

    function getUserHomes (address _user) public view returns (uint[] memory){
        return userInfo[_user].homes.keyList;
    }

    function isUser(address userToSearch) public view returns(bool){
        return users.exists(userToSearch);
    }

    function deleteUser(address userToDelete) public onlyOwner {
        users.remove(userToDelete);

        emit userDeleted("User deleted", msg.sender, false);
    }

    function userCount() public view returns(uint256){
        return users.count();
    }

    function getAllUsers() public view returns(address[] memory) {
        return users.keyList;
    }

}