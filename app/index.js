var houseTokenInstance;
var marketplaceInstance;
var usersInstance;

var tsaishenUsersAddress = "0xCfEB869F69431e42cdB54A4F4f105C19C080A601";
var houseTokenAddress = "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B";
var marketplaceAddress = "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550";
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
    console.log("Account Changed!", accounts[0]);
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

function appendCryptoHouse(id, url, isMarketplace, price, seller) {
  // getHouses();
  renderCryptoHouse(id, url, isMarketplace, price, seller)
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
      
      appendCryptoHouse(id, url, false, NaN, user);  
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
      let inEscrow = true;
      // top part if(!isMarketplace) is irrelevant -- buttons always display
      if (!isMarketplace) {
        $("#houseDisplay").append(button);
        $(`#buyBtn${id}`).hide();
        $(`#cancelBtn${id}`).show();
        $(`#selectSaleBtn${id}`).show();
      }
      else {
        $("#houseSale").append(button);
        $(`#selectSaleBtn${id}`).hide();
        
    
          if (owner === user) {
            $(`#buyBtn${id}`).hide();
            $(`#cancelBtn${id}`).show();

            if (inEscrow) {
              $(`#buyBtn${id}`).hide();
              $(`#cancelBtn${id}`).hide();
              $(`#propertyImage${id}`).addClass("inEscrow");
              $(`#propertyImage${id}`).append("IN ESCROW");
            }
          }
          else {
            $(`#buyBtn${id}`).show();
            $(`#cancelBtn${id}`).hide();
            
            if (inEscrow) {
              $(`#buyBtn${id}`).hide();
              $(`#cancelBtn${id}`).hide();
              $(`#propertyImage${id}`).addClass("inEscrow");
              $(`#propertyImage${id}`).append("IN ESCROW");
            }
          }
      }

      

    });
  });
}

async function appendHouse(id, price, seller) {
  // console.log("appendHouse ID", id, "aH price", price, "aH seller", seller);
  var house = await houseTokenInstance.methods.getHouse(id).call();
  console.log("appendHouse", house);
  appendCryptoHouse(id, house.uri, true, price, seller);
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
          appendHouse(arrayId[i], offer.price, offer.seller);
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
  if (!offer.state) return alert("Nothing to cancel. This house is not listed.");
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

async function fetchEscrowInfo() {
  let escrow = await marketplaceInstance.methods.getEscrowByBuyer(user).call();
  console.log("escrowByUser", escrow);
  $("#portfolioLoading").hide();

  if (user === escrow.buyer || user === escrow.seller) {
    $(".escrowBuyer").show();
    $("#portfolioTop").hide();
  } else {
    $(".escrowBuyer").hide();
    $("#portfolioTop").show();
  }
  $("#escrowBuyerDisplay").empty();
  appendEscrowButtons(escrow.tokenId, escrow.buyer);
}

async function appendEscrowButtons(id, buyer) {
  $("#escrowBuyerDisplay").append(
    `<div class="btn btn-primary-soft mr-1 lift mb-md-6" id="checkEscrowBtn${id}" onclick="houseEscrowInfo()"><i class="fas fa-info"></i> Escrow</div>
    <div class="btn btn-success-soft mr-1 lift mb-md-6" id="buyerVerifyBtn${id}" onclick="deedConfirm(${id})">Confirm <i class="fas fa-envelope-open"></i></div>
    <div class="btn btn-primary-soft mr-1 lift mb-md-6" id="reviewRequestBtn${id}" onclick="requestReview(${id})">Request Review <i class="fas fa-search"></i></div>
    <div class="btn btn-primary-soft mr-1 lift mb-md-6" id="refundBtn${id}"><i class="fas fa-undo-alt"></i> <i class="fas fa-dollar-sign"></i> Refund</div>
    <div class="btn btn-danger-soft mr-1 lift mb-md-6" id="cancelEscrowBtn${id}" onclick="cancelEscrow(${id})">Cancel <i class="fas fa-file-signature"></i></div>
    <div id="userEscrowInfoDisplay"></div>`
  );

  if (user == buyer) {
    $(`#reviewRequestBtn${id}`).show();
    $(`#buyerVerifyBtn${id}`).show();
    $(`#refundBtn${id}`).show();
  } else {
    $(`#reviewRequestBtn${id}`).hide();
    $(`#buyerVerifyBtn${id}`).hide();
    $(`#refundBtn${id}`).hide();
  }
}

// for individual escrow to get info
async function houseEscrowInfo() {
  let escrow = await marketplaceInstance.methods.getEscrowByBuyer(user).call();
  showEscrowInfo(escrow.tokenId, escrow.seller, escrow.buyer, escrow.state, escrow.amount, escrow.timelock, escrow.token);
}

async function showEscrowInfo(id, seller, buyer, state, amount, time, token) {
  let checkRefund = await marketplaceInstance.methods.refundAllowed(id).call();
  let checkWithdrawal = await marketplaceInstance.methods.withdrawalAllowed(id).call();
  let escrowDate = new Date(time * 1000).toUTCString();
  amount = web3.utils.fromWei(amount);
  
  if (state == 0) {
    state = "Active";
  } else if (state == 1) {
    state = "Refunding";
  } else if (state == 2) {
    state = "Closed";
  }

  if (token == ethAddress) {
    token = "ETH";
  } else if (token == daiAddress) {
    token = "DAI";
  } else if (token == usdcAddress) {
    token = "USDC";
  }

  $("#userEscrowInfoDisplay").append(
    `<table class="table">
      <tbody>
        <tr>
          <td><b>Seller Address:</b> ${seller}</td>
          <td><b>Buyer Address:</b> ${buyer}</td>
        </tr>
        <tr>
          <td><b>Escrow Amount:</b> ${amount} ${token}</td>  
          <td><b>Escrow State:</b> ${state}</td>
        </tr>
        <tr>
          <td><b>Refund permitted currently?</b> ${checkRefund}</td>
          <td><b>Withdrawals permited currently?</b> ${checkWithdrawal}</td>
        </tr>
        <tr>
          <td><b>Current State Ends:</b> ${escrowDate}</td>
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

// for buyer/seller to cancel escrow
async function cancelEscrow(id) {
  let penalty = web3.utils.toWei("2", "ether");
  try {
    let cancelHash = await marketplaceInstance.methods.cancelEscrowSale(id).send({ from: user, value: penalty });
    console.log("cancel escrow hash", cancelHash);
  }
  catch (err) {
    console.log(err);
  }
}

// for buyer to request review
async function requestReview(id) {
  try {
    let reviewHash = await marketplaceInstance.methods.buyerReviewRequest(id).send({ from: user });
    console.log("review request hash", reviewHash);
  }
  catch (err) {
    console.log(err);
  }
}

// ---- OWNER ONLY FUNCTIONS ----
async function ownerInitializeContracts() {
  await usersInstance.methods.setHouseTokenAddress(houseTokenAddress).send(); 
  await usersInstance.methods.setMarketplaceAddress(marketplaceAddress).send();
  // console.log("Marketplace: ", marketplaceAddress);
  // console.log("HouseToken: ", houseTokenAddress);
}

async function getAllTsaishenUsers() {
  let userList = await usersInstance.methods.getAllUsers().call();
  // console.log("user array", userList); 

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
  // console.log("address", address);
  // console.log("properties", properties);

  $("#userDisplayTable").show();
  
  $("#userDisplayTable").append(
      `<table class="table table-responsive">
        <thead class="thead-dark">
          <th scope="col">User Address</th>
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

// for owner only
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
      
      let escrow = await marketplaceInstance.methods.escrowInfo(homes).call();
      console.log("escrow Array" + i + "." + n +":", escrow);
      // console.log("seller", escrow.seller, "buyer", escrow.buyer, "state", escrow.state, "amount", escrow.amount, "timelock", escrow.timelock);

      let escrowAmount = web3.utils.fromWei(escrow.amount);
      let timeToEnd = new Date(escrow.timelock * 1000).toLocaleDateString();

      displayEscrows(homes, escrow.seller, escrow.buyer, escrow.state, escrowAmount, timeToEnd);
    }
  }
}

async function displayEscrows(houseId, seller, buyer, state, amount, timelock) {
  $("#escrowDisplayTable").show();

  if (state == 0) {
    state = "active";
  }
  else if (state == 1) {
    state = "refunding";
  }
  else if (state == 2) {
    state = "closed";
  }

  if (amount > 0) {
    $("#escrowDisplayTable").append(
      `<table class="table table-responsive">
        <thead class="thead-dark">
        <th scope="col">Escrow House ID</th>
          <th scope="col">Seller</th>
          <th scope="col">Buyer</th>
          <th scope="col">State</th>
          <th scope="col">Amount</th>
          <th scope="col">Locked Until</th>
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
  }
  // else {
  //   $("#escrowDisplayTable").css("display", "block");
  //   $("#escrowDisplayTable").text("No houses in escrow.");
  // }
}

/** @Dev when adding new token, make sure you:
 *  add buttons in renderCryptoHouse()
 *  add token in selectToken()
*/ 
async function addNewToken() {
  let tokenAddress = $("#tokenAddressInput").val();
  let oracleAddress = $("#oracleAddressInput").val();
  let tokenName = $("#tokenName").val();
  let tokenAdded = await marketplaceInstance.methods.addOracle(tokenAddress, oracleAddress).send();
  console.log(tokenAdded);
  console.log("token added", tokenName);
  $("#tokenAdded").append(`<strong>Wahoo!</strong> We just added another token you can use to transact with: <strong>${tokenName}</strong>.`);
  $("#tokenAlert").show();
}

/** @Dev when removing token, make sure you:
 * remove functionality in renderCryptoHouse() and selectToken()
*/
async function removeTokens() {
  let tokenAddress = $("#tokenAddressInput").val();
  let tokenName = $("#tokenName").val();
  let tokenRemoved = await marketplaceInstance.methods.removeOracle(tokenAddress).send();
  console.log(tokenRemoved);
  console.log("token removed", tokenName);
  $("#tokenRemoved").append(`<strong>Attention!</strong> For security reasons, we had to remove <strong>${tokenName}</strong> from the platform. Our sincere apologies.`);
  $("#tokenAlert2").show();
}
    
async function checkContractBalance() {
  let balance = await web3.eth.getBalance(houseTokenAddress);
  balance = web3.utils.fromWei(balance);
  console.log(balance, "ETH");
  $("#balanceDisplay").html(balance + " ETH");
  $("#balanceDisplay").show();
  $("#ownerCloseBtn").show();
}

async function withdrawFunds() {
  let withdrawal = await houseTokenInstance.methods.withdrawAll().send({ to: user });
  console.log("Funds sent", withdrawal);
}

async function pauseHouseTokenContract() {
  let pause = await houseTokenInstance.methods.pause().send();
  console.log("Contract Paused", pause);
}

async function unPauseHouseTokenContract() {
  let unPause = await houseTokenInstance.methods.unpause().send();
  console.log("Contract Paused", unPause);
}

async function mintHouse() {
  // probably want to have a modal to add info about the house then mint
  // use this is to create ZERO house
  let minted = await houseTokenInstance.methods.mint(user).send();
  console.log("house minted", minted);
}