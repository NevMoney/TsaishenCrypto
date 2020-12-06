// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "@openzeppelin/contracts/payment/escrow/RefundEscrow.sol";
import "./tokens/HouseToken.sol";
import "./Marketplace.sol";

/* 
Escrow is needed for sale and lending. 

Idea is that houseOwner lists the house for sale and it shows in Marketplace
buyer decides to buy and the money goes into the escrow until quit claim deed
has been filled out and mailed to county for registration/transfer of ownership.
When completed the money is released from Escrow to seller.
Seller mails deed directly to county with tracking receipt, sending image/PDF
and the mailing tracking number to the buyer (perhaps through app). When confirmed, 
funds are released. PREFERRED OPTION - neutral third party oracle to verify info as:
    a) buyer could fail to verify information causing funds to be locked up forever
    while they get the property and seller gets nothing
    b) seller could enter false information, causing funds to be released but buyer
    not receive the property.
Oracle solves this problem with easypost (through Chainlink). 
Must have timeOut function 10-14 days to confirm/contest before funds are automatically 
released if the online verification matches input.

timeOut function for seller: 10 days to mail and upload info, else the payment reverts.

*/

// contract TsaishenEscrow is RefundEscrow {
//     
// }