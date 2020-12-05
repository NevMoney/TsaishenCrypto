// Import artifacts (JSON files)
const TsaishenUsers = artifacts.require("TsaishenUsers");
const HouseToken = artifacts.require("HouseToken");
const Marketplace = artifacts.require("Marketplace");

module.exports = async function(deployer, network, accounts) {
    console.log("network used", network);
    console.log("account used", accounts);

    // DEPLOY CONTRACTS
    await deployer.deploy(TsaishenUsers);
    // once first one is deployed, second one goes taking first address
    await deployer.deploy(HouseToken, TsaishenUsers.address);
    /* 
    once second one is deployed, third is fired off taking relevant contract(s) address(es)
    + feeRecipient (for local testing purposes I have account 1 -- CHANGE THIS for Test/MainNet)
    */
    await deployer.deploy(Marketplace, TsaishenUsers.address, HouseToken.address, accounts[1]);


    // Basic Tests
    const tsaishenUsersInstance = await TsaishenUsers.deployed();
    const houseTokenInstance = await HouseToken.deployed();
    const marketplaceInstance = await Marketplace.deployed();
    console.log("creating house");
    /*
    because it's a payable function we have to use .methods before calling function
    then .send() when using web3, like so:
    await houseTokenInstance.methods.createHouse(1000, 10).send(1 ether);
    in truffle you don't have to doo all that, but can/should specify from which account
    */ 
    await houseTokenInstance.createHouse(1000, 10, {from: accounts[2], value:web3.utils.toWei("1")});

    // this is one way to access info, but the latter is better because we're accessing object
    // const houseInfo = await houseTokenInstance.getHouse(0);
    console.log("reading house info");
    const {value, income, uri} = await houseTokenInstance.getHouse(0);
    console.log("value", Number(value));
    console.log("income", Number(income));
    console.log("uri", uri);

    const ownsHouse = await houseTokenInstance.ownsHouse(accounts[2]);
    console.log("ownsHouse 2", ownsHouse);

    const isUser = await tsaishenUsersInstance.isUser(accounts[2]);
    console.log("is user 2", isUser);

    // test FAILED
    const ownsHouse2 = await houseTokenInstance.ownsHouse(accounts[5]);
    console.log("ownsHouse Should be false:", ownsHouse);
    const isUser2 = await tsaishenUsersInstance.isUser(accounts[5]);
    console.log("isUser should be false:", isUser);

    // test PASSED
    const addUser = await tsaishenUsersInstance.addUser(accounts[5]);
    const isUser3 = await tsaishenUsersInstance.isUser(accounts[5]);
    console.log("isUser should be true:", isUser);

    // test FAILED - PASSED in Remix
    const deleteUser = await tsaishenUsersInstance.deleteUser(accounts[5]);
    const isUser4 = await tsaishenUsersInstance.isUser(accounts[5]);
    console.log("testing if user after deleting", isUser);

    const sellHouse = await marketplaceInstance.sellHouse(10, 0, {from: accounts[2]});
    console.log("house listed");

    const buyHouse = await marketplaceInstance.buyHouse(0, {from: accounts[1], value:web3.utils.toWei("12")});
    const balanceOf = await houseTokenInstance.balanceOf(accounts[2]);
    const balanceOf2 = await houseTokenInstance.balanceOf(accounts[1]);
    console.log("check balances", balanceOf, balanceOf2);
};
