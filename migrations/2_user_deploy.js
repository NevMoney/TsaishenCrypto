const Migrations = artifacts.require("TsaishenUsers");

module.exports = async function(deployer, network, accounts) {
    console.log("network used", network);
    console.log("account used", accounts);
  deployer.deploy(TsaishenUsers);
};
