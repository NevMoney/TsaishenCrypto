var houseTokenInstance;
var marketplaceInstance;
var usersInstance;

var tsaishenUsersAddress = "0xd2b4cAE89c20c2ACc63AC41488D2CbF6971AD984";
var houseTokenAddress = "0xE6630EB2e877F2C4AB04b1Ce721D2DC8029c2f22";
var marketplaceAddress = "0x0c1eE53775f362F200796e8036a3Ce75B5DC78e8";
const contractOwnerAddress = "0x0BD027Dee897b44b98C8359305dA897E82A2305e";
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

  // console.log("users ", usersInstance);
  // console.log("house ", houseTokenInstance);
  // console.log("marketplace ", marketplaceInstance);

  await usersInstance.methods.setMarketplaceAddress(marketplaceAddress).send();
  await usersInstance.methods.setHouseTokenAddress(houseTokenAddress).send();
  // console.log("Marketplace: ", marketplaceAddress);
  // console.log("HouseToken: ", houseTokenAddress);

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
  // box div to display element into HTML
  getHouses();
  houseButtons(id, url, isMarketplace, price, seller);
  // renderCryptoHouse(id, url);
  // $("#houseDiv" + id).html();
}

// get array of houses and house info by user
async function getHouses() {
  var arrayId;
  var house;

  try {
    // first get array of all user homes
    arrayId = await usersInstance.methods.getUserHomes(user).call();
    // console.log("ID array ", arrayId);
    // loop through the array and get house info(value, income, uri)
    for (i = 0; i < arrayId.length; i++){
      house = await houseTokenInstance.methods.getHouse(arrayId[i]).call();
      
      let id = arrayId[i];
      console.log("id", id);
      // console.log("house info ", house);
      let url = house.uri;
      // console.log(url);
      
      // append the blockchain house to Portfolio (house.value, house.income)
      // appendCryptoHouse(id, url);
      renderCryptoHouse(id, url);
    }
  }
  catch (err) {
    console.log(err);
  }
}

// get data from JSON and render display
function renderCryptoHouse(id, url) {
  fetch(url).then(function (res) {
    res.json().then(function (data) {
      console.log("JSON file: ", data);

      // $("#loading").hide();
      
      address = data.attributes[0].value;
      county = data.attributes[1].value;
      beds = new Intl.NumberFormat().format(data.attributes[2].value);
      baths = new Intl.NumberFormat().format(data.attributes[3].value);
      year = data.attributes[4].value;
      house = data.attributes[5].value;
      size = data.attributes[6].value;
      parcel = data.attributes[7].value; //showing up as undefined
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
      
      // var button = `<div class="row fit-content" id="portfolioDisplay${id}">
      //                 <div>
      //                   <button class="btn btn-success" id="selectSaleBtn${id}" onclick="selectHouseForSale(${id})" data-toggle="modal" data-target="#sellHouseModal">Sell</button>
      //                   <button class="btn btn-danger" id="cancelBtn${id}" onclick="cancelSale(${id})">Cancel Sale</button>
      //                 </div>
      //               </div>`
      
      var button = houseButtons(id);
      button;

      // $(".portfolioDisplay").empty(); //calling this empties but it also removes first house
      // without it, clicking on links just keeps adding houses BUT it also shows both

      $(".portfolioDisplay").append(
        `<tr>
          <td><img width=250px src=${imageUrl}>
            <br><br>$ {button}</div></td>
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
        </tr>`
      )
    });
  });
}

function houseButtons(id, isMarketplace, price, owner, token) {
  var button = `<div class="col fit-content" id="portfolioDisplay${id}">
                    <div>
                      <div class="house" onclick="selectHouse(${id})">
                          <button class="btn btn-success" id="selectSaleBtn${id}" onclick="selectHouseForSale(${id})" data-toggle="modal" data-target="#sellHouseModal">Sell</button>
                      
                          <button class="btn btn-warning light-b-shadow" id="buyBtn${id}" onclick="selectHouseToBuy(${id})">Buy ${price, token}</button>
                          <button class="btn btn-warning light-b-shadow" id="buyEscrowBtn${id}" onclick="selectHouseToBuyWEscrow(${price, token})">Escrow Buy ${price}</button>
                          <button class="btn btn-danger" id="cancelBtn${id}" onclick="cancelSale(${id})">Cancel Sale</button>
                      </div >
                    </div>
                  </div>`

  //not really working yet
  if (!isMarketplace) {
      $("#portfolioDisplay").append(button);
      $(`#buyBtn${id}`).hide();
      $(`#buyEscrowBtn${id}`).hide();
      $(`#cancelBtn${id}`).hide();
      $(`#selectSaleBtn${id}`).show();
  }
  else {
      $("#houseDivSale").append(button);
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
  appendCryptoHouse(id, house.uri, true, price, seller);
}

// async function checkOraclePrice() {
//   var price = $("#housePrice").val();
//   let ETHprice = await marketplaceInstance.methods.getOracleUsdPrice(address(0)).call();
// }

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

async function removeOffer() {
  await marketplaceInstance.methods.removeOffer(id).send();
  goToInventory();
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