// Import artifacts (JSON files)
const TsaishenUsers = artifacts.require("TsaishenUsers");
const HouseToken = artifacts.require("HouseToken");
const Marketplace = artifacts.require("Marketplace");

module.exports = async function(deployer, network, accounts) {
    console.log("network used", network);
    console.log("account used", accounts);

    // Deploy Contracts
    await deployer.deploy(TsaishenUsers);
    await deployer.deploy(HouseToken, TsaishenUsers.address);
    await deployer.deploy(Marketplace, HouseToken.address);


    // Basic Tests
    const houseTokenInstance = await HouseToken.deployed();
    console.log("creating house");
    /*
    because it's a payable function we have to use .methods before calling function
    then .send() when using web3, like so:
    await houseTokenInstance.methods.createHouse(1000, 10).send(1 ether);
    in truffle you don't have to doo all that, but can/should specify from which account
    */ 
    await houseTokenInstance.createHouse(1000, 10, {from: accounts[1], value:web3.utils.toWei("1")});

    // this is one way to access info, but the latter is better because we're accessing object
    // const houseInfo = await houseTokenInstance.getHouse(0);
    console.log("reading house info");
    const {value, income, uri} = await houseTokenInstance.getHouse(0);
    console.log("value", Number(value));
    console.log("income", Number(income));
    console.log("uri", uri);

    const ownsHouse = await houseTokenInstance.ownsHouse(accounts[1]);
    console.log("ownsHouse", ownsHouse);
};
