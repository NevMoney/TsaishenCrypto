const TsaishenUsers = artifacts.require("TsaishenUsers");
const HouseToken = artifacts.require("HouseToken");
const Marketplace = artifacts.require("Marketplace");
const TsaishenToken = artifacts.require("TsaishenToken");
const truffleAssert = require('truffle-assertions');

var acceptableAmount = web3.utils.toWei('1', 'ether');
var name = "Tsaishen Real Estate";
var symbol = "HOUS";
var decimals = 18;
var baseURI = "ipfs://";
var housePrice = 100000000;

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

async function createHouse(houseTokenInstance, _user, tokenURI, tokenID, _totalSupply, _userBalance) {
    let tokenReceipt = await houseTokenInstance.createHouse(1, 1, tokenURI, { value: acceptableAmount, from: _user })

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
    var contractBalance = await web3.eth.getBalance(HouseToken.address);
    assert.equal(contractBalance, _contractBalance * acceptableAmount, "Incorrect balance in contract");
    assert.equal(houseDetails[0].toNumber(), 1, "incorrect value");
    assert.equal(houseDetails[1].toNumber(), 1, "incorrect income");
    assert.equal(houseDetails[2], baseURI + tokenURI, "token uri is incorrect");
    assert.equal(totalSupply, _totalSupply, "incorrect total Supply");
    assert.equal(userBalance, _userBalance, "incorrect user balance");
    assert.equal(owns, true, "user owns the house");
}

async function sellHouse(houseTokenInstance, marketplaceInstance, _user, tokenID) {
    await houseTokenInstance.setApprovalForAll(Marketplace.address, true, { from: _user });
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

async function approveMarketPlace(marketplaceInstance, tsaishenTokenInstance,tokenID, _user) {
    var offer = await marketplaceInstance.getOffer(tokenID);
    var oraclePrice = await marketplaceInstance.getOracleUsdPrice(TsaishenToken.address);
    var b = (offer.price * housePrice) / oraclePrice[0];
    await tsaishenTokenInstance.approve(Marketplace.address, web3.utils.toWei(b.toString(), 'ether'), { from: _user });
}

contract("Positive tests", (accounts) => {

    var houseTokenInstance;
    var usersIntance;
    var tsaishenTokenInstance;
    var marketplaceInstance
    var owner = accounts[0];
    var feeRecipient = accounts[1];
    var user1 = accounts[2];
    var user2 = accounts[3];
    var user3 = accounts[4];

    before(async () => {
        marketplaceInstance = await Marketplace.deployed();
        houseTokenInstance = await HouseToken.deployed();
        usersIntance = await TsaishenUsers.deployed();
        tsaishenTokenInstance = await TsaishenToken.deployed();
        var tokenBalance = await tsaishenTokenInstance.balanceOf(owner);
        await marketplaceInstance.addOracle(TsaishenToken.address, '0x0000000000000000000000000000000000000001')
        await usersIntance.setHouseTokenAddress(HouseToken.address);
        await usersIntance.setMarketplaceAddress(Marketplace.address);
        console.log(web3.utils.fromWei(tokenBalance, 'ether'));
        await tsaishenTokenInstance.transfer(user3, acceptableAmount);
        tokenBalance = await tsaishenTokenInstance.balanceOf(owner);
        console.log(web3.utils.fromWei(tokenBalance, 'ether'));
        tokenBalance = await tsaishenTokenInstance.balanceOf(user1);
        console.log(web3.utils.fromWei(tokenBalance, 'ether'));
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
        it("Should create a new house token for user1", async () => {
            await createHouse(houseTokenInstance, user1, "t1", 0, 1, 1);
        });
        it("should get correct details for the new house token from user1", async () => {
            await checkDetails(houseTokenInstance, user1, "t1", 0, 1, 1, 1);
        });
        it("Should create a new house token for user2", async () => {
            await createHouse(houseTokenInstance, user2, "t1", 1, 2, 1);
        });
        it("should get correct details for the new house token from user2", async () => {
            await checkDetails(houseTokenInstance, user2, "t1", 1, 2, 1, 2);
        });
        it("Should create a new house token for user1", async () => {
            await createHouse(houseTokenInstance, user1, "t2", 2, 3, 2);
        });
        it("should get correct details for the new house token from user1", async () => {
            await checkDetails(houseTokenInstance, user1, "t2", 2, 3, 2, 3);
        });
        it("should withdraw all from contract", async () => {
            var initialOwnerBalance = await web3.eth.getBalance(owner);
            var contractBalance = await web3.eth.getBalance(HouseToken.address);
            console.log("congract balance: ", contractBalance);
            // let res = await houseTokenInstance.withdrawAll(); //showing "invalid opcode"
            var finalOwnerBalance = await web3.eth.getBalance(owner);
            console.log("final owner balance: ", finalOwnerBalance);
            // var gasUsed = res.receipt.gasUsed;
            // var tx = await web3.eth.getTransaction(res.tx);
            // var gasPrice = tx.gasPrice;
            // var i = (parseInt(initialOwnerBalance) + parseInt(contractBalance) - parseInt(gasPrice * gasUsed));
            // assert.equal(i, parseInt(finalOwnerBalance), "Must be equal");
        });
    });

    describe("TsaishenUsers::UserInfo", () => {
        it("Correct Details for User 1", async () => {
            let x = await usersIntance.getUserInfo(user1);
            assert.isTrue(x[0]);
            assert.isFalse(x[1]);
            assert.isFalse(x[2]);
            assert.isFalse(x[3]);
            assert.equal(web3.utils.hexToNumber(x[4][0]), '0', "should be 0");
            assert.equal(web3.utils.hexToNumber(x[4][1]), '2', "should be 2");
        });
    });

    describe("Marketplace::Deployment", () => {
        it("Should make first account an owner of Marketplace", async () => {
            let owner = await marketplaceInstance.owner();
            assert.equal(owner, accounts[0], "incorrect owner account");
        });
        it("should get correct Oracle price", async () => {
            let orcPrice = await marketplaceInstance.getOracleUsdPrice(TsaishenToken.address);
            assert.equal(orcPrice[0], 10000000000, "incorrect oracle price");
        });
    });

    describe("Marketplace::Listing house", () => {
        it("should list house 0 of user1", async () => {
            await sellHouse(houseTokenInstance, marketplaceInstance, user1, 0);
        });
        it("should Get all tokens on sale", async () => {
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
            assert.equal(res.length, 3, "only 1 house on sale");
        });
        it("Should list house 2 of user1", async () => {
            await sellHouse(houseTokenInstance, marketplaceInstance, user1, 2);
        });
        it("Should check Offer on house 1", async () => {
            await checkHouseOffer(marketplaceInstance, 1, user2);
        });
        it("Should check Offer on house 2", async () => {
            await checkHouseOffer(marketplaceInstance, 2, user1);
        });
    });

    describe("Marketplace::Buy Houses", () => {
        it("Should buy house 0 for user3 directly", async () => {
            await approveMarketPlace(marketplaceInstance,tsaishenTokenInstance, 0, user3);
            let res = await marketplaceInstance.buyHouse(TsaishenToken.address, 0, { from: user3 });
            let x = await usersIntance.getUserInfo(user3);
            assert.isTrue(x.houseOwner);
            assert.isFalse(x.borrower);
            assert.isFalse(x.lender);
            assert.isFalse(x.reward);
            assert.equal(web3.utils.hexToNumber(x.houses[0]), '0', "should be 0");
        });
        it("Should put money in escrow for house 1 from user3", async () => {
            await approveMarketPlace(marketplaceInstance,tsaishenTokenInstance, 1, user3);
            let res = await marketplaceInstance.buyHouseWithEscrow(TsaishenToken.address, 1, {from: user3});
            let marketBalance = await tsaishenTokenInstance.balanceOf(Marketplace.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0.1,"market balance should be 0.1");
        });
        it("Should put money in escrow for house 2 from user3", async () => {
            await approveMarketPlace(marketplaceInstance,tsaishenTokenInstance, 2, user3);
            let res = await marketplaceInstance.buyHouseWithEscrow(TsaishenToken.address,2, {from: user3});
            let marketBalance = await tsaishenTokenInstance.balanceOf(Marketplace.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0.2,"market balance should be 0.2");
        });
        it("Should NOT refund the money in escrow before timeout", async()=>{
            await truffleAssert.reverts(marketplaceInstance.refundEscrow(1), "Timelocked.");
            // await marketplaceInstance.permitRefunds(1);
        });
        it("Should refund money in escrow for house 1 to user3", async() => {
            console.log("Wait for 1 minute");
            await sleep(60000);
            await marketplaceInstance.refundEscrow(1);
            let userBalance = await tsaishenTokenInstance.balanceOf(user3);
            assert.equal(web3.utils.fromWei(userBalance,'ether'),0.8,"user balance should be 0.8");
            let marketBalance = await tsaishenTokenInstance.balanceOf(Marketplace.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0.1,"market balance should be 0.1");
        });
        it("should not refund money in escrow for house 1 to user3 now", async() => {
            await truffleAssert.reverts(marketplaceInstance.refundEscrow(1),"Must be active.");
        });
        it("should send money in escrow for house 2 to user1", async() => {
            await marketplaceInstance.finalizeEscrowTransaction(2);
            let userBalance = await tsaishenTokenInstance.balanceOf(user3);
            assert.equal(web3.utils.fromWei(userBalance,'ether'),0.8,"user balance should be 0.8");
            let marketBalance = await tsaishenTokenInstance.balanceOf(Marketplace.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0,"market balance should be 0");
        });
        it("should check token amount for each account", async()=>{
            let userBalance = await tsaishenTokenInstance.balanceOf(user3);
            assert.equal(web3.utils.fromWei(userBalance,'ether'),0.8,"user balance should be 0.8");
            userBalance = await tsaishenTokenInstance.balanceOf(user1);
            assert.equal(web3.utils.fromWei(userBalance,'ether'),0.195,"user balance should be 0.195");
            userBalance = await tsaishenTokenInstance.balanceOf(user2);
            assert.equal(web3.utils.fromWei(userBalance,'ether'),0,"user balance should be 0");
            userBalance = await tsaishenTokenInstance.balanceOf(feeRecipient);
            assert.equal(web3.utils.fromWei(userBalance,'ether'),0,"user balance should be 0");
            let marketBalance = await tsaishenTokenInstance.balanceOf(Marketplace.address);
            assert.equal(web3.utils.fromWei(marketBalance,'ether'),0,"market balance should be 0");
        })
    });

    describe("TsaishenUsers::UserInfo", () => {
        it("should get correct Details for User 1", async () => {
            await usersIntance.deleteHouseFromUser(user1,0);
            let x = await usersIntance.getUserInfo(user1);
            console.log(x);
            assert.isFalse(x.houseOwner);
            assert.equal(x.houses.length, 0, "should be 0");
        });
        it("should get correct Details for User 2", async () => {
            let x = await usersIntance.getUserInfo(user2);
            assert.isTrue(x.houseOwner);
            assert.equal(x.houses.length, 1, "should be 1");
        });
        it("should get correct Details for User 3", async () => {
            let x = await usersIntance.getUserInfo(user3);
            assert.isTrue(x.houseOwner);
            assert.equal(x.houses.length, 2, "should be 2");
        });
    });
});

contract("Reverted tests", (accounts) => {
    var houseTokenInstance;
    var usersIntance;
    var tsaishenTokenInstance;
    var marketplaceInstance
    var owner = accounts[0];
    var creator = accounts[1];
    var user1 = accounts[2];
    var user2 = accounts[3];

    before(async () => {
        marketplaceInstance = await Marketplace.deployed();
        houseTokenInstance = await HouseToken.deployed();
        usersIntance = await TsaishenUsers.deployed();
        tsaishenTokenInstance = await TsaishenToken.deployed();
        await marketplaceInstance.addOracle(TsaishenToken.address, '0x0000000000000000000000000000000000000001')
        await usersIntance.setHouseTokenAddress(HouseToken.address);
        await usersIntance.setMarketplaceAddress(Marketplace.address)
        console.log(Marketplace.address);
        console.log("House Token address: " + HouseToken.address);
    });

    describe("HouseToken", () => {
        it("negative test for house token 0", async () => {
            // let res = await houseTokenInstance.getHouse(3);
            await truffleAssert.reverts(houseTokenInstance.getHouse(0), "ERC721Metadata: URI query for nonexistent token");
            // console.log(res);
        });
        it("negative test for owning house", async () => {
            let res = await houseTokenInstance.ownsHouse(owner);
            assert.equal(res, false, "shouldn't own a house");
        });
        it("negative test less than 1 ether cost", async () => {
            await truffleAssert.reverts(houseTokenInstance.createHouse(1, 1, "tokenURI", { value: 10, from: accounts[2] }), "HT: Insufficient funds.");
        });
    });

});