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
  
// for seller to confirm delivery (if this failes to automatically run when deed is uploaded
// I may need to add a button)
  async function deedUploaded(id) {
    try {
      let confirmed = await marketplaceInstance.methods.sellerComplete(id).send({ from: user });
      console.log("review request hash", confirmed);
      goToPortfolio();
    }
    catch (err) {
      console.log(err);
    }
  }