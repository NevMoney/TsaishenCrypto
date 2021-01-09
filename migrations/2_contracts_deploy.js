// Import artifacts (JSON files)
const TsaishenUsers = artifacts.require("TsaishenUsers");
const HouseToken = artifacts.require("HouseToken");
const Marketplace = artifacts.require("Marketplace");
const TsaishenEscrow = artifacts.require("TsaishenEscrow");

module.exports = async function (deployer, network, accounts) {
    console.log("network used", network);
    console.log("account used", accounts);

    // DEPLOY CONTRACTS
    await deployer.deploy(TsaishenUsers);
    // once first one is deployed, second one goes taking first address + creator account
    await deployer.deploy(HouseToken, TsaishenUsers.address, accounts[1]);
    /* 
    once second one is deployed, third is fired off taking relevant contract(s) address(es)
    + feeRecipient (for local testing purposes I have account 1 -- CHANGE THIS for Test/MainNet)
    */
    //    await deployer.deploy(TsaishenEscrow, TsaishenUsers.address, accounts[1]); --> ESCROW is part of marketplace
    await deployer.deploy(Marketplace, TsaishenUsers.address, HouseToken.address, accounts[1]);
}
/*
    // Basic Tests
    const tsaishenUsersInstance = await TsaishenUsers.deployed();
    const houseTokenInstance = await HouseToken.deployed();
    const tsaishenEscrowInstance = await TsaishenEscrow.deployed();
    const marketplaceInstance = await Marketplace.deployed();

    await tsaishenUsersInstance.setMarketplaceAddress(marketplaceInstance.address);
    await tsaishenUsersInstance.setHouseTokenAddress(HouseToken.address);
    await tsaishenEscrowInstance.setMarketplaceAddress(marketplaceInstance.address);
    await tsaishenEscrowInstance.setBuyerAddress(accounts[3]);

    console.log("creating house");
    
    // because it's a payable function we have to use .methods before calling function
    // then .send() when using web3, like so:
    // await houseTokenInstance.methods.createHouse(1000, 10).send(1 ether);
    // in truffle you don't have to doo all that, but can/should specify from which account
    
    await houseTokenInstance.createHouse(1000, 10, {from: accounts[2], value:web3.utils.toWei("1")});

    // this is one way to access info, but the latter is better because we're accessing object
    // const houseInfo = await houseTokenInstance.getHouse(0);
    console.log("reading house info");
    const {value, income, uri} = await houseTokenInstance.getHouse(0);
    console.log("value", Number(value));
    console.log("income", Number(income));
    console.log("uri", uri);

    const ownsHouse = await houseTokenInstance.ownsHouse(accounts[2]);
    console.log("ownsHouse 2 should be TRUE", ownsHouse);

    const isUser = await tsaishenUsersInstance.isUser(accounts[2]);
    console.log("is user 2 should be TRUE", isUser);

    // test FAILED
    const ownsHouse2 = await houseTokenInstance.ownsHouse(accounts[5]);
    console.log("ownsHouse Should be false:", ownsHouse2);
    const isUser2 = await tsaishenUsersInstance.isUser(accounts[5]);
    console.log("isUser should be false:", isUser2);

    // tests PASSED
    const addUser = await tsaishenUsersInstance.addUser(accounts[5]);
    const isUser3 = await tsaishenUsersInstance.isUser(accounts[5]);
    console.log("isUser should be true:", isUser3);

    const deleteUser = await tsaishenUsersInstance.deleteUser(accounts[5]);
    const isUser4 = await tsaishenUsersInstance.isUser(accounts[5]);
    console.log("testing if user after deleting", isUser4);

    const getUserInfo = await tsaishenUsersInstance.getUserInfo(accounts[2]);
    console.log("user info for house owner", getUserInfo);

    const getUserHomes = await tsaishenUsersInstance.getUserHomes(accounts[2]);
    console.log("user homes", getUserHomes);

    const getAllUsers = await tsaishenUsersInstance.getAllUsers();
    console.log("all users:", getAllUsers);

    // testing Escrow - PASSED
    const deposit = await tsaishenEscrowInstance.deposit(accounts[2], accounts[3], {from: accounts[3], value:web3.utils.toWei("10")});
    const sellerDeposits = await tsaishenEscrowInstance.sellerDeposits(accounts[2]);
    const buyerDeposits = await tsaishenEscrowInstance.buyerDeposits(accounts[3]);
    console.log("seller deposit", Number(sellerDeposits));
    console.log("buyer deposit", Number(buyerDeposits));
    // const enableRefunds = await tsaishenEscrowInstance.enableRefunds();
    // const refundAllowed = await tsaishenEscrowInstance.refundAllowed();
    // console.log("refunds allowed should be TRUE ", refundAllowed);
    const close = await tsaishenEscrowInstance.close();
    const withdrawalAllowed = await tsaishenEscrowInstance.withdrawalAllowed();
    console.log("withdrawal allowed should be TRUE ", withdrawalAllowed);

    // don't think this is working!
    const beneficiaryWithdraw = await tsaishenEscrowInstance.beneficiaryWithdraw(accounts[2]);
    console.log("seller deposit", Number(sellerDeposits));

    // refund FAILED
    // const issueRefund = await tsaishenEscrowInstance.issueRefund(accounts[3]);
    // console.log("buyer deposit", Number(buyerDeposits));

    return;

    // could NOT test these errored out
    const sellHouse = await marketplaceInstance.sellHouse(10, 0, {from: accounts[2]});
    const getAllTokenOnSale = await marketplaceInstance.getAllTokenOnSale(0);
    console.log("house listed, tokens on sale ", getAllTokenOnSale);

    const buyHouse = await marketplaceInstance.buyHouse(0, {from: accounts[1], value:web3.utils.toWei("5")});
    const balanceOf = await houseTokenInstance.balanceOf(accounts[2]);
    const balanceOf2 = await houseTokenInstance.balanceOf(accounts[1]);
    console.log("check balances", balanceOf, balanceOf2);
};
*/