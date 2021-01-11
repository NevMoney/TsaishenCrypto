//CAN"T MAKE IT WORK!!
//import BigNumber from './bignumber.min.js';
//const BigNumber = require('bignumber.js');

// import { createRequire } from "module"
// const require = createRequire(import.meta.url);
// const BigNumber = require("bignumber.js");


var houseTokenInstance;
var marketplaceInstance;
var usersInstance;

var tsaishenUsersAddress = "0x7F25b0104c864118B2f5B12c390756DF4F9d8b0F";
var houseTokenAddress = "0x4330ca56Ee9a7675EFcAaD82932B4cd15A6d7976";
var marketplaceAddress = "0xc333468B5b6dEb333cd9d6E66655E454A813eAf9";
const creatorAddress = "0xb0F6d897C9FEa7aDaF2b231bFbB882cfbf831D95";

const ethereumButton = document.querySelector('.enableEthereumButton');
const showAccount = document.querySelector('.showAccount');

// CLicking Enable Web3 button loads account or shows modal to get MetaMask  
  ethereumButton.addEventListener("click", () => {
    if (typeof window.web3 !== "undefined") {
      ethereum.request({ method: "eth_requestAccounts" });
      getAccount();
    }
    else {
      $("#metamaskModal").modal("toggle");
  }
});

// loads account onto the page
async function getAccount() {
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  const account = accounts[0];
  showAccount.innerHTML = account;
}

//Executed when page finish loading
$(document).ready(async () => {
  // this allows the website to use the metamask account
  const accounts = await ethereum.enable();

  web3 = new Web3(ethereum);

  toWei = (amount) => web3.utils.toWei(String(amount));
  fromWei = (amount) => Number(web3.utils.fromWei(amount)).toFixed(4);

  getAccount();

  ethereum.on("accountsChanged", (_accounts) => {
    console.log("Account Changed!", accounts[0]);
    user = web3.utils.toChecksumAddress(_accounts[0]);
  });

  // User will be the first item in the accounts array
  user = web3.utils.toChecksumAddress(accounts[0]);

  usersInstance = await new web3.eth.Contract(abi.TsaishenUsers, tsaishenUsersAddress, { from: user });
  houseTokenInstance = await new web3.eth.Contract(abi.HouseToken, houseTokenAddress, { from: creatorAddress });
  marketplaceInstance = await new web3.eth.Contract(abi.Marketplace, marketplaceAddress, { from: address[1] });

  console.log("users ", usersInstance);
  console.log("house ", houseTokenInstance);
  console.log("marketplace ", marketplaceInstance);

  // we'll put events here for notifications
  houseTokenInstance.events.Minted().on("data", function (event) {
    let owner = event.returnValues.owner;
    let houseId = event.returnValues.tokenId;
    let houseUri = event.returnValues.houseTokenURI;
    $("#houseUploadedMsg").css("display", "block");
    $("#houseUploadedMsg").text("Congrats! You have just uploaded your house onto the blockchain. Owner: "
      + owner + ", houseId: " + houseId + ", house on blockchain url: " + houseUri)
  })
    .on("error", console.error);
  
  marketplaceInstance.events.MarketTransaction().on("data", (event) => {
    var eventType = event.returnValues["TxType"].toString();
    var tokenId = event.returnValues["tokenId"];
    if (eventType == "House listed") {
      alert("Congrats! You have listed the following property for sale: " + tokenId);
    }
    if (eventType == "Offer removed") {
      alert("The following property has been removed from the market: " + tokenId);
    }
    if (eventType == "House purchased") {
      alert("Congrats on your purchase. You have acquired the following property: " + tokenId);
    }
    if (eventType == "House in Escrow") {
      alert("Congratulations! You are in escrow for " + tokenId);
    }
    if (eventType == "Escrow Refunded") {
      alert("Sale wasn't successful. Escrow has been refunded for " + tokenId); //CONSIDER putting this in a DIV for the house
    }
    if (eventType == "House SOLD") {
      alert("Congratulations! Escrow has successfully closed and the following property is sold: " + tokenId);
    }
  })
    .on("error", console.error);
  
  usersInstance.events.userAdded().on("data", (event) => {
    alert("Welcome to Tsaishen Crypto! You are registered with account " + user);
  });
  
});

var value = $("#marketValue").val();
var income = $("#currentIncome").val();
// let cost = new BigNumber(1);

/*
**************************************
Have to pass the payable function - can't figure it out
**************************************
*/ 
async function uploadHouse(value, income) {
  // let oneEther = 1 * 10 ** 18; //NOT WORKING
  // let cost = new BigNumber(oneEther); //NOT WORKING

  // ERROR: pass number as strings or BigNumber objects
  var amount = web3.utils.toWei(cost, "ether");
  await houseTokenInstance.methods.createHouse(value, income).send({value: amount}, function (txHash) {
    try {
      console.log("uploadHouse: ", txHash);
    }
    catch (err) {
      console.log(err)
    }
  });
}

async function getUserHomes() {
  var arrayId;
  var house;

  try {
    arrayId = await usersInstance.methods.getUserHomes(user).call();
    for (i = 0; i < arrayId.length; i++){
      house = await houseTokenInstance.methods.getHouse(arrayId[i]).call();
      appendCrypotoHouse(arrayId[i], house.uri, false);
    }
  }
  catch (err) {
    console.log(err);
  }
}

async function checkOffer(id) {
  let x;

  try {
    x = await marketplaceInstance.methods.getOffer(id).call();
    var price = x.price;
    var seller = x.seller;
    var onSale = x.active;

    price = web.utils.fromWei(price);
    var offer = { seller: seller, price: price, onSale: onSale };
    return offer;
  }
  catch (err) {
    console.log(err)
  }
}

async function getInventory() {
  try {
    var arrayId = await marketplaceInstance.methods.getAllTokensOnSale().call();
    console.log("getInventory array: ", arrayId);
    for (i = 0; i < arrayId.length; i++){
      if (arrayId[i] != 0) {
        const offer = await checkOffer(arrayId[i]);
        console.log("getInventory", offer, arrayId[i]);

        if (offer.onSale) appendHouse(arrayId[i], offer.price, offer.seller);
      }
    }
  }
  catch (err) {
    console.log(err);
  }
}

async function appendHouse(id, price, seller) {
  var house = await houseTokenInstance.methods.getHouse(id).call();
  appendCryptoHouse(house[0], id, house.uri, true, price, seller);
}

async function sellHouse(id) {
  const offer = await checkOffer(id);

  if (offer.onSale) return alert("House is already listed for sale.");

  var price = $("#housePrice").val();
  var amount = web3.utils.toWei(price);
  const isApproved = await houseTokenInstance.methods.isApprovedForAll(user, marketplaceAddress).call();
  try {
    if (!isApproved) {
      await houseTokenInstance.methods.setApprovalForAll(marketplaceAddress, true).send().on("receipt", function (receipt) {
        console.log("operator approval: ", receipt);
      });
    }
    await marketplaceInstance.methods.setOffer(amount, id).send();
    goToInventory();
  }
  catch (err) {
    console.log(err)
  }
}

async function removeOffer() {
  await marketplaceInstance.methods.removeOffer(id).send();
  goToInventory();
}

async function buyHomeInETH (id, price) {
  await checkOffer(id);
  var amount = web3.utils.toWei(price, "ether");
  var ethBuy = await marketplaceInstance.methods.buyHouseWithETH(id).send({ value: amount });
  var escrowBuy = await marketplaceInstance.methods.buyHouseWithEscrowEth(id).send({ value: amount });

  try {
    if ($("#buyWithETH").on("click", function () {
      ethBuy;
    }));
    else if ($("#buyWithETHEscrow").on("click", function () {
      escrowBuy;
    }));
  }
  catch (err) {
    console.log(err);
  }
}

async function buyHomeInUDSC() {
  await checkOffer(id);
  var amount = web3.utils.toWei(price, "USDC");
  var buy = await marketplaceInstance.methods.buyWithUSDC(id).send({ value: amount });
  var escrowBuy = await marketplaceInstance.methods.escrowBuyUsdc(id).send({ value: amount });

  try {
    if ($("#buyWithUSDC").on("click", function () {
      buy;
    }));
    else if ($("#buyWithUSDCEscrow").on("click", function () {
      escrowBuy;
    }));
  }
  catch (err) {
    console.log(err);
  }
}

// add escrow transactions functionality

// async function deedConfirm(id){}

// async function checkDeposit(id){}

// async function escrowUpdate(id){}

// async function checkRefund(id){}

// async function checkPayout(id){}

// async function houseEscrowInfo(id){}