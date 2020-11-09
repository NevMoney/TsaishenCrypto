// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "./tokens/HouseToken.sol";

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

contract TsaishenLending {
    // lendingCap function, 35% of the equity, 6 months of income, or combo
    // crowdFunding function, allowing for multiple users to lend up to cap
}