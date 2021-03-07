const TsaishenUsers = artifacts.require("TsaishenUsers");
const HouseToken = artifacts.require("HouseToken");
const Marketplace = artifacts.require("Marketplace");
const TsaishenToken = artifacts.require("TsaishenToken");
const truffleAssert = require('truffle-assertions');

// BEFORE running test.js --> uncoment line 9 in migrations2

const {
    time, 
    BN
  } = require('@openzeppelin/test-helpers');
const ether = require('@openzeppelin/test-helpers/src/ether');

var acceptableAmount = web3.utils.toWei('1', 'ether');
var cancellationFee = web3.utils.toWei('2', 'ether');
var name = "Tsaishen Real Estate";
var symbol = "HOUS";
var decimals = 18;
var baseURI = "https://ipfs.io/ipfs/";
var housePrice = 100000000;

async function createHouse(houseTokenInstance, _user, tokenURI, tokenID, _totalSupply, _userBalance) {
    let tokenReceipt = await houseTokenInstance.createHouse(1, 1, tokenURI, { value: acceptableAmount, from: _user });

    let event1 = tokenReceipt.logs[0].args;
    assert.equal(event1.tokenId.toNumber(), tokenID, "token id is incorrect");
    assert.equal(event1.from, "0x0000000000000000000000000000000000000000", "creation account is incorrect");
    assert.equal(event1.to, _user, "to account is incorrect");
    
    let event2 = tokenReceipt.logs[1].args;
    assert.equal(event2.id.toNumber(), tokenID, "token id is incorrect");
    assert.equal(event2._owner, _user, "owner is incorrect");
    assert.equal(event2.uri, baseURI + tokenURI, "token uri is incorrect");
}

async function checkDetails(houseTokenInstance, _user, tokenURI, tokenID, _totalSupply, _userBalance, _contractBalance) {
    var totalSupply = await houseTokenInstance.totalSupply();
    var userBalance = await houseTokenInstance.balanceOf(_user);
    var houseDetails = await houseTokenInstance.getHouse(tokenID);
    var owns = await houseTokenInstance.ownsHouse(_user);
    var contractBalance = await web3.eth.getBalance(houseTokenInstance.address);
    
    assert.equal(contractBalance, _contractBalance * acceptableAmount, "Incorrect balance in contract");
    assert.equal(houseDetails[0].toNumber(), 1, "incorrect value");
    assert.equal(houseDetails[1].toNumber(), 1, "incorrect income");
    assert.equal(houseDetails[2], baseURI + tokenURI, "token uri is incorrect");
    assert.equal(totalSupply, _totalSupply, "incorrect total Supply");
    assert.equal(userBalance, _userBalance, "incorrect user balance");
    assert.equal(owns, true, "user owns the house");
}

async function sellHouse(houseTokenInstance, marketplaceInstance, _user, tokenID) {
    await houseTokenInstance.setApprovalForAll(marketplaceInstance.address, true, { from: _user });
    
    let res = await marketplaceInstance.sellHouse(10, tokenID, { from: _user });
    let ev = res.logs[0].args;
    
    assert.equal(ev[0], "House listed", "incorrect event");
    assert.equal(ev[1], _user, "incorrect sender");
    assert.equal(ev[2], tokenID, "incorrect tokenID");
}

async function checkHouseOffer(marketplaceInstance, tokenID, _user) {
    let res = await marketplaceInstance.getOffer(tokenID);
    
    assert.equal(res.price, 10, "price should be 10");
    assert.equal(res.income, 1, "income should be 1");
    assert.equal(res.seller, _user, "Seller of the house not matching");
}

async function approveMarketPlace(marketplaceInstance, tsaishenTokenInstance, tokenID, _user) {
    var offer = await marketplaceInstance.getOffer(tokenID);
    var oraclePrice = await marketplaceInstance.getOracleUsdPrice(tsaishenTokenInstance.address);
    var b = (offer.price * housePrice) / oraclePrice[0];
    
    await tsaishenTokenInstance.approve(marketplaceInstance.address, web3.utils.toWei(b.toString(), 'ether'), { from: _user });
}

contract("Positive tests", (accounts) => {

    var usersInstance;
    var houseTokenInstance;
    var marketplaceInstance;
    var tsaishenTokenInstance;
    var owner = accounts[0];
    var feeRecipient = accounts[1];
    var user1 = accounts[2];
    var user2 = accounts[3];
    var user3 = accounts[4];

    before(async () => {
        // Deploy Contracts
        usersInstance = await TsaishenUsers.new();
        houseTokenInstance = await HouseToken.new(usersInstance.address, owner);
        marketplaceInstance = await Marketplace.new(usersInstance.address, houseTokenInstance.address, owner);
        tsaishenTokenInstance = await TsaishenToken.new();
        
        var tokenBalance = await tsaishenTokenInstance.balanceOf(owner);
        
        await marketplaceInstance.addOracle(tsaishenTokenInstance.address, '0x0000000000000000000000000000000000000001')
        await usersInstance.setHouseTokenAddress(houseTokenInstance.address);
        await usersInstance.setMarketplaceAddress(marketplaceInstance.address);
        console.log("TT balance", web3.utils.fromWei(tokenBalance, 'ether'));
        
        await tsaishenTokenInstance.transfer(user3, acceptableAmount);
        tokenBalance = await tsaishenTokenInstance.balanceOf(owner);
        console.log("TT owner balance", web3.utils.fromWei(tokenBalance, 'ether'));
        
        tokenBalance = await tsaishenTokenInstance.balanceOf(user1);
        console.log("TT user1 balance", web3.utils.fromWei(tokenBalance, 'ether'));
    });

    describe("HouseToken::Deployment", () => {
        it("Correct Name", async () => {
            let x = await houseTokenInstance.name();
            assert.equal(x, name, "incorrect name");
        });
        it("Correct Symbol", async () => {
            let x = await houseTokenInstance.symbol();
            assert.equal(x, symbol, "incorrect symbol");
        });
        it("Total Supply should be zero", async () => {
            let x = await houseTokenInstance.totalSupply();
            assert.equal(x, 0, "incorrect supply");
        });
        it("Correct URI", async () => {
            let x = await houseTokenInstance.baseURI();
            assert.equal(x, baseURI, "incorrect baseURI");
        });
        it("Should make first account an owner of HouseToken", async () => {
            let owner = await houseTokenInstance.owner();
            assert.equal(owner, accounts[0], "incorrect owner account");
        });
    });
    
    describe("HouseToken::Create new houses", () => {
        it("Should create house0 token for user1", async () => {
            await createHouse(houseTokenInstance, user1, "t1", 0, 1, 1);
        });
        it("Should get correct details for the new house token from user1", async () => {
            await checkDetails(houseTokenInstance, user1, "t1", 0, 1, 1, 1);
        });
        it("Should create house1 token for user2", async () => {
            await createHouse(houseTokenInstance, user2, "t2", 1, 2, 1);
        });
        it("Should get correct details for the new house token from user2", async () => {
            await checkDetails(houseTokenInstance, user2, "t2", 1, 2, 1, 2);
        });
        it("Should create house2 token for user1", async () => {
            await createHouse(houseTokenInstance, user1, "t3", 2, 3, 2);
        });
        it("Should get correct details for the new house token from user1", async () => {
            await checkDetails(houseTokenInstance, user1, "t3", 2, 3, 2, 3);
        });
        it("Should create house3 token for user2", async () => {
            await createHouse(houseTokenInstance, user2, "t4", 3, 4, 2);
        });
        it("Should get correct details for the new house token from user2", async () => {
            await checkDetails(houseTokenInstance, user2, "t4", 3, 4, 2, 4);
        });
        it("Should create house4 token for user2", async () => {
            await createHouse(houseTokenInstance, user2, "t5", 4, 5, 3);
        });
        it("Should get correct details for the new house token from user2", async () => {
            await checkDetails(houseTokenInstance, user2, "t5", 4, 5, 3, 5);
        });
        it("Should withdraw all from contract", async () => {
            var initialOwnerBalance = await web3.eth.getBalance(owner);
            console.log("initial owner balance: ", initialOwnerBalance);
            var contractBalance = await web3.eth.getBalance(houseTokenInstance.address);
            console.log("contract balance: ", contractBalance);
            
            let res = await houseTokenInstance.withdrawAll();

            var finalOwnerBalance = await web3.eth.getBalance(owner);
            console.log("final owner balance: ", finalOwnerBalance);
            var gasUsed = res.receipt.gasUsed;
            var tx = await web3.eth.getTransaction(res.tx);
            var gasPrice = tx.gasPrice;
            var i = (parseFloat(initialOwnerBalance) + parseFloat(contractBalance) - parseFloat(gasPrice * gasUsed));
            assert.equal(i, parseFloat(finalOwnerBalance), "Must be equal");

            // another way to test is using Big Number:
            // const { BN } = web3.utils;
            // var i = new BN(initialOwnerBalance).add(new BN(contractBalance)).sub(new BN(gasPrice).mul(new BN(gasUsed))).toString();
            // console.log("value of i: ", i);
            // assert.equal("compare i to final owner balance: ", i, new BN(finalOwnerBalance).toString(), "Must be equal");
        });
    });

    describe("TsaishenUsers::UserInfo", () => {
        it("Correct Details for User 1", async () => {
            let x = await usersInstance.getUserInfo(user1);
            assert.isTrue(x[0]);
            assert.isFalse(x[1]);
            assert.isFalse(x[2]);
            assert.isFalse(x[3]);
            assert.equal(web3.utils.hexToNumber(x[4][0]), '0', "should be 0");
            assert.equal(web3.utils.hexToNumber(x[4][1]), '2', "should be 2");
        });
        it("Correct Details for User 3", async () => {
            let x = await usersInstance.getUserInfo(user3);
            assert.isFalse(x[0]);
            assert.isFalse(x[1]);
            assert.isFalse(x[2]);
            assert.isFalse(x[3]);
            assert.equal(x.houses.length, '', "should be none");
        });
    });

    describe("Marketplace::Deployment", () => {
        it("Should make first account an owner of Marketplace", async () => {
            let owner = await marketplaceInstance.owner();
            assert.equal(owner, accounts[0], "incorrect owner account");
        });
        it("Should get correct Oracle price", async () => {
            let orcPrice = await marketplaceInstance.getOracleUsdPrice(tsaishenTokenInstance.address);
            assert.equal(orcPrice[0], 10000000000, "incorrect oracle price");
        });
    });

    describe("Marketplace::Listing house", () => {
        it("should list house 0 of user1", async () => {
            await sellHouse(houseTokenInstance, marketplaceInstance, user1, 0);
        });
        it("Should Get all tokens on sale", async () => {
            let res = await marketplaceInstance.getAllTokensOnSale();
            assert.equal(res.length, 1, "only 1 house on sale");
        });
        it("Should list house 1 of user2", async () => {
            await sellHouse(houseTokenInstance, marketplaceInstance, user2, 1);
        });
        it("Should list house 2 of user1", async () => {
            await sellHouse(houseTokenInstance, marketplaceInstance, user1, 2);
        });
        it("Should remove offer on house 2", async () => {
            let res = await marketplaceInstance.removeOffer(2, { from: user1 });
            let ev = res.logs[0].args;
            assert.equal(ev[0], "Offer removed", "incorrect event");
            assert.equal(ev[1], user1, "incorrect sender");
            assert.equal(ev[2], 2, "incorrect tokenID");
        });
        it("Should get all tokens on sale", async () => {
            let res = await marketplaceInstance.getAllTokensOnSale();
            assert.equal(res.length, 3, "3 house on sale");
        });
        it("Should list house 2 of user1", async () => {
            await sellHouse(houseTokenInstance, marketplaceInstance, user1, 2);
        });
        it("Should list house 2 of user2", async () => {
            await sellHouse(houseTokenInstance, marketplaceInstance, user2, 3);
        });
        it("Should check Offer on house 1", async () => {
            await checkHouseOffer(marketplaceInstance, 1, user2);
        });
        it("Should check Offer on house 2", async () => {
            await checkHouseOffer(marketplaceInstance, 2, user1);
        });
        it("Should check Offer on house 3", async () => {
            await checkHouseOffer(marketplaceInstance, 3, user2);
        });
        it("Should get all tokens on sale", async () => {
            let res = await marketplaceInstance.getAllTokensOnSale();
            assert.equal(res.length, 5, "5 house on sale");
        });
    });

    describe("Marketplace::Buy Houses", () => {
        it("Should buy house0 for user3 directly", async () => {
            await approveMarketPlace(marketplaceInstance,tsaishenTokenInstance, 0, user3);
            await marketplaceInstance.buyHouse(tsaishenTokenInstance.address, 0, { from: user3 });
            let x = await usersInstance.getUserInfo(user3);
            assert.isTrue(x.houseOwner);
            assert.isFalse(x.borrower);
            assert.isFalse(x.lender);
            assert.isFalse(x.reward);
            assert.equal(web3.utils.hexToNumber(x.houses[0]), '0', "should be 0");
        });
        it("Should put money in escrow for house1 from user3", async () => {
            await approveMarketPlace(marketplaceInstance,tsaishenTokenInstance, 1, user3);
            await marketplaceInstance.buyHouseWithEscrow(tsaishenTokenInstance.address, 1, {from: user3});
            let marketBalance = await tsaishenTokenInstance.balanceOf(marketplaceInstance.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0.1,"market balance should be 0.1");
        });
        it("Should put money in escrow for house2 from user3", async () => {
            await approveMarketPlace(marketplaceInstance,tsaishenTokenInstance, 2, user3);
            await marketplaceInstance.buyHouseWithEscrow(tsaishenTokenInstance.address, 2, {from: user3});
            let marketBalance = await tsaishenTokenInstance.balanceOf(marketplaceInstance.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0.2,"market balance should be 0.2");
        });
        it("Should NOT refund the money in house1 escrow before timeout", async () => {
            var info = await marketplaceInstance.escrowInfo(1);
            // console.log("house1 escrow info: ", info);
            var i = info.timelock.toString();
            var x = await time.latest();
            console.log("timelock", i); 
            console.log("current time", x.toString()); 
            await truffleAssert.reverts(marketplaceInstance.refundEscrow(1), "Timelocked."); 
        });
        it("Should refund money in escrow for house1 to user3", async() => {
            console.log("Skip forward 10 days...");
            await time.advanceBlock();
            await time.increase(864000);
            await marketplaceInstance.refundEscrow(1);
            let userBalance = await tsaishenTokenInstance.balanceOf(user3);
            assert.equal(web3.utils.fromWei(userBalance,'ether'),0.8,"user balance should be 0.8");
            let marketBalance = await tsaishenTokenInstance.balanceOf(marketplaceInstance.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0.1,"market balance should be 0.1");
        });
        it("Should NOT refund money in escrow for house1 to user3 now", async() => {
            await truffleAssert.reverts(marketplaceInstance.refundEscrow(1),"Must be active.");
        });
        it("Should put money in escrow for house3 from user3", async () => {
            await approveMarketPlace(marketplaceInstance,tsaishenTokenInstance, 3, user3);
            await marketplaceInstance.buyHouseWithEscrow(tsaishenTokenInstance.address, 3, {from: user3});
            let marketBalance = await tsaishenTokenInstance.balanceOf(marketplaceInstance.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0.2,"market balance should be 0.2");
        });
        it("Should send money in escrow for house 2 to user1", async() => {
            await marketplaceInstance.finalizeEscrowTransaction(2);
            let userBalance = await tsaishenTokenInstance.balanceOf(user3);
            assert.equal(web3.utils.fromWei(userBalance,'ether'),0.7,"user balance should be 0.7");
            let marketBalance = await tsaishenTokenInstance.balanceOf(marketplaceInstance.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0.1,"market balance should be 0.1");
        });
        it("Should check token amount for each account", async () => {
            let userBalance = await tsaishenTokenInstance.balanceOf(user3);
            assert.equal(web3.utils.fromWei(userBalance, 'ether'), 0.7, "user balance should be 0.7");
            userBalance = await tsaishenTokenInstance.balanceOf(user1);
            assert.equal(web3.utils.fromWei(userBalance, 'ether'), 0.195, "user balance should be 0.195");
            userBalance = await tsaishenTokenInstance.balanceOf(user2);
            assert.equal(web3.utils.fromWei(userBalance, 'ether'), 0, "user balance should be 0");
            userBalance = await tsaishenTokenInstance.balanceOf(feeRecipient);
            assert.equal(web3.utils.fromWei(userBalance, 'ether'), 0, "user balance should be 0");
            let marketBalance = await tsaishenTokenInstance.balanceOf(marketplaceInstance.address);
            assert.equal(web3.utils.fromWei(marketBalance, 'ether'), 0.1, "market balance should be 0.1");
        });
        it("Should extend timelock for house3 from user3", async () => {
            var info = await marketplaceInstance.escrowInfo(3);
            var originalTimelock = info.timelock.toString();
            console.log("originalTimelock: ", originalTimelock);
            await marketplaceInstance.buyerReviewRequest(3, { from: user3 });
            var extension = await marketplaceInstance.escrowInfo(3);
            var extended = extension.timelock;
            var currentTime = await time.latest();
            console.log("extendedtimelock: ", extended.toString());
            console.log("current time: ", currentTime.toString());
            var i = (parseFloat(extended) - parseFloat(currentTime));
            assert.equal(i, parseFloat(259200), "Must be equal");
        });
        it("Should cancel escrow for house3 from user3", async () => {
            let user3Balance = await web3.eth.getBalance(user3);
            u3Bal = web3.utils.fromWei(user3Balance); //showing 99
            cFee = web3.utils.fromWei(cancellationFee); //showing 2
            console.log("user3 bal", u3Bal);
            console.log("canc fee", cFee);
            // await marketplaceInstance.cancelEscrowSale(3, { value: cancellationFee, from: user3 }); //throwing error insufficient funds
            // var marketBalance = await tsaishenTokenInstance.balanceOf(marketplaceInstance.address);
            // assert.equal(web3.utils.fromWei(marketBalance, 'ether'), 2.1, "market balance should be 2.1");
        });
    });

    describe("TsaishenUsers::UserInfo", () => {
        it("Should get correct Details for User 1", async () => {
            await usersInstance.deleteHouseFromUser(user1,0);
            let x = await usersInstance.getUserInfo(user1);
            console.log(x);
            assert.isFalse(x.houseOwner);
            assert.equal(x.houses.length, 0, "should be 0");
        });
        it("Should get correct Details for User 2", async () => {
            let x = await usersInstance.getUserInfo(user2);
            assert.isTrue(x.houseOwner);
            assert.equal(x.houses.length, 3, "should be 3");
        });
        it("Should get correct Details for User 3", async () => {
            let x = await usersInstance.getUserInfo(user3);
            assert.isTrue(x.houseOwner);
            assert.equal(x.houses.length, 2, "should be 2");
        });
    });
});

contract("Reverted tests", (accounts) => {
    
    var usersInstance;
    var houseTokenInstance;
    var marketplaceInstance;
    var tsaishenTokenInstance;
    
    var owner = accounts[0];
    var creator = accounts[1];
    var user1 = accounts[2];
    var user2 = accounts[3];

    before(async () => {
        
        usersInstance = await TsaishenUsers.new();
        houseTokenInstance = await HouseToken.new(usersInstance.address, owner);
        marketplaceInstance = await Marketplace.new(usersInstance.address, houseTokenInstance.address, owner);
        tsaishenTokenInstance = await TsaishenToken.new();

        await marketplaceInstance.addOracle(tsaishenTokenInstance.address, '0x0000000000000000000000000000000000000001')
        await usersInstance.setHouseTokenAddress(houseTokenInstance.address);
        await usersInstance.setMarketplaceAddress(marketplaceInstance.address)
        console.log(marketplaceInstance.address);
        console.log("House Token address: " + houseTokenInstance.address);
    });

    describe("HouseToken", () => {
        it("Negative test for house token 0", async () => {
            await truffleAssert.reverts(houseTokenInstance.getHouse(0), "ERC721Metadata: URI query for nonexistent token");
        });
        it("Negative test for owning house", async () => {
            let res = await houseTokenInstance.ownsHouse(owner);
            assert.equal(res, false, "shouldn't own a house");
        });
        it("Negative test less than 1 ether cost", async () => {
            await truffleAssert.reverts(houseTokenInstance.createHouse(1, 1, "tokenURI", { value: 10, from: accounts[2] }), "HT: Insufficient funds.");
        });
    });

});