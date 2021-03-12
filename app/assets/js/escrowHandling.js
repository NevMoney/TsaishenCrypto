async function sellerEscrowInfo() {
  let userHomes = await usersInstance.methods.getUserHomes(user).call();
  for (i = 0; i < userHomes.length; i++) {
    let sellerEscrow = await marketplaceInstance.methods.escrowInfo(userHomes[i]).call();
    // console.log("seller escrow", sellerEscrow);

    $("#portfolioLoading").hide();

    if (sellerEscrow.amount > 0) {
      if (user === sellerEscrow.buyer || user === sellerEscrow.seller) {
        $(".escrowBuyer").show();
        $("#portfolioTop").hide();
      } else {
        $(".escrowBuyer").hide();
        $("#portfolioTop").show();
      }
    
      $("#escrowBuyerDisplay").empty();
    
      appendEscrowButtons(sellerEscrow.tokenId, sellerEscrow.buyer);
    } else {
        $(".escrowBuyer").hide();
        $("#portfolioTop").show();
    }
  }
}
  
async function fetchEscrowInfo() {
  let escrow = await marketplaceInstance.methods.getEscrowByBuyer(user).call();
  let escrowInfo = await marketplaceInstance.methods.escrowInfo(escrow).call();
  // console.log("escrowInfo", escrowInfo);
  $("#portfolioLoading").hide();

  if (escrowInfo.amount > 0) {
    if (user === escrowInfo.buyer || user === escrowInfo.seller) {
      $(".escrowBuyer").show();
      $("#portfolioTop").hide();
    } else {
      $(".escrowBuyer").hide();
      $("#portfolioTop").show();
    }
  
    $("#escrowBuyerDisplay").empty();
  
    appendEscrowButtons(escrowInfo.tokenId, escrowInfo.buyer);
  } else {
      $(".escrowBuyer").hide();
      $("#portfolioTop").show();
  }
  
}

async function appendEscrowButtons(id, buyer) {
  $("#escrowBuyerDisplay").append(
    `<div class="btn btn-primary-soft mr-1 lift mb-md-6" id="checkEscrowBtn${id}" onclick="houseEscrowInfo(${id})">Escrow <i class="fas fa-info"></i></div>
    <div class="btn btn-success-soft mr-1 lift mb-md-6" id="buyerVerifyBtn${id}" onclick="deedConfirm(${id})">Confirm <i class="fas fa-envelope-open"></i></div>
    <div class="btn btn-primary-soft mr-1 lift mb-md-6" id="reviewRequestBtn${id}" onclick="requestReview(${id})">Request Review <i class="fas fa-search"></i></div>
    <div class="btn btn-primary-soft mr-1 lift mb-md-6" id="refundBtn${id}" onclick="requestRefund(${id})"><i class="fas fa-undo-alt"></i> <i class="fas fa-dollar-sign"></i> Refund</div>
    <div class="btn btn-success-soft mr-1 lift mb-md-6" id="uploadDeedBtn${id}" onclick="uploadDeed(${id})">Upload Deed <i class="fas fa-file-upload"></i></div>
    <div class="btn btn-danger-soft mr-1 lift mb-md-6" id="cancelEscrowBtn${id}" onclick="cancelEscrow(${id})">Cancel <i class="fas fa-file-signature"></i></div>
    <div class="btn btn-primary-soft mr-1 lift mb-md-6" id="deedInfoBtn${id}" onclick="fetchDeedInfo(${id})">Deed <i class="fas fa-info"></i></div>
    <div id="userEscrowInfoDisplay"></div>
    `
  );

  if (user == buyer) {
    $(`#reviewRequestBtn${id}`).show();
    $(`#buyerVerifyBtn${id}`).show();
    $(`#refundBtn${id}`).show();
    $(`#uploadDeedBtn${id}`).hide();
  } else {
    $(`#reviewRequestBtn${id}`).hide();
    $(`#buyerVerifyBtn${id}`).hide();
    $(`#refundBtn${id}`).hide();
    $(`#uploadDeedBtn${id}`).show();
  }
}

// for individual escrow to get info
async function houseEscrowInfo(id) {
  let escrowInfo = await marketplaceInstance.methods.escrowInfo(id).call();
  showEscrowInfo(escrowInfo.tokenId, escrowInfo.seller, escrowInfo.buyer, escrowInfo.state, escrowInfo.amount, escrowInfo.timelock, escrowInfo.token);
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
      <thead><b>Escrow Info</b></thead>
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
  let deedDate = new Date(date * 1000).toUTCString();
  price = web3.utils.fromWei(price);

  if (token == ethAddress) {
    token = "ETH";
  } else if (token == daiAddress) {
    token = "DAI";
  } else if (token == usdcAddress) {
    token = "USDC";
  }

  $("#userEscrowInfoDisplay").append(
    `<table class="table">
      <thead><b>Deed Info</b></thead>
      <tbody>
        <tr>
          <td><b>Seller:</b> ${seller}</td>
          <td><b>Buyer:</b> ${buyer}</td>
        </tr>
        <tr>
          <td><b>Sale Price:</b> ${price} ${token}</td>  
          <td><b>Sale Date:</b> ${deedDate}</td>
        </tr>
        <tr>
          <td><b>Property ID</b> ${id}</td>
          <td><b>Deed Index:</b> ${index}</td>
        </tr>
        <tr>
          <td><b>Deed Hash</b> ${hash}</td>
        </tr>
      </tbody>
    </table>`
  );
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

  // append hash from bundle.js
  // $("#sellerDeedUploadInfoDisplay").append(
  //   `<input id="deed" type="file" name="deed" class="inputfile" />
  //   <label for="deed" id="deedLabel${id}">Upload Deed ${id}</label>
    
  //   <div id="deedFileName" s>
  //     <h5></h5>
  //     <button id="deedUpload" type="button" class="btn btn-dark" value="SUBMIT">Upload</button>
      
  //     <div id="ipfsDeedResult" class="mt-4" onclick="getHash()"></div>
  //     <div id="nextStep">
  //       <br>
  //       <p>Here is your deed transfer link, cryptographically protected on a decentralized network. 
  //         Save it for your records.</p>
  //       <p><b>What Happens Next?</b></p>
  //       <ul>
  //         <li>We'll notify the buyer right away, so they can inspect the document (please note they have 3 
  //           calendar days). If there are any issues, we'll be sure to let you know immediately.</li>
  //         <li>Once they confirm everything is in order or 3 days have passed, whichever comes first, the funds 
  //           will be automatically transfered into your wallet.</li>
  //         <li>Finally, we recommend you check with the land-registry in about 6-12 weeks to ensure that the buyer 
  //           has mailed the deed for recording and transfer is complete. If you discover that property is still in 
  //           your name, feel free to mail it on their behalf.</li>
  //       </ul>
        
  //       <p>Thanks for using Tsaishen Crypto. We sincerely hope that this was the fastest, cheapest, and
  //         simplest house selling process ever. <i>We secretly hope it was fun, too!</i> 
  //         If so, will you kindly leave us <a href="https://TRUSTPILOT REVIEW LINK" target="_blank" rel="noopener noreferrer" style="color: gray;">
  //           a raving review <i class="fas fa-external-link-alt"></i></a> ?
  //         If there were any issues, please <a href ="mailto:tsaishenco@gmail.com"> tell us </a>
  //         so that we can fix them.
  //       </p>
  //     </div>
  //   </div>`
  // );
  
  // getHash(id);
}

// async function getHash(id) {
//   let deed = ipfsDeedResult.innerHTML;
//   console.log(id);
//   console.log(deed);
//   goToPortfolio();
//   $("#escrowBuyerDisplay").append(
//     `<div class="btn btn-primary-soft mr-1 lift mb-md-6" id="ipfsDeedBtn${id}" onclick="">IPFS Deed ${deed} ${id}</div>`
//   );
//   let package = { deed: deed, id: id };
//   return package;
// }

// async function sellerCompleteSale(id) {
//   let uploadedDeed = await getHash(id);
//   console.log("uploadedDeed", uploadedDeed, "id", id);
//   // try {
//   //   let deed = await marketplaceInstance.methods.sellerComplete(id, uploadedDeed).send({ from: user }); 
//   //     console.log("uploadDeed", deed);
//   // }
//   // catch (err) {
//   //     console.log(err);
//   // }
// }

// async function deedUploaded(id) {
//   try {
//     let confirmed = await marketplaceInstance.methods.sellerComplete(id).send({ from: user });
//     console.log("review request hash", confirmed);
//     goToPortfolio();
//   }
//   catch (err) {
//     console.log(err);
//   }
// }

// let houseArray = await usersInstance.methods.getUserHomes(user).call();
//   for (i = 0; i < houseArray.length; i++) {
//     house = await houseTokenInstance.methods.getHouse(houseArray[i]).call();
//     let id = houseArray[i];
//     return (ipfsDeed, id);
//   }
  