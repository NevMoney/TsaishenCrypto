/* 
Created a localhost network for development. Linked the local host to 
the Rinkeby network to launch onto test net. Installed HDWallet 
*/


const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

const providerFactory = network =>
  new HDWalletProvider(
    process.env.PRIVATE_KEY,
    `https://${network}.infura.io/v3/${process.env.INFURA_KEY}`);

module.exports = {
  networks: {
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 7545,            // Standard Ethereum port (default: none)
     network_id: "5777",       // Any network (default: none)
    },

    rinkeby: {
      provider: () => providerFactory("rinkeby"),
      network_id: 4,
      gas: 6900000,
      gasPrice: 20e9 // 20 Gwei
    }
  },

  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.12",
     
    }
  }
}