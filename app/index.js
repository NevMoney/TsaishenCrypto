//CAN"T MAKE IT WORK!!
//import BigNumber from './bignumber.min.js';
//const BigNumber = require('bignumber.js');

// NOT WORKING!!!
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
    $("#houseUploadedMsg").text("Congrats! You have just uploaded your house onto the blockchain. Give it a few minutes and then check Portfolio. Owner: "
      + owner + ", houseId: " + houseId + ", house on blockchain url: " + houseUri)
  })
    .on("error", console.error);
});

var value = $("#marketValue").val();
var income = $("#currentIncome").val();

// Have to pass the payable function - can't figure it out
async function uploadHouse(value, income) {
  let oneEther = 1 * 10 ** 18; //NOT WORKING
  let cost = new BigNumber(oneEther); //NOT WORKING
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
    x = await marketplaceInstance.methods.getOffier(id).call();
    var price = x.price;
    var seller = x.seller;
    var onSale = x.active;

    price = web.utils.fromWei(price, "ether");
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
  var amount = web3.utils.toWei(price, "ether"); //may need to change this for USDC
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

