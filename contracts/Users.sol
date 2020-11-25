// // SPDX-License-Identifier: MIT

// pragma solidity 0.6.10;

// import "../CRUD.sol";
// import "../Storage.sol";

// contract Users is Ownable, Storage, CRUD {

//     event userCreated(address user, bool active);
//     event userDeleted(address user, bool active);

//     function _createUser(address _user) internal returns (address, uint256, uint256, bool){
//         User memory _user = User({
//         user: msg.sender,
//         points: 25,
//         index: users.length,
//         active: true
//         });

//         insertUser(_user);

//         // place users in array
//         users.push(_user);

//         // add user to userInfo mapping
//         // userInfo[msg.sender] = _user;

//         emit userCreated(_user.address, _user.active);
//     }

//     function insertUser(User memory newUser) public view returns(address, uint256, uint256, bool){
//         address user = msg.sender;
//         userInfo[user] = newUser;
//     }

//     function inactivateUser(address user) public onlyOwner returns(address, bool){
//         bool active = false;
//         return(address user, bool active);
//     }

//     function deleteUser(address owner) internal onlyOwner{
//         address user = userInfo[user].address;
//         bool active = userInfo[user].active;
//         delete userInfo[user];
//         assert(userInfo[user].active == false);
        
//         emit userDeleted(user, active);
//     }

// }