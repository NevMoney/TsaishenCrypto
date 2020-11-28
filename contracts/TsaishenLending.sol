// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

/*
This contract is needed for lending/borrowing.

houseOwner clicks on Borrow button and selects the amount up to 35%
of the equity. Borrower then uploads the URL from county registrar 
with their property showing the outstanding lien amount.

From HouseToken contract (URI) we get value and from county URL we
get amount owed (PROBLEM: not all standardized). If amount requested
is <= equity=(value - mortgage) the property lists on marketplace for
lending, else reverts. 

A workaround for the non-standardization of the liens is that house
lists on marketplace for lending with above information and the lender
has to verify information before providing funding.

What would likely make this very palatable option for all users is
creation of Crowd Funding option where individuals can lend any amount
up to the requested. As long as the cap is not met the funding is open.

CHALLENGE:
Borrower not making payments and with Crowd Funding foreclosure may be
challenging, unless they are together put into a legal entity and self
select leadership for representation. This can be offset with lien 
recording to the county where once funded the lien is mailed/recorded.
Additional resolution is for each lender to file legal claim individually
and this can be offset with higher APR to account for risk. With Crowd 
Funding most users will likely put a smaller amount and later the
app can develp trustability score for borrowers who repay on time and
as agreed, thus creating a version of credit score.

A reliefe/resolution for this piece can also come from the income input
from the HouseToken, which can be used to offset risk of repayment, 
especially in the future as more payments start happening on the BC.

Finally, having one lender can create a much easier creation of the
lien to be recorded with the county thus giving greater security for
the borrower. This lower risk could also result in somewhat lower APR.

Future development, especialy of the ERC20 token, which should have 
staking and lending pool development capabilities, can then allow for
automated contract driven creation of lending and as such creation of
the legal entity and security through lien recording. Additionally,
the individuals involved in particular lending group can then self-
govern and vote on the leader/representative of the group. Another 
solution is to provide automatic leadership to individual/entity that
lends the higher amount. 

FOR NOW: we can create a simpler structure to allow for borrowing and
simply share the risks on the website, so that each user can make their
own educated decision.
*/

// lendingCap function, 35% of the equity, 6 months of income, or combo
// crowdFunding function, allowing for multiple users to lend up to cap

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Storage.sol";
import "./tokens/HouseToken.sol";
import "./Marketplace.sol";

// contract TsaishenLending is Ownable, Storage, Marketplace {
//     HouseToken private _houseToken;

//     using SafeMath for uint256;

//     uint256 lendingFee = 2; //2% transaction fee

//     constructor(address _houseTokenAddress) public {
//         _setHouseToken(_houseTokenAddress);
//     }

//     event MarketTransaction (string, address, uint);

//     // internal borrow function to set parameters
//     function _loanMax (uint256 _tokenId) internal returns (uint256) {
//         uint256 maxLTV = 35; //35% is max one can borrow
//         // uint256 _loanMax = houseInfo[_tokenId].value.mul(maxLTV);
//         return (houseInfo[_tokenId].value.mul(maxLTV));
//     }

//     // function for owner to borrow
//     function borrowFunds (uint256 _loan, uint256 _tokenId) public {
//         require(_ownsHouse(msg.sender, _tokenId), "Seller not owner");
//         require(tokenIdToOffer[_tokenId].active == false, "House already listed");
//         require(_houseToken.isApprovedForAll(msg.sender, address(this)), "Not approved");
//         require(_loan <= _loanMax(_tokenId), "Loan cannot exceed 35% LTV");

//         //create offer by inserting items into the array
//         Offer memory _offer = Offer({
//             seller: msg.sender,
//             price: houseInfo[_tokenId].value,
//             income: houseInfo[_tokenId].income,
//             loan: _loan,
//             active: true,
//             tokenId: _tokenId,
//             index: offers.length
//         });

//         tokenIdToOffer[_tokenId] = _offer; //add offer to the mapping
//         offers.push(_offer); //add to the offers array

//         emit MarketTransaction("Loan requested", msg.sender, _tokenId);
//     }

//     //function to lend money
//     function lendFunds (uint256 _tokenId) public payable{
//         Offer storage offer = tokenIdToOffer[_tokenId];      
//         require(offer.active == true, "House not on market"); 

//         // get ETHUSD conversion
//         (int256 currentEthPrice, uint256 updatedAt) = (getPrice());

//         // check if the user sent enough ether according to the price of the housePrice
//         uint256 housePriceInETH = offer.loan.mul(housePrice).mul(1 ether).div(uint(currentEthPrice));

//         // make transaction fee house specific
//         uint256 houseTransactionFee = housePriceInETH.mul(lendingFee).div(100);

//         // convert offer price from USD to ETH and ensure enough funds are sent by buyer
//         require(msg.value > housePriceInETH, "Price not matching");

//         //price data should be fresher than 1 hour
//         require(updatedAt >= now - 1 hours, "Data too old");

//         // transfer fee to creator
//         address payable creator = (0xb0F6d897C9FEa7aDaF2b231bFbB882cfbf831D95);
//         creator.transfer(houseTransactionFee);

//         // transfer proceeds to seller - lendingFee
//          offer.seller.transfer(housePriceInETH.sub(houseTransactionFee));

//         // THIS NEEDS TO BE REWORKED - have to transfer only 35% of the token
//         //finalize by transfering token ownership
//         _houseToken.transferFrom(offer.seller, msg.sender, _tokenId);

//         // set the id to inactive
//         offers[offer.index].active = false;

//         // remove from mapping BEFORE transfer takes place to ensure there is no double dipping
//         delete tokenIdToOffer[_tokenId];

//         // refund user if sent more than the price
//         if (msg.value > housePriceInETH){
//             msg.sender.transfer(msg.value - housePriceInETH);
//         }

//         emit MarketTransaction("Loan funded", msg.sender, _tokenId);
//     }
// }