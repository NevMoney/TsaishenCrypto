var houseTokenInstance;
var marketplaceInstance;
var usersInstance;

var tsaishenUsersAddress = "0xCdC09514C5FB30B5A5e8e9de58105Cd9c8a1f3d5";
var houseTokenAddress = "0x16CFE18965b32DBf482Cc27F134D2de42bFa43b7";
var marketplaceAddress = "0xe1E543342E59876577FBdB9E1a9e6a2abCdc466a";
const contractOwnerAddress = "0x22Ff2a94661193978D5425F977C024E7be930B82";
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
function renderCryptoHouse(id, url, isMarketplace, price, owner) {
  fetch(url).then(function (res) {
    res.json().then(function (data) {
      // console.log("JSON file: ", data);
      console.log("renderCryptoHouse", id, url, isMarketplace, price, owner);

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
                      <button class="btn btn-danger" id="cancelBtn${id}" onclick="cancelSale(${id})">Cancel Sale</button>
                      
                      <button class="btn btn-warning light-b-shadow" id="buyBtn${id}" onclick="selectToken(${id})" data-toggle="dropdown">Buy House: $${price}</button>
                        <div class="tokenPrices dropdown-menu dropdown-menu-md">
                          <h4>Currently accepting:</h4><br>                             
                          <h4 class="btn btn-dark-soft light-b-shadow" data-toggle="modal" data-target="#buyHouseModal" id="ethereumToken${id}"><img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880"> <span id="showEthPrice${id}"></span> ETH</h4>
                          <h4 class="btn btn-dark-soft light-b-shadow" data-toggle="modal" data-target="#buyHouseModal" id="daiToken${id}"><img src="https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png?1574218774"> <span id="showDaiPrice${id}"></span> DAI</h4>
                          <h4 class="btn btn-dark-soft light-b-shadow" data-toggle="modal" data-target="#buyHouseModal" id="usdcToken${id}"><img src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389"> <span id="showUsdcPrice${id}"></span> USDC</h4>
                        </div>
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
    // console.log("getInventory array: ", arrayId);
    for (i = 0; i < arrayId.length; i++){
      if (arrayId[i] != 0) {
        const offer = await checkOffer(arrayId[i]);
        // console.log("getInventory", offer, arrayId[i]);

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
  // console.log("appendHouse ID", id, "aH price", price, "aH seller", seller);
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

async function getRecentTokenPrice(id, price, token) {
  console.log("getRecentTokenPriceID", id, "recentTokenPrice", price, "tokenAdd", token);
  let oracleObject = await marketplaceInstance.methods.getOracleUsdPrice(token).call();
  let recentPrice, priceTime;
  [recentPrice, priceTime] = Object.values(oracleObject);
  let conversion = recentPrice / 100000000;
  let priceInCrypto = (price / conversion);
  // console.log("token price and time: ", priceInCrypto, priceTime);
  return priceInCrypto;
}

async function buyCryptoHouse(id, price, token) {
  const offer = await checkOffer(id);
  // console.log("buying House", offer);
  // console.log(id, offer.price);
  var amount = web3.utils.toWei(price.toString(), "");
  console.log("buy amount", amount);
  console.log("buy token address", token);
  try {
    await marketplaceInstance.methods.buyHouse(token, id).send({ from: user, value: amount });
  }
  catch (err) {
    console.log(err);
  }
}

async function selectToken(id) {
  let offer = await checkOffer(id);
 
  let ethOracle = await getRecentTokenPrice(id, offer.price, ethAddress);
  $(`#showEthPrice${id}`).empty();
  $(`#showEthPrice${id}`).append(ethOracle);
  // console.log("ethOracle", ethOracle);
  
  let daiOracle = await getRecentTokenPrice(id, offer.price, daiAddress);
  $(`#showDaiPrice${id}`).empty();
  $(`#showDaiPrice${id}`).append(daiOracle);
  // console.log("daiOracle", daiOracle);

  let usdcOracle = await getRecentTokenPrice(id, offer.price, usdcAddress);
  $(`#showUsdcPrice${id}`).empty();
  $(`#showUsdcPrice${id}`).append(usdcOracle);
  // console.log("usdcOracle", usdcOracle);

  let ethAmount = web3.utils.fromWei(ethOracle.toString());
  let daiAmount = web3.utils.fromWei(daiOracle.toString());
  let usdcAmount = web3.utils.fromWei(usdcOracle.toString());
  console.log("ethAmount", ethAmount, "daiAmount", daiAmount, "usdcAmount", usdcAmount);
  
  if ($(`#ethereumToken${id}`).click(function () {
    console.log("eth btn clicked");
    $(".displaySelectedCurrencyPrice").empty();
    $(".displaySelectedCurrencyPrice").append(ethOracle, " ETH");
    selectHouseToBuy(id, ethAmount, ethAddress);
  }));
  if ($(`#daiToken${id}`).click(function () {
    console.log("dai btn clicked");
    $(".displaySelectedCurrencyPrice").empty();
    $(".displaySelectedCurrencyPrice").append(daiOracle, " DAI");
    selectHouseToBuy(id, daiAmount, daiAddress);
  }));
  if ($(`#usdcToken${id}`).click(function () {
    console.log("usdcs btn clicked");
    $(".displaySelectedCurrencyPrice").empty();
    $(".displaySelectedCurrencyPrice").append(usdcOracle, " USDC");
    selectHouseToBuy(id, usdcAmount, usdcAddress);
  }));
}

async function displayPurchase(id, price, token) {
  house = await houseTokenInstance.methods.getHouse(id).call();
  console.log("displayPurchase", house.uri);
  fetch(house.uri).then(function (res) {
    res.json().then(function (data) {
      imageUrl = data.image;
      value = new Intl.NumberFormat().format(data.attributes[8].value);
      income = new Intl.NumberFormat().format(data.attributes[9].value);
      $("#buyModalDisplay").empty();
      $(".finalizingPurchaseDisplay").append(
        `<tr>
          <td><img width=350px src=${imageUrl}><br>
          <strong>Property Value:</strong> $${value}<br>
          <strong>Monthly Income:</strong> $${income}</td>
        </tr>`
      );
    });
  });
}

async function ownerInitializeContracts() {
  await usersInstance.methods.setMarketplaceAddress(marketplaceAddress).send();
  await usersInstance.methods.setHouseTokenAddress(houseTokenAddress).send();
  console.log("Marketplace: ", marketplaceAddress);
  console.log("HouseToken: ", houseTokenAddress);
}

// async function deedConfirm(id){}

// async function checkDeposit(id){}

// async function escrowUpdate(id){}

// async function checkRefund(id){}

// async function checkPayout(id){}

// async function houseEscrowInfo(id){}