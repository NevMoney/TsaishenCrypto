var houseTokenInstance;
var marketplaceInstance;
var usersInstance;

var tsaishenUsersAddress = "0xC5aFE31AE505594B190AC71EA689B58139d1C354";
var houseTokenAddress = "0x42D4BA5e542d9FeD87EA657f0295F1968A61c00A";
var marketplaceAddress = "0x25AF99b922857C37282f578F428CB7f34335B379";
const contractOwnerAddress = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";
const creatorAddress = "0xb0F6d897C9FEa7aDaF2b231bFbB882cfbf831D95";
// approved token addresses
const ethAddress = "0x0000000000000000000000000000000000000000";
const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const ethereumButton = document.querySelector('.enableEthereumButton');
const showAccount = document.querySelector('.showAccount');

// CLicking Enable Web3 button to get MetaMask  
  ethereumButton.addEventListener("click", () => {
    if (typeof window.ethereum !== "undefined") {
      ethereum.request({ method: "eth_requestAccounts" });
    }
    else {
      $("#metamaskModal").modal("toggle");
  }
});

//Executed when page finish loading
$(document).ready(async () => {
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  // console.log(accounts);
  web3 = new Web3(ethereum);
  toWei = (amount) => web3.utils.toWei(String(amount));
  fromWei = (amount) => Number(web3.utils.fromWei(amount)).toFixed(4);
  showAccount.innerHTML = accounts[0];

  ethereum.on("accountsChanged", (_accounts) => {
    // console.log("Account Changed!", accounts[0]);
    showAccount.innerHTML = _accounts;
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
    $("#houseUploadedMsg").append(`<strong>Congratulations ${owner}!</strong> You have successfully uploaded real property onto 
      the blockchain. <u>Your property ID is ${houseId}</u>. Head on over the Portfolio page and take a look.`);
    $("#houseUploadedMsg").show();
  })
    .on("error", console.error);
  
  marketplaceInstance.events.MarketTransaction().on("data", (event) => {
    var eventType = event.returnValues["TxType"].toString();
    var tokenId = event.returnValues["tokenId"];
    var actor = event.returnValues["actor"];
    if (eventType == "House listed") {
      alert("Congrats " + actor + "! You have listed property ID: " + tokenId + " for sale.");
    }
    if (eventType == "Offer removed") {
      alert("You have successfully removed property ID: " + tokenId + " from the market.");
    }
    if (eventType == "House purchased") {
      alert("Congrats on your purchase. You have acquired property ID: " + tokenId);
    }
    if (eventType == "House in Escrow") {
      alert("Well done! You are in escrow for property ID: " + tokenId);
    }
    if (eventType == "Escrow Refunded") {
      alert("Escrow sale didn't go through. Funds are refunded to " + actor + " for property ID: " + tokenId + ". House is back on the market."); //CONSIDER putting this in a DIV for the house
    }
    if (eventType == "Escrow closed. Buyer has 3 days to verify.") {
      alert("Escrow is closed for " + tokenId +
        ". Buyer has 3 days to verify documents before funds are released to " + actor);
    }
    if (eventType == "Seller uploaded docs.") {
      alert("Seller " + actor + " reported docs are uploaded for house ID: " + tokenId + ". Buyer has 3 days to verify.");
    }
    if (eventType == "Buyer verified, house SOLD.") {
      alert("Congratulations! Buyer has verified the document delivery. House ID: " + tokenId +
        " is sold.");
    }
    if (eventType == "House SOLD") {
      alert("Congratulations " + actor + "! Escrow has successfully closed and property ID: " + tokenId + " is sold.");
    }
    if (eventType == "3-day document update request issued.") {
      alert("ATTENTION! Buyer: " + actor + " is requesting document review for property ID: "
        + tokenId + ". Seller has 3 days to review and resubmit documents.");
    }
    if (eventType == "Escrow Cancelled.") {
      alert("Escrow for property ID: " + tokenId + " has been cancelled by " + actor +
        ". Injured party has been compensated and the property is back on market.");
    }
  })
    .on("error", console.error);
  
  // marketplaceInstance.events.OracleEvent().on("data", (event) => {
  //   var eventType = event.returnValues["TxType"].toString();
  //   var token = event.returnValues["token"];
  //   if (eventType == "New token added.") {
  //     $("#tokenAlert").append(`Wahoo! We just added another crypto to transact with: ${token}.`);
  //     $("#tokenAlert").show();
  //   }
  //   if (eventType == "Token removed") {
  //     $("#tokenAlert").append(`For security reasons, we've had to remove the following token: ${token}.`);
  //     $("#tokenAlert").show();
  //   }
  // })
  //   .on("error", console.error);
  
  usersInstance.events.userAdded().on("data", (event) => {
    $("#newUserMsg").append(`Welcome to <strong>Tsaishen Crypto House</strong>! You are registered with account: ${user}.`);
    $("#newUserMsg").show();
  })
    .on("error", console.error);
});

function appendCryptoHouse(id, url, price, seller, state) {
  renderCryptoHouse(id, url, price, seller, state)
  // houseButtons(id, url, isMarketplace, price, seller);
  $("#marketplaceLoading").hide();
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
      let url = house.uri;
      // console.log("id", id);
      // console.log("house info ", house);
      // console.log(url);
      
      appendCryptoHouse(id, url, NaN, user, 0);  
    }
  }
  catch (err) {
    console.log(err);
  }
}

// get data from JSON and render display
function renderCryptoHouse(id, url, price, owner, state) {
  fetch(url).then(function (res) {
    res.json().then(function (data) {
      // console.log("JSON file: ", data);
      console.log("renderCryptoHouse", id, url, price, owner, state);

      $("#portfolioLoading").hide();
      
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
      certification = data.certification;
      // console.log("pic:", imageUrl, "about:", description, "address:", address, "county:", county, "beds:", beds,
      //   "bath:", baths, "year built:", year, "house sqft:", house, "lot size:", size,
      //   "parcel no:", parcel, "current value:", value, "current income:", income,
      //   "property type:", type, "more info:", link, "video tour:", video, "certification", certification); 

      /**
       * Because at listing house we pass the number as BigNumber, we have to use it here as well.
       * The price will show inWei, so we have to multiply it by 1**18 (basically "fromWei").
       * Then we take the price and utilize number format to display comas, etc. for better UI
       */
      const { BN } = web3.utils;
      let multiplier = new BN('1000000000000000000');
      let showPrice = new Intl.NumberFormat().format(new BN(price * multiplier));
      // console.log("price w multiplier", showPrice);

      var button = `<div class="row">     
                      <button class="btn btn-success" id="selectSaleBtn${id}" onclick="selectHouseForSale(${id})" data-toggle="modal" data-target="#sellHouseModal">Sell</button>
                      <button class="btn btn-danger" id="cancelBtn${id}" onclick="cancelSale(${id})">Cancel Sale</button>
                      
                      <button class="btn btn-warning light-b-shadow" id="buyBtn${id}" onclick="selectToken(${id})" data-toggle="dropdown">Buy House: $${showPrice}</button>
                        <div class="tokenPrices dropdown-menu dropdown-menu-md">
                          <h4>Currently accepting:</h4><br>                             
                          <h4 class="btn btn-dark-soft light-b-shadow" data-toggle="modal" data-target="#buyHouseModal" id="ethereumToken${id}"><img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880"> <span id="showEthPrice${id}"></span> ETH</h4>
                          <h4 class="btn btn-dark-soft light-b-shadow" data-toggle="modal" data-target="#buyHouseModal" id="daiToken${id}"><img src="https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png?1574218774"> <span id="showDaiPrice${id}"></span> DAI</h4>
                          <h4 class="btn btn-dark-soft light-b-shadow" data-toggle="modal" data-target="#buyHouseModal" id="usdcToken${id}"><img src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389"> <span id="showUsdcPrice${id}"></span> USDC</h4>
                        </div>
                    </div>`
                    
      $(".portfolioDisplay").append(
        `<tr>
          <td id="propertyImage${id}"><img width=250px src=${imageUrl}>
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
            <br><strong>Video:</strong> <a href=${video} target="_blank" rel="noopener noreferrer">${video}</a>
            <br><strong>Certification:</strong> ${certification}</td>
        </tr>
        `
      )
      // state 0 - not for sale, state 1 - active for sale, state 2 - in escrow
      if (state == 0) {
        $("#houseDisplay").append(button);
        $(`#buyBtn${id}`).hide();
        $(`#cancelBtn${id}`).show();
        $(`#selectSaleBtn${id}`).show();
      }
      else if (state == 1) {
        $("#houseSale").append(button);
        $(`#selectSaleBtn${id}`).hide();
        
        if (owner === user) {
          $(`#buyBtn${id}`).hide();
          $(`#cancelBtn${id}`).show();
        }
        else {
          $(`#buyBtn${id}`).show();
          $(`#cancelBtn${id}`).hide();
        }

      }
      else if (state == 2) {
        $(`#buyBtn${id}`).hide();
        $(`#cancelBtn${id}`).hide();
        $(`#selectSaleBtn${id}`).hide();
        $(`#propertyImage${id}`).addClass("inEscrow");
        $(`#propertyImage${id}`).append("IN ESCROW");
      }    

    });
  });
}

async function appendHouse(id, price, seller, state) {
  // console.log("appendHouse ID", id, "aH price", price, "aH seller", seller);
  var house = await houseTokenInstance.methods.getHouse(id).call();
  console.log("appendHouse", house);
  appendCryptoHouse(id, house.uri, price, seller, state);
}

async function checkOffer(id) {
  try {
    let x = await marketplaceInstance.methods.getOffer(id).call();
    console.log("checkOffer x", x);
    var price = x.price;
    var seller = x.seller;
    var loan = x.loan;
    var state = x.offerstate;

    price = web3.utils.fromWei(price);
    var offer = { seller: seller, price: price, state: state };
    console.log("offer", offer);
    return offer;
  }
  catch (err) {
    console.log(err)
  }
}

async function sellCryptoHouse(id) {
  const offer = await checkOffer(id);
  if (offer.state != 0) return alert("This asset is already listed.");

  var price = $("#housePrice").val();
  const { BN } = web3.utils;
  var amount = new BN(price);
  const isApproved = await houseTokenInstance.methods.isApprovedForAll(user, marketplaceAddress).call();
  // console.log(isApproved);
  // console.log("sellCryptohouse Amount", amount);
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

async function getInventory() {
  try {
    // perhaps we can call different function here!
    var arrayId = await marketplaceInstance.methods.getAllTokensOnSale().call();
    console.log("getInventory array: ", arrayId);
    for (i = 0; i < arrayId.length; i++){
      if (arrayId[i] != 0) {
        const offer = await checkOffer(arrayId[i]);
        console.log("getInventory", offer, arrayId[i]);

        if (offer.state) {
          appendHouse(arrayId[i], offer.price, offer.seller, offer.state);
        }
        
      }
    }
  }
  catch (err) {
    console.log(err);
  }
}

async function removeOffer(id) {
  const offer = await checkOffer(id);
  if (offer.state == 0) {
    return alert("Nothing to cancel. This property is not listed.");
  } else if (offer.state == 2) {
    return alert("You can't cancel this listing. This property is in escrow. To cancel escrow, please visit Portfolio Page and cancel there.");
  }
  await marketplaceInstance.methods.removeOffer(id).send({ from: user });
  goToInventory();
}

async function getRecentTokenPrice(id, price, token) {
  // console.log("getRecentTokenPriceID", id, "recentTokenPrice", price, "tokenAdd", token);
  let oracleObject = await marketplaceInstance.methods.getOracleUsdPrice(token).call();
  let recentPrice, priceTime;
  [recentPrice, priceTime] = Object.values(oracleObject);
  let conversion = recentPrice / 100000000;
  let priceInCrypto = (price / conversion);
  // console.log("token price and time: ", priceInCrypto, priceTime);
  return priceInCrypto;
}

async function selectToken(id) {
  let offer = await checkOffer(id);
  const { BN } = web3.utils;
 
  let ethOracle = await getRecentTokenPrice(id, offer.price, ethAddress);
  let ethPrice = (ethOracle * 1000000000000000000).toFixed(2);
  $(`#showEthPrice${id}`).empty();
  $(`#showEthPrice${id}`).append(ethPrice);
  
  let daiOracle = await getRecentTokenPrice(id, offer.price, daiAddress);
  let daiPrice = (daiOracle * 1000000000000000000).toFixed(2);
  $(`#showDaiPrice${id}`).empty();
  $(`#showDaiPrice${id}`).append(daiPrice);

  let usdcOracle = await getRecentTokenPrice(id, offer.price, usdcAddress);
  let usdcPrice = (usdcOracle * 1000000000000000000).toFixed(2);
  $(`#showUsdcPrice${id}`).empty();
  $(`#showUsdcPrice${id}`).append(usdcPrice);

  if ($(`#ethereumToken${id}`).click(function () {
    $(".displaySelectedCurrencyPrice").empty();
    $(".displaySelectedCurrencyPrice").append(ethPrice, " ETH");
    selectHouseToBuy(id, ethPrice, ethAddress);
  }));
  if ($(`#daiToken${id}`).click(function () {
    $(".displaySelectedCurrencyPrice").empty();
    $(".displaySelectedCurrencyPrice").append(daiPrice, " DAI");
    selectHouseToBuy(id, daiPrice, daiAddress);
  }));
  if ($(`#usdcToken${id}`).click(function () {
    $(".displaySelectedCurrencyPrice").empty();
    $(".displaySelectedCurrencyPrice").append(usdcPrice, " USDC");
    selectHouseToBuy(id, usdcPrice, usdcAddress);
  }));
}

async function displayPurchase(id, price, token) {
  house = await houseTokenInstance.methods.getHouse(id).call();
  // console.log("displayPurchase", house.uri);
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

async function buyCryptoHouse(id, price, token) {
  const offer = await checkOffer(id);
  // console.log("buying House offer", offer);
  // console.log("ID", id, "price", price, "offer.price", offer.price, "token address", token);
  try {
    let txInfo = await marketplaceInstance.methods.buyHouse(token, id).send({ from: user, value: price });
    console.log("buy house txInfo", txInfo);
    goToPortfolio();
    $("#portfolioLoading").hide();
  }
  catch (err) {
    console.log(err);
  }
}

async function escrowBuy(id, price, token) {
  const offer = await checkOffer(id);
  // console.log("escrowBuy offer", offer);
  // console.log("ID", id, "price", price, "offer.price", offer.price, "token address", token);
  try {
    let txInfo = await marketplaceInstance.methods.buyHouseWithEscrow(token, id).send({ from: user, value: price });
    console.log("escrowBuy txInfo", txInfo);
    goToPortfolio();
    $("#portfolioLoading").hide();
  }
  catch (err) {
    console.log(err);
  }
}