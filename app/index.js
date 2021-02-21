var houseTokenInstance;
var marketplaceInstance;
var usersInstance;

var tsaishenUsersAddress = "0x3d7b49d7EB3C0B27835b697c480a369B93E5f20D";
var houseTokenAddress = "0x189a4b473D0EE0d1A3bF40904F9E0c6908a63587";
var marketplaceAddress = "0xaf31b1dce7Ce247e2533404B873Bd53124C61930";
const contractOwnerAddress = "0x5C060154bB1BC8E37dE8d75828a80C29F739f8d2";
const creatorAddress = "0xb0F6d897C9FEa7aDaF2b231bFbB882cfbf831D95";
// approved token addresses
const ethAddress = "0x0000000000000000000000000000000000000000";
const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

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
  ethereum.on("accountsChanged", (_accounts) => {
    showAccount.innerHTML = _accounts;
    user = web3.utils.toChecksumAddress(_accounts[0]);
  });
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

  // console.log("users ", usersInstance);
  // console.log("house ", houseTokenInstance);
  // console.log("marketplace ", marketplaceInstance);

  await usersInstance.methods.setMarketplaceAddress(marketplaceAddress).send();
  await usersInstance.methods.setHouseTokenAddress(houseTokenAddress).send();
  console.log("Marketplace: ", marketplaceAddress);
  console.log("HouseToken: ", houseTokenAddress);

  // we'll put events here for notifications
  houseTokenInstance.events.Minted().on("data", function (event) {
    let owner = event.returnValues._owner;
    let houseId = event.returnValues.id;
    let houseUri = event.returnValues.uri;
    $("#houseUploadedMsg").css("display", "block");
    $("#houseUploadedMsg").text("Congratulations! You have successfully uploaded your real property onto the blockchain. The registered owner wallet address is "
      + owner + " and your house token ID is " + houseId + " house URI: " + houseUri);
  })
    .on("error", console.error);
  
  marketplaceInstance.events.MarketTransaction().on("data", (event) => {
    var eventType = event.returnValues["TxType"].toString();
    var tokenId = event.returnValues["tokenId"];
    var actor = event.returnValues["actor"];
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
    $("#newUserMsg").css("display", "block");
    $("#newUserMsg").text("Welcome to Tsaishen Crypto House! You are registered with account: " + user +
    ". Head on over to Portfolio page to view details.");
  })
    .on("error", console.error);
});

function appendCryptoHouse(id, url, isMarketplace, price, seller) {
  // getHouses();
  renderCryptoHouse(id, url, isMarketplace, price, seller)
  // houseButtons(id, url, isMarketplace, price, seller);
}

// get array of houses and house info by user
async function getHouses() {
  var arrayId;
  var house;

  try {
    // first get array of all user homes
    arrayId = await usersInstance.methods.getUserHomes(user).call();
    // console.log("ID array ", arrayId);
    for (i = 0; i < arrayId.length; i++){
      house = await houseTokenInstance.methods.getHouse(arrayId[i]).call();
      
      let id = arrayId[i];
      // console.log("id", id);
      // console.log("house info ", house);
      let url = house.uri;
      // console.log(url);
      
      // renderCryptoHouse(id, url);
      appendCryptoHouse(id, url);
      // getInventory(id, url);
    }
  }
  catch (err) {
    console.log(err);
  }
}

// get data from JSON and render display
function renderCryptoHouse(id, url, isMarketplace, price, owner, token) {
  fetch(url).then(function (res) {
    res.json().then(function (data) {
      console.log("JSON file: ", data);
      console.log("buttonLogic", id, url, isMarketplace, price, owner, token);

      // $("#loading").hide();
      
      address = data.attributes[0].value;
      county = data.attributes[1].value;
      beds = new Intl.NumberFormat().format(data.attributes[2].value);
      baths = new Intl.NumberFormat().format(data.attributes[3].value);
      year = data.attributes[4].value;
      house = data.attributes[5].value;
      size = data.attributes[6].value;
      parcel = data.attributes[7].value;
      value = new Intl.NumberFormat().format(data.attributes[8].value);
      income = new Intl.NumberFormat().format(data.attributes[9].value);
      type = data.attributes[10].value;
      link = data.attributes[11].value;
      video = data.attributes[12].value;
      fileName = data.name;
      imageUrl = data.image;
      localLink = data.external_url;
      description = data.description;
      // console.log("pic:", imageUrl, "about:", description, "address:", address, "county:", county, "beds:", beds,
      //   "bath:", baths, "year built:", year, "house sqft:", house, "lot size:", size,
      //   "parcel no:", parcel, "current value:", value, "current income:", income,
      //   "property type:", type, "more info:", link, "video tour:", video);           

      var button = `<div class="row">
                      
                        <button class="btn btn-success" id="selectSaleBtn${id}" onclick="selectHouseForSale(${id})" data-toggle="modal" data-target="#sellHouseModal">Sell</button>
                      
                        <button class="btn btn-warning light-b-shadow" id="buyBtn${id}" onclick="selectToken(${id})" data-toggle="dropdown">Buy House: $${price}</button>
                          <div class="tokenPrices dropdown-menu dropdown-menu-md">                             
                            <h4 class="btn btn-dark-soft light-b-shadow onclick="selectHouseToBuy(${id, price})" id="ethereumToken${id}"><img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880"> <span id="showEthPrice${id}"></span> ETH</h4>
                            <h4 class="btn btn-dark-soft light-b-shadow onclick="selectHouseToBuy(${id, price})" id="daiToken${id}"><img src="https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png?1574218774"> <span id="showDaiPrice${id}"></span> DAI</h4>
                            <h4 class="btn btn-dark-soft light-b-shadow onclick="selectHouseToBuy(${id, price})" id="usdcToken${id}"><img src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389"> <span id="showUsdcPrice${id}"></span> USDC</h4>
                          </div>
                        <button class="btn btn-warning light-b-shadow" id="buyEscrowBtn${id}" onclick="selectHouseToBuyWEscrow(${id})">Buy with Escrow: $${price}</button>
                        <button class="btn btn-danger" id="cancelBtn${id}" onclick="cancelSale(${id})">Cancel Sale</button>
                      
                  </div>`
      // NOT WORKING
      $(".tokenPrices").empty();

      $(".portfolioDisplay").append(
        `<tr>
          <td><img width=250px src=${imageUrl}>
            <br><br>${button}</td>
          <td>${description}</td>
          <td><strong>Address:</strong> ${address}
            <br><strong>Beds:</strong> ${beds}
            <br><strong>Baths:</strong> ${baths}
            <br><strong>Year Built:</strong> ${year}</td>
          <td><strong>House Size:</strong> ${house}
            <br><strong>Lot Size:</strong> ${size}
            <br><strong>Parcel:</strong> ${parcel}
            <br><strong>Type:</strong> ${type}
            <br><strong>County:</strong> ${county}</td>
          <td><strong>Value:</strong> $${value}
            <br><strong>Monthly Income:</strong> $${income}</td>
          <td><strong>Public Link:</strong> <a href=${link} target="_blank" rel="noopener noreferrer">${link}</a>
            <br><strong>Video:</strong> <a href=${video} target="_blank" rel="noopener noreferrer">${video}</a></td>
        </tr>
        `
      )
      // // if property is in marketplace -- THIS WORKS
      // if (isMarketplace) {
      //   $(`#selectSaleBtn${id}`).hide();
      //   if (seller === user) {
      //     $(`#buyBtn${id}`).hide();
      //     $(`#buyEscrowBtn${id}`).hide();
      //   } else {
      //     $(`#cancelBtn${id}`).hide();
      //   }
      // }

      if (!isMarketplace) {
        $("#houseDisplay").append(button);
        $(`#buyBtn${id}`).hide();
        $(`#buyEscrowBtn${id}`).hide();
        $(`#cancelBtn${id}`).show();
        $(`#selectSaleBtn${id}`).show();
      }
      else {
          $("#houseSale").append(button);
          $(`#selectSaleBtn${id}`).hide();
    
          if (owner === user) {
              $(`#buyBtn${id}`).hide();
              $(`#buyEscrowBtn${id}`).hide();
              $(`#cancelBtn${id}`).show();
          }
          else {
              $(`#buyBtn${id}`).show();
              $(`#buyEscrowBtn${id}`).show();
              $(`#cancelBtn${id}`).hide();
          }
      }
    });
  });
}

async function checkOffer(id) {
  try {
    let x = await marketplaceInstance.methods.getOffer(id).call();
    var price = x.price;
    var seller = x.seller;
    var onSale = x.active;

    price = web3.utils.fromWei(price);
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

        if (offer.onSale) {
          appendHouse(arrayId[i], offer.price, offer.seller);
        }
        
      }
    }
  }
  catch (err) {
    console.log(err);
  }
}

async function appendHouse(id, price, seller) {
  console.log("appendHouse ID", id, "aH price", price, "aH seller", seller);
  var house = await houseTokenInstance.methods.getHouse(id).call();
  appendCryptoHouse(id, house.uri, true, price, seller);
}

async function sellCryptoHouse(id) {
  const offer = await checkOffer(id);
  if (offer.onSale) return alert("This house is already listed for sale.");

  var price = $("#housePrice").val();
  var amount = web3.utils.toWei(price);
  const isApproved = await houseTokenInstance.methods.isApprovedForAll(user, marketplaceAddress).call();
  //console.log(isApproved);
  try {
    if (!isApproved) {
      await houseTokenInstance.methods
        .setApprovalForAll(marketplaceAddress, true)
        .send({ from: user }).on("receipt", function (receipt) {
      console.log("operator approval: ", receipt);
      });
    }
    await marketplaceInstance.methods.sellHouse(amount, id).send({ from: user });
    goToInventory();
  }
  catch (err) {
    console.log(err)
  }
}

async function removeOffer(id) {
  const offer = await checkOffer(id);
  if (!offer.onSale) return alert("Nothing to cancel. This house is not listed.");
  await marketplaceInstance.methods.removeOffer(id).send({ from: user });
  goToInventory();
}

// JS function from Chainlink to get oracle prices
// const web3 = new Web3("https://kovan.infura.io/v3/<infura_project_id>");
// const aggregatorV3InterfaceABI = [
//   {
//     "inputs": [
    
//     ], "name": "decimals",
//     "outputs":
//       [
//       {
//         "internalType": "uint8",
//         "name": "",
//         "type": "uint8"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs":
//       [
    
//     ],
//     "name": "description",
//     "outputs":
//       [
//         {
//           "internalType": "string",
//           "name": "",
//           "type": "string"
//         }
//       ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs":
//       [
//         {
//           "internalType": "uint80",
//           "name": "_roundId",
//           "type": "uint80"
//         }
//       ],
//     "name": "getRoundData",
//     "outputs":
//       [
//         {
//           "internalType": "uint80",
//           "name": "roundId",
//           "type": "uint80"
//         },
//         {
//           "internalType": "int256",
//           "name": "answer",
//           "type": "int256"
//         },
//         {
//           "internalType": "uint256",
//           "name": "startedAt",
//           "type": "uint256"
//         },
//         {
//           "internalType": "uint256",
//           "name": "updatedAt",
//           "type": "uint256"
//         },
//         {
//           "internalType": "uint80",
//           "name": "answeredInRound",
//           "type": "uint80"
//         }
//       ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs":
//       [

//       ],
//     "name": "latestRoundData",
//     "outputs":
//       [
//         {
//           "internalType": "uint80",
//           "name": "roundId",
//           "type": "uint80"
//         },
//         {
//           "internalType": "int256",
//           "name": "answer",
//           "type": "int256"
//         },
//         {
//           "internalType": "uint256",
//           "name": "startedAt",
//           "type": "uint256"
//         },
//         {
//           "internalType": "uint256",
//           "name": "updatedAt",
//           "type": "uint256"
//         },
//         {
//           "internalType": "uint80",
//           "name": "answeredInRound",
//           "type": "uint80"
//         }
//       ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs":[

//       ],
//     "name": "version",
//     "outputs":
//       [
//         {
//           "internalType": "uint256",
//           "name": "",
//           "type": "uint256"
//         }
//       ],
//     "stateMutability": "view",
//     "type": "function"
//   }
// ];
// const addr = "0x9326BFA02ADD2366b30bacB125260Af641031331";
// const priceFeed = new web3.eth.Contract(aggregatorV3InterfaceABI, addr);
// priceFeed.methods.latestRoundData().call()
//     .then((roundData) => {
//         // Do something with roundData
//         console.log("Latest Round Data", roundData)
//     });


async function ethPrice(price) {
  // get ETH pricing from oracles - returns object
  let oracleObject = await marketplaceInstance.methods.getOracleUsdPrice(ethAddress).call();
  // console.log(Object.values(oracleObject));
  let ETHprice, priceTime;
  // convert to array and assign variables
  [ETHprice, priceTime] = Object.values(oracleObject);
  // // console.log(ETHprice); // LATEST TEST PRICE FROM CHAINLINK 191068577326 //testing on feb 20 @6:41 PM
  // // let conversion = 191068577326 / 100000000;//returned 7.85058 ETH which is correct
  let conversion = ETHprice / 100000000;
  let priceInEth = (price / conversion);
  console.log(priceInEth, priceTime);
  return priceInEth;
  // return oracleObject;
}

async function usdcPrice(price) {
  let oracleObject = await marketplaceInstance.methods.getOracleUsdPrice(usdcAddress).call();
  let USDCprice, priceTime;
  [USDCprice, priceTime] = Object.values(oracleObject);
  let conversion = USDCprice / 100000000;
  let priceInUsdc = (price / conversion);
  console.log(priceInUsdc, priceTime);
  return priceInUsdc;
}

async function daiPrice(price) {
  let oracleObject = await marketplaceInstance.methods.getOracleUsdPrice(daiAddress).call();
  let DAIprice, priceTime;
  [DAIprice, priceTime] = Object.values(oracleObject);
  let conversion = DAIprice / 100000000;
  let priceInDai = (price / conversion);
  console.log(priceInDai, priceTime);
  return priceInDai;
}

// instead of running specific function for each token, here's one to do it all
async function getRecentTokenPrice(price, token) {
  console.log("tokenAdd", token);
  let oracleObject = await marketplaceInstance.methods.getOracleUsdPrice(token).call();
  let recentPrice, priceTime;
  [recentPrice, priceTime] = Object.values(oracleObject);
  let conversion = recentPrice / 100000000;
  let priceInCrypto = (price / conversion);
  console.log(priceInCrypto, priceTime);
  return priceInCrypto;
}

async function selectHouseToBuy(id, price, token) {
  const offer = await checkOffer(id);
  // console.log("buying House", offer);
  // console.log(id, offer.price);
  // var ethOracle = await marketplaceInstance.methods.getOracleUsdPrice(ethAddress).call();
  // console.log("buying house eth", ethOracle);
  // [ETHprice, priceTime] = Object.values(ethOracle);
  // let conversion = ETHprice / 100000000;
  // // let conversion = (191068577326 / 100000000);
  // let priceInEth = (offer.price / conversion).toString();
  // console.log("priceInEth", priceInEth);
  // console.log("price", offer.price);
  var amount = web3.utils.toWei(price);
  console.log("amount", amount);
  console.log("token", token);
  // try {
  //   // MM throws error on this function - changed from amount to amount.toString and added gas and priceInWei -->
  //   // error didn't show when MM fired up but ultimately tx failed with the same error: RuntimeError code 32603
  //   await marketplaceInstance.methods.buyHouse(ethAddress, id).send({ from: user, value: amount });
  // }
  // catch (err) {
  //   console.log(err);
  // }
}

async function selectToken(id) {
  let offer = await checkOffer(id);
 
  let ethOracle = await getRecentTokenPrice(offer.price, ethAddress);
  $(`#showEthPrice${id}`).append(ethOracle);
  
  let daiOracle = await getRecentTokenPrice(offer.price, daiAddress);
  $(`#showDaiPrice${id}`).append(daiOracle);

  let usdcOracle = await getRecentTokenPrice(offer.price, usdcAddress);
  $(`#showUsdcPrice${id}`).append(usdcOracle);
  
    if ($("#ethereumToken").click(function () {
      return ethAddress;
    }));
    else if ($("#daiToken").click(function () {
      return daiAddress;
    }));
    else if ($("#usdcToken").click(function () {
      return usdcAddress;
    }));
}

async function buyHome (id, price) {
  await checkOffer(id);
  var amount = web3.utils.toWei(price, "ether");
  var buy = await marketplaceInstance.methods.buyHouse(id).send({ value: amount });
  var escrowBuy = await marketplaceInstance.methods
    .buyHouseWithEscrow(id)
    .send({ value: amount });

  try {
    if ($("#buyBtn").on("click", function () {
      buy;
    }));
    else if ($("#buyEscrowBtn").on("click", function () {
      escrowBuy;
    }));
  }
  catch (err) {
    console.log(err);
  }
}

// async function deedConfirm(id){}

// async function checkDeposit(id){}

// async function escrowUpdate(id){}

// async function checkRefund(id){}

// async function checkPayout(id){}

// async function houseEscrowInfo(id){}