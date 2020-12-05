// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "@openzeppelin/contracts/payment/escrow/RefundEscrow.sol";
import "./tokens/HouseToken.sol";
import "./Marketplace.sol";

/* 
Escrow is needed for both sale. 

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
Oracle solves this problem. With utilization of the parcel mailing call
to internet (perhaps they have API?!) and perhaps a verification of the deed info. 
Protocol would give buyer 10 days to confirm/contest before funds are automatically 
released if the online verification matches input.

Upon Escrow receiving funds, the seller has 10 days to upload deed and mailing info,
else the funds are reverted back to the buyer.

*/

// contract TsaishenEscrow is RefundEscrow {
//     // need timeOut functions
//     // need oracle
// }