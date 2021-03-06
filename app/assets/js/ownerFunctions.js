// ---- CONTRACT OWNER FUNCTIONS ----
async function ownerInitializeContracts() {
    try {
        await usersInstance.methods.setHouseTokenAddress(houseTokenAddress).send(); 
        await usersInstance.methods.setMarketplaceAddress(marketplaceAddress).send();
        await houseTokenInstance.methods.setMarketplaceAddress(marketplaceAddress).send();
        console.log("Marketplace: ", marketplaceAddress);
        console.log("HouseToken: ", houseTokenAddress);
        console.log("MP in HT");
    }
    catch (err) {
        console.log(err);
    }
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
                <td class="btn" onclick="showEscrowDetails(${houseId})" data-toggle="modal" data-target="#usersEscrowsModal">${houseId}</td>
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
}

async function showEscrowDetails(id) {
    house = await houseTokenInstance.methods.getHouse(id).call();
    console.log("showescrow", house.uri);
    fetch(house.uri).then(function (res) {
      res.json().then(function (data) {
        imageUrl = data.image;
        value = new Intl.NumberFormat().format(data.attributes[8].value);
        income = new Intl.NumberFormat().format(data.attributes[9].value);
        $("#escrowModalDisplay").empty();
        $(".finalizingEscrowDisplay").append(
          `<tr>
            <td><img width=350px src=${imageUrl}><br>
            <strong>Property Value:</strong> $${value}<br>
            <strong>Monthly Income:</strong> $${income}</td>
          </tr>
          <tr>
            <td class="btn btn-secondary light-b-shadow" id="closeEscrowBtn${id}" onclick="ownerCloseEscrow(${id})">Close Escrow ${id}</td>
            <td class="btn btn-light light-b-shadow" id="completeEscrowBtn${id}" onclick="ownerFinalizeEscrow(${id})">Payout Escrow ${id}</td>
          </tr>`
        );
      });
    });
}

// CAREFUL this costs gas
async function ownerCloseEscrow(id) {
    try {
        let txHash = await marketplaceInstance.methods.closeEscrow(id).send({ from: user });
        console.log("owner closed escrow", txHash);
        $("#usersEscrowsModal").modal("hide");
    }
    catch (err) {
        console.log(err);
    }
}

// CAREFUL this also costs gas
async function ownerFinalizeEscrow(id) {
    try {
        let txHash = await marketplaceInstance.methods.finalizeEscrowTransaction(id).send({ from: user });
        $("#usersEscrowsModal").modal("hide");
        console.log("escrow payout", txHash);
    }
    catch (err) {
        console.log(err);
    }
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
    // console.log(minted.events.Transfer.returnValues);
    let to = minted.events.Transfer.returnValues.to;
    let id = minted.events.Transfer.returnValues.tokenId;
    $("#balanceDisplay").append(
        `<p>House ID ${id} is minted for: ${to}</p>`);
    $("#ownerCloseBtn").show();
}

async function burnHouseToken() {
    var id = $("#houseIdInput").val();
    try {
        let burn = await houseTokenInstance.methods.destroyHouse(id).send({ from: user });
        console.log("house burn", burn);
        alert("House token burned.");
    }
    catch (err) {
        console.log(err);
    }
}

async function ownerAddHouseToUser() {
    var id = $("#houseIdInput").val();
    var address = $("#addresOfUserInput").val();
    try {
        let added = await usersInstance.methods.addHouseToUser(address, id).send({ from: user });
        console.log("added house to user", added);
        alert("House added to user");
    }
    catch (err) {
        console.log(err);
    }
}

async function ownerRemoveHouseFromUser() {
    var id = $("#houseIdInput").val();
    var address = $("#addresOfUserInput").val();
    try {
        let removed = await usersInstance.methods.deleteHouseFromUser(address, id).send({ from: user });
        console.log("removed house from user", removed);
        alert("House removed from user");
    }
    catch (err) {
        console.log(err);
    }
}

async function ownerAddUser() {
    var address = $("#addresOfUserInput").val();
    try {
        let userAdded = await usersInstance.methods.addUser(address).send({ from: user });
        console.log("added user", userAdded);
        alert("User added");
    }
    catch (err) {
        console.log(err);
    }
}

async function ownerRemoveUser() {
    var address = $("#addresOfUserInput").val();
    try {
        let userDeleted = await usersInstance.methods.deleteUser(address).send({ from: user });
        console.log("added user", userDeleted);
        alert("User removed");
    }
    catch (err) {
        console.log(err);
    }
}

async function getUserCount() {
    let userNumber = await usersInstance.methods.userCount().call();
    console.log(userNumber);
    $("#balanceDisplay").append(`<p>Current number of users: ${userNumber}</p>`);
}

async function ownerDeedInfo() {
    let userList = await usersInstance.methods.getAllUsers().call();

    for (i = 0; i < userList.length; i++) {
        let list = userList[i].toString();
        list = list.substr(26);
        let begin = "0x";
        let tUserAdd = begin.concat(list);
        let tsaishenUserInfo = await usersInstance.methods.getUserInfo(tUserAdd).call();
        // console.log("users object" + i + ":", tsaishenUserInfo);
        let homeArray = tsaishenUserInfo.houses;
        // console.log("homes array" + i + ":", homeArray);

        for (n = 0; n < homeArray.length; n++) {
            let homes = homeArray[n].toString();
            homes = homes.substr(26);
            // console.log("homes" + n + ":", homes);

            let deedInfo = await marketplaceInstance.methods.getDeedInfo(homes).call();
            console.log("fetchDeedInfo", deedInfo);
            
            displayDeedInfo(deedInfo.tokenId, deedInfo.seller, deedInfo.buyer, deedInfo.salePrice, deedInfo.deedDate, deedInfo.deedHash, deedInfo.index);
        }
    }
}

async function displayDeedInfo(id, seller, buyer, price, date, link, index) {
    const ipfsDeedLink =
        "<a target='_blank' rel='noopener noreferrer' href='https://ipfs.io/ipfs/" +
        link + "'>" + link + "</a>";
    let deedDate = new Date(date * 1000).toLocaleString();
    let showPrice = new Intl.NumberFormat().format(price);
    let escrowInfo = await marketplaceInstance.methods.escrowInfo(id).call();
    let token = escrowInfo.token;

    if (token == ethAddress) {
        token = "ETH";
    } else if (token == daiAddress) {
        token = "DAI";
    } else if (token == usdcAddress) {
        token = "USDC";
    }

    $("#deedDisplayTable").show();

    if (price > 0) {
        $("#deedDisplayTable").append(
        `<table class="table table-responsive">
            <thead class="thead-dark">
            <th scope="col">House ID</th>
            <th scope="col">Index</th>
            <th scope="col">Date</th>
            <th scope="col">Price</th>
            <th scope="col">Token</th>
            <th scope="col">Link</th>
            <th scope="col">Seller</th>
            <th scope="col">Buyer</th>
            </thead>
            <tbody>
            <tr>
                <td class="btn">${id}</td>
                <td>${index}</td>
                <td>${deedDate}</td>
                <td>$ ${showPrice}</td>
                <td>${token}</td>
                <td>${ipfsDeedLink}</td>
                <td>${seller}</td>
                <td>${buyer}</td>
            </tr>
            </tbody>
        </table>`
        );
    }
}

// NEED to get an ID and IPFS hash first
async function ownerUpdateUri() {
    var id = $("#houseIdInput").val();
    var url = $("#houseUrlInput").val();
    try {
        let update = await houseTokenInstance.methods.updateUri(id, url).send({ from: user });
        console.log("ownerUpdateUri", update);
        alert("House URI was successfully updated");
    }
    catch (err) {
        console.log(err);
    }
}

async function ownerUpdateDeed() {
    var id = $("#houseIdInput").val();
    var url = $("#houseUrlInput").val();
    try {
        let update = await marketplaceInstance.methods.sellerComplete(id, url).send({ from: user });
        console.log("ownerUpdateUri", update);
    }
    catch (err) {
        console.log(err);
    }
}

function ownerUploadUriInfo() {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();
    $("#houseUploadedMsg").hide();
    $("#newUserMsg").hide();

    $("#upload-container").show();
    $("#dynamicUpload").append(
        `<button id="uploadFree" type="button" class="btn btn-primary" value="SUBMIT">Owner Upload</button>`
    );
    
    if (user === contractOwnerAddress) {
        $("#dynamicUpload").show();
    } else {
        $("#dynamicUpload").hide();
    }
}
