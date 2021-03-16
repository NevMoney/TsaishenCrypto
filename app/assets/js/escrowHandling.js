async function choseEscrow() {
  let escrowByBuyer = await marketplaceInstance.methods.getEscrowByBuyer(user).call();
  console.log("escrowByBuyer", escrowByBuyer);
  let usersHomes = await usersInstance.methods.getUserHomes(user).call();
  console.log("usersHomes", usersHomes);
  $("#portfolioLoading").hide();

  if (user === escrowInfo.buyer || user === escrowInfo.seller) {
    $(".escrowBuyer").show();
    $("#portfolioTop").hide();
  } else {
    $(".escrowBuyer").hide();
    $("#portfolioTop").show();
  }

  if (escrowByBuyer == 0 && usersHomes.length > 0) {
    // this is a seller only
    sellerEscrowInfo();
    console.log("seller only");
  }
  else if (escrowByBuyer > 0 && usersHomes.length > 0) {
    // this is a buyer and seller
    console.log("could be a buyer and seller");

    $(".escrowBuyer").show();
    $("#portfolioTop").hide();

    let buyer = await marketplaceInstance.methods.escrowInfo(escrowByBuyer).call();
    console.log("this is buyer escrow info", buyer);
    $("#escrowBuyerDisplay").empty();
    $("#escrowBuyerDisplay").append(
      `<div class="btn btn-primary-soft mr-1 lift mb-md-6" id="checkEscrowBtn${buyer.tokenId}" onclick="houseEscrowInfo(${buyer.tokenId})">Buyer Escrow <i class="fas fa-info"></i></div>  
      <div class="btn btn-primary-soft mr-1 lift mb-md-6" id="deedInfoBtn${buyer.tokenId}" onclick="fetchDeedInfo(${buyer.tokenId})">Buyer Deed <i class="fas fa-info"></i></div>
      <div id="userEscrowInfoDisplay"></div>
      `
    );

    for (i = 0; i < usersHomes.length; i++) {
      let seller = await marketplaceInstance.methods.escrowInfo(usersHomes[i]).call();
      console.log("this is seller escrow info", seller);
      // $("#portfolioLoading").hide();
      // $("#nextStep").hide();
      // $("#escrowBuyerDisplay").empty();
      $("#escrowBuyerDisplay").append(
        `<div class="btn btn-primary-soft mr-1 lift mb-md-6" id="checkEscrowBtn${seller.tokenId}" onclick="houseEscrowInfo(${seller.tokenId})">Seller Escrow <i class="fas fa-info"></i></div>  
        <div class="btn btn-primary-soft mr-1 lift mb-md-6" id="deedInfoBtn${seller.tokenId}" onclick="fetchDeedInfo(${seller.tokenId})">Seller Deed <i class="fas fa-info"></i></div>
        <div id="userEscrowInfoDisplay"></div>
        `
      );
    }

  }
  else if (escrowByBuyer > 0) {
    // this is a buyer only
    fetchEscrowInfo();
    console.log("buyer only");
  }
    
}

async function sellerEscrowInfo() {
  let userHomes = await usersInstance.methods.getUserHomes(user).call();
  for (i = 0; i < userHomes.length; i++) {
    let sellerEscrow = await marketplaceInstance.methods.escrowInfo(userHomes[i]).call();
    console.log("seller escrow", sellerEscrow);

    // $("#portfolioLoading").hide();
    $("#nextStep").hide();

    if (sellerEscrow.amount > 0) {
      if (user === sellerEscrow.buyer || user === sellerEscrow.seller) {
        $(".escrowBuyer").show();
        $("#portfolioTop").hide();
      } else {
        $(".escrowBuyer").hide();
        $("#portfolioTop").show();
      }
      $("#escrowBuyerDisplay").empty();
      appendEscrowButtons(sellerEscrow.tokenId);
    } else {
        $(".escrowBuyer").hide();
        $("#portfolioTop").show();
    }
  }
}
  
async function fetchEscrowInfo() {
  let escrow = await marketplaceInstance.methods.getEscrowByBuyer(user).call();
  console.log("buyer escrow", escrow);
  let escrowInfo = await marketplaceInstance.methods.escrowInfo(escrow).call();
  console.log("buyerEscrowInfo", escrowInfo);
  // $("#portfolioLoading").hide();

  if (escrowInfo.amount > 0) {
    if (user === escrowInfo.buyer || user === escrowInfo.seller) {
      $(".escrowBuyer").show();
      $("#portfolioTop").hide();
    } else {
      $(".escrowBuyer").hide();
      $("#portfolioTop").show();
    }
    $("#escrowBuyerDisplay").empty();
    appendEscrowButtons(escrowInfo.tokenId);
  } else {
      $(".escrowBuyer").hide();
      $("#portfolioTop").show();
  }

}

async function appendEscrowButtons(id) {
  $("#escrowBuyerDisplay").append(
    `<div class="btn btn-primary-soft mr-1 lift mb-md-6" id="checkEscrowBtn${id}" onclick="houseEscrowInfo(${id})">Escrow <i class="fas fa-info"></i></div>  
    <div class="btn btn-primary-soft mr-1 lift mb-md-6" id="deedInfoBtn${id}" onclick="fetchDeedInfo(${id})">Deed <i class="fas fa-info"></i></div>
    <div id="userEscrowInfoDisplay"></div>
    `
  );
}

// for individual escrow to get info
async function houseEscrowInfo(id) {
  let escrowInfo = await marketplaceInstance.methods.escrowInfo(id).call();
  showEscrowInfo(escrowInfo.tokenId, escrowInfo.seller, escrowInfo.buyer, escrowInfo.state, escrowInfo.amount, escrowInfo.timelock, escrowInfo.token);
}

async function showEscrowInfo(id, seller, buyer, state, amount, time, token) {
  let checkRefund = await marketplaceInstance.methods.refundAllowed(id).call();
  let checkWithdrawal = await marketplaceInstance.methods.withdrawalAllowed(id).call();
  let escrowDate = new Date(time * 1000);
  amount = web3.utils.fromWei(amount);
  let now = new Date();
  // console.log("Show Escrow Info", escrowDate, now);
  
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

  if (user === buyer && now > escrowDate && state == "Active") {
    checkRefund = `<div class="btn btn-primary-soft mr-1 lift mb-md-6" id="refundBtn${id}" onclick="requestRefund(${id})"><i class="fas fa-undo-alt"></i> <i class="fas fa-dollar-sign"></i> Refund</div>`;
  } else if (user === seller && now > escrowDate && state == "Active") {
    checkRefund = "True";
  }

  if (checkRefund == false) {
    checkRefund = "False";
  }

  // STILL NEED TO CHECK THIS!!
  if (checkWithdrawal == false) {
    checkWithdrawal = "False";
  }
  else if (user === seller && checkWithdrawal == true && now > escrowDate) {
    checkWithdrawal = `<div class="btn btn-success-soft mr-1 lift mb-md-6" id="sellerWithdrawBtn${id}" onclick="requestFunds(${id})">Withdraw <i class="fas fa-dollar-sign"></i></div>`;
  }
  else if (checkWithdrawal == true && now > escrowDate) {
    checkWithdrawal = "True";
  }
  else if (checkWithdrawal == true) {
    checkWithdrawal = "True, after unlock date";
  }

  if (user == seller) {
    $("#userEscrowInfoDisplay").append(
      `<table class="table">
        <thead><b>Seller's Escrow Info</b></thead>
        <tbody>
          <tr>
            <td><b>Seller Address:</b> ${seller}</td>
            <td><b>Buyer Address:</b> ${buyer}</td>
          </tr>
          <tr>
            <td><b>Escrow Amount:</b> ${amount} ${token}</td>  
            <td><b>Escrow Is Now:</b> ${state}</td>
          </tr>
          <tr>
            <td><b>Refunds permitted?</b> ${checkRefund}</td>
            <td><b>Next Step Unlock Date:</b> ${escrowDate}</td>
          </tr>
          <tr>
            <td><b>Withdrawals permited?</b> ${checkWithdrawal}</td>
            <td><div class="btn btn-danger-soft mr-1 lift mb-md-6" id="cancelEscrowBtn${id}" onclick="cancelEscrow(${id})">Cancel <i class="fas fa-file-signature"></i></div>
            <div class="btn btn-success-soft mr-1 lift mb-md-6" id="uploadDeedBtn${id}" onclick="uploadDeed(${id})">Upload Deed <i class="fas fa-file-upload"></i></div></td>
          </tr>
        </tbody>
      </table>`
    );
  } else {
    $("#userEscrowInfoDisplay").append(
      `<table class="table">
        <thead><b>Buyer's Escrow Info</b></thead>
        <tbody>
          <tr>
            <td><b>Seller Address:</b> ${seller}</td>
            <td><b>Buyer Address:</b> ${buyer}</td>
          </tr>
          <tr>
            <td><b>Escrow Amount:</b> ${amount} ${token}</td>  
            <td><b>Escrow Is Now:</b> ${state}</td>
          </tr>
          <tr>
            <td><b>Refunds permitted?</b> ${checkRefund}</td>
            <td><b>Next Step Unlock Date:</b> ${escrowDate}</td>
          </tr>
          <tr>
            <td><b>Withdrawals permited?</b> ${checkWithdrawal}</td>
            <td><div class="btn btn-danger-soft mr-1 lift mb-md-6" id="cancelEscrowBtn${id}" onclick="cancelEscrow(${id})">Cancel <i class="fas fa-file-signature"></i></div></td>
          </tr>
        </tbody>
      </table>`
    );
  }
}

// for buyer to confirm delivery
async function deedConfirm(id) {
  try {
    let confirm = await marketplaceInstance.methods.buyerVerify(id).send({ from: user });
    console.log("confirm delivery", confirm);
    goToPortfolio();
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
    goToPortfolio();
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
    $("#escrowBuyerDisplay").append(`<p>Buyer is requesting file review.</p>`);
  }
  catch (err) {
    console.log(err);
  }
}

// for buyer refund
async function requestRefund(id) {
  try {
    let refundHash = await marketplaceInstance.methods.refundEscrow(id).send({ from: user });
    console.log("review request hash", refundHash);
    goToPortfolio();
  }
  catch (err) {
    console.log(err);
  }
}

async function fetchDeedInfo(id) {
  try {
    let deedInfo = await marketplaceInstance.methods.getDeedInfo(id).call();
    console.log("fetchDeedInfo", deedInfo);
    showDeedInfo(deedInfo.tokenId, deedInfo.seller, deedInfo.buyer, deedInfo.salePrice, deedInfo.deedDate, deedInfo.deedHash, deedInfo.index);
  }
  catch (err) {
      console.log(err);
  }
}
  
async function showDeedInfo(id, seller, buyer, price, date, hash, index) {
  let escrowInfo = await marketplaceInstance.methods.escrowInfo(id).call();
  let token = escrowInfo.token;
  let deedDate = new Date(date * 1000).toLocaleString();
  let showPrice = new Intl.NumberFormat().format(price);
  let indexDisplay = Number(index) + 1;
  const ipfsDeedLink =
        "<a target='_blank' rel='noopener noreferrer' href='https://ipfs.io/ipfs/" +
        hash + "'>" + hash + "</a>";

  if (token == ethAddress) {
    token = "ETH";
  } else if (token == daiAddress) {
    token = "DAI";
  } else if (token == usdcAddress) {
    token = "USDC";
  }

  if (price <= 0) {
    $("#userEscrowInfoDisplay").append(`<p>This property does not have any deeds on blockchain yet.</p>`);
  } else {
    $("#userEscrowInfoDisplay").append(
      `<table class="table">
        <thead><b>Deed Info ${id} </b> <i> Please note this could be a previously uploaded deed. Check the addresses and date for context.</i>
        </thead>
        <tbody>
          <tr>
            <td><b>Seller:</b> ${seller}</td>
            <td><b>Buyer:</b><br> ${buyer}</td>
          </tr>
          <tr>
            <td><b>Sale Price:</b> $${showPrice}</td>
            <td><b>Purchased With:</b> ${token}</td>
          </tr>
          <tr>
            <td><b>Deed Upload Date:</b> ${deedDate}</td>  
            <td><b>Latest Uploaded Deed:</b> ${ipfsDeedLink}</td>
          </tr>
          <tr>
            <td><b>Property ID</b> ${id}</td>  
            <td><b>Deeds for this property:</b> ${index}</td>
          </tr>
          <tr id="buyerOnlyButtons${id}"></tr>
        </tbody>
      </table>`
    );
  }

  if (user == buyer) {
    $("#userEscrowInfoDisplay").append(
      `<tr>
        <td><div class="btn btn-primary-soft mr-1 lift mb-md-6" id="reviewRequestBtn${id}" onclick="requestReview(${id})">Request Review <i class="fas fa-search"></i></div></td>
        <td><div class="btn btn-success-soft mr-1 lift mb-md-6" id="buyerVerifyBtn${id}" onclick="deedConfirm(${id})">Confirm <i class="fas fa-envelope-open"></i></div></td>
      </tr>`
    );
  }
}

async function uploadDeed(id) {
  // show upload information
  $("#market-container").hide();
  $("#upload-container").hide();
  $("#homePage").hide();
  $("#upload-what").hide();
  $("#portfolio").hide();
  $("#learnMore").hide();
  $("#aboutPage").hide();
  $("#escrowPage").hide();
  
  $("#deed-container").show();
  $("#finishDeedUpload").append(
    `<div class="btn btn-primary mr-1 lift mb-md-6" id="finalizeSaleBtn${id}" onclick="combineResults(${id})">Confirm & Upload</div>`
  );
}

const showIpfsDeed = document.querySelector('#ipfsDeedResult');

async function combineResults(id) {
  let deedHash = showIpfsDeed.innerHTML;
  console.log("combine results id", id, "deedHash", deedHash);
  try {
    let deed = await marketplaceInstance.methods.sellerComplete(id, deedHash).send({ from: user });
    console.log("uploadDeed", deed);
  }
  catch (err) {
    console.log(err);
  }
  goToPortfolio();
  $("#escrowFinalSteps").show();
}

async function requestFunds(id) {
  try {
    let funds = await marketplaceInstance.methods.sellerWithdraw(id).send({ from: user });
    console.log(funds);
    alert("Funds successfully withdrawn. Congratulations on your sale!");
    goToPortfolio();
  }
  catch (err) {
    console.log(err);
  }
}