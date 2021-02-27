var houseTokenInstance;
var marketplaceInstance;
var usersInstance;

var tsaishenUsersAddress = "0x99A5982a4c909278D8ac732a529A25A0aE720295";
var houseTokenAddress = "0x6141445A12320813aa6630668C4E60843D45cc1f";
var marketplaceAddress = "0xCCBb40C757C787ea34F5A4B76a2E9c4754798450";
const contractOwnerAddress = "0x469f60E90F4D6038Eb9818deBa999b63192bA233";
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
  const accounts = await ethereum.enable();
  web3 = new Web3(ethereum);
  toWei = (amount) => web3.utils.toWei(String(amount));
  fromWei = (amount) => Number(web3.utils.fromWei(amount)).toFixed(4);

  getAccount();

  ethereum.on("accountsChanged", (_accounts) => {
    console.log("Account Changed!", accounts[0]);
    user = web3.utils.toChecksumAddress(_accounts[0]);
  });

  user = web3.utils.toChecksumAddress(accounts[0]);

  usersInstance = await new web3.eth.Contract(abi.TsaishenUsers, tsaishenUsersAddress, { from: user });
  houseTokenInstance = await new web3.eth.Contract(abi.HouseToken, houseTokenAddress, { from: user });
  marketplaceInstance = await new web3.eth.Contract(abi.Marketplace, marketplaceAddress, { from: user });
  // console.log("users ", usersInstance, "house ", houseTokenInstance, "marketplace ", marketplaceInstance);

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

async function escrowBuy(id, price, token) {
  const offer = await checkOffer(id);
  var amount = web3.utils.toWei(price.toString(), "");
  console.log("buy amount", amount);
  console.log("buy token address", token);
  try {
    await marketplaceInstance.methods.buyHouseWithEscrow(token, id).send({ from: user, value: amount });
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
  await usersInstance.methods.setHouseTokenAddress(houseTokenAddress).send(); 
  await usersInstance.methods.setMarketplaceAddress(marketplaceAddress).send();
  console.log("Marketplace: ", marketplaceAddress);
  console.log("HouseToken: ", houseTokenAddress);
}

async function getAllTsaishenUsers() {
  let userList = await usersInstance.methods.getAllUsers().call();
  console.log("user array", userList); 

  for (i = 0; i < userList.length; i++) {
    let list = userList[i].toString();
    list = list.substr(26);
    let begin = "0x";
    let tUserAdd = begin.concat(list);
    // console.log("user address" + i + ":", tUserAdd);

    let tsaishenUserInfo = await usersInstance.methods.getUserInfo(tUserAdd).call();

    let userAddress = userList[i];
    let owner = tsaishenUserInfo.houseOwner;
    let borrowed = tsaishenUserInfo.borrower;
    let lended = tsaishenUserInfo.lender;
    let rewarded = tsaishenUserInfo.reward;
    let properties = tsaishenUserInfo.houses;

    displayTsaishenUsers(userAddress, owner, borrowed, lended, rewarded, properties);
  }
}

async function displayTsaishenUsers(userAddress, owner, borrowed, lended, rewarded, properties) {
  userAddress = userAddress.substr(26);
  let start = "0x";
  let address = start.concat(userAddress);
  console.log("address", address);
  console.log("properties", properties);
  
  $("#userDisplayTable").append(
      `<table class="table table-responsive">
        <thead class="thead-dark">
          <th scope="col">Address</th>
          <th scope="col">Owner?</th>
          <th scope="col">Borrower?</th>
          <th scope="col">Lender?</th>
          <th scope="col">Reward?</th>
          <th scope="col">Properties</th>
        </thead>
        <tbody>
          <tr>
            <td>${address}</td>
            <td>${owner}</td>
            <td>${borrowed}</td>
            <td>${lended}</td>
            <td>${rewarded}</td>
            <td class="btn" onclick="displayPurchase(${properties})" data-toggle="modal" data-target="#buyHouseModal">${properties}</td>
          </tr>
        </tbody>
      </table>`
  );
}

// contract owner -- ALL escrows
async function getEscrowInfo() {
  let userList = await usersInstance.methods.getAllUsers().call();

  for (i = 0; i < userList.length; i++) {
    let list = userList[i].toString();
    list = list.substr(26);
    let begin = "0x";
    let tUserAdd = begin.concat(list);
    let tsaishenUserInfo = await usersInstance.methods.getUserInfo(tUserAdd).call();
    console.log("users object" + i +":", tsaishenUserInfo);
    let homeArray = tsaishenUserInfo.houses;
    console.log("homes array" + i +":", homeArray);
    for (n = 0; n < homeArray.length; n++){
      let homes = homeArray[n].toString();
      homes = homes.substr(26);
      console.log("homes" + n +":", homes);
      // let id = web3.utils.fromWei(homes[n].toString());
      // console.log("ID:", id);
      let escrow = await marketplaceInstance.methods.escrowInfo(homes).call();
      console.log("escrow Array" + n +":", escrow);
      console.log("seller", escrow.seller, "buyer", escrow.buyer, "state", escrow.state, "amount", escrow.amount, "timelock", escrow.timelock);
    
      displayEscrows(homes, escrow.seller, escrow.buyer, escrow.state, escrow.amount, escrow.timelock);
    }
  }
}

async function displayEscrows(houseId, seller, buyer, state, amount, timelock) {
  if (amount > 0) {
    $("#escrowDisplayTable").append(
      `<table class="table table-responsive">
        <thead class="thead-dark">
        <th scope="col">House ID</th>
          <th scope="col">Seller</th>
          <th scope="col">Buyer</th>
          <th scope="col">State</th>
          <th scope="col">Amount</th>
          <th scope="col">Timelock</th>
        </thead>
        <tbody>
          <tr>
            <td>${houseId}</td>
            <td>${seller}</td>
            <td>${buyer}</td>
            <td>${state}</td>
            <td>${amount}</td>
            <td>${timelock}</td>
          </tr>
        </tbody>
      </table>`
  );
  } else {
    $("#escrowDisplayTable").css("display", "block");
    $("#escrowDisplayTable").text("No houses in escrow.");
  }
  
}

// for individual deal
async function houseEscrowInfo(id) {
  let houseEscrow = await marketplaceInstance.methods.escrowInfo(id).call();
  console.log(houseEscrow);

  showEscrowInfo(houseEscrow.seller, houseEscrow.buyer, houseEscrow.state, houseEscrow.amount, houseEscrow.timelock);
}

function showEscrowInfo(seller, buyer, state, amount, time) {
  let checkRefund = await marketplaceInstance.methods.refundAllowed(id).call();
  let checkWithdrawal = await marketplaceInstance.methods.withdrawalAllowed(id).call();
  let escrowDate = new Date(time * 1000).toUTCString();
  $("#escrowInfoDisplay").append(
    `<table class="table">
      <tbody>
        <tr>
          <td>Seller: ${seller}</td>
        </tr>
        <tr>
          <td>Buyer: ${buyer}</td>
        </tr>
        <tr>
          <td>Escrow Amount: ${amount}</td>  
          <td>Escrow State: ${state}</td>
          <td>Escrow State Ending: ${escrowDate}</td>
        </tr>
        <tr>
          <td>Can I request refund right now? ${checkRefund}</td>
          <td>Can I withdraw funds right now? ${checkWithdrawal}</td>
        </tr>
      </tbody>
    </table>`
  );
}

// for buyer to confirm delivery
async function deedConfirm(id) {
  try {
    await marketplaceInstance.methods.buyerVerify(id).send({ from: user });
  }
  catch (err) {
    console.log(err);
  }
}