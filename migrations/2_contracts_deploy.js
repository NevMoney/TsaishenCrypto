// Import artifacts (JSON files)
const TsaishenUsers = artifacts.require("TsaishenUsers");
const HouseToken = artifacts.require("HouseToken");
const Marketplace = artifacts.require("Marketplace");
// const TsaishenToken = artifacts.require("TsaishenToken");

module.exports = async function (deployer, network, accounts) {
    if (network === "development") return;
    
    console.log("network used", network);
    console.log("account used", accounts);

    await deployer.deploy(TsaishenUsers);
    await deployer.deploy(HouseToken, TsaishenUsers.address, accounts[0]);
    // feeRecipient (for local testing purposes I have account 0 -- CHANGE THIS for Test/MainNet)
    await deployer.deploy(Marketplace, TsaishenUsers.address, HouseToken.address, accounts[0]);
    // await deployer.deploy(TsaishenToken);
}