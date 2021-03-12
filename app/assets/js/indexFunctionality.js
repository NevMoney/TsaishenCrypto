var saleId;
var salePrice;
var saleToken;

$(document).ready(async () => {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#upload-container").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();
});

$(".marketLink").on("click", function () {
    goToInventory();
});
  
$("#portfolioLink").on("click", function () {
    goToPortfolio();
});

$(".blockLink").on("click", function () {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#homePage").hide();
    $("#upload-container").hide();
    $("#portfolio").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();

    $("#marketLink").removeClass("active");
    $("#portfolioLink").removeClass("active");
    $("#homeLink").removeClass("active");

    $("#blockLink").addClass("active");    
    $("#upload-what").show();
});

$("#homeLink").on("click", function () {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#upload-container").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();

    $("#blockLink").removeClass("active");
    $("#marketLink").removeClass("active");
    $("#portfolioLink").removeClass("active");
    

    $("#homeLink").addClass("active");
    $("#homePage").show(); 
});

$(".uploadLinkBtn").on("click", function () {
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
});

$(".deedLinkBtn").on("click", function () {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();
    
    $("#deed-container").show();
});

$(".learnMoreBtn").on("click", function () {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#deed-container").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();

    $("#learnMore").show();
});

$("#pricingBtn").on("click", function () {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#deed-container").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();

    $("#learnMore").show();
});

$("#aboutLink").on("click", function () {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#deed-container").hide();
    $("#learnMore").hide();
    $("#escrowPage").hide();

    $("#aboutPage").show();    
});

$(".escrowLink").on("click", function () {
   $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#deed-container").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();

    $("#escrowPage").show();
});

// code to make the hamburger menu close when item selected
$(function () {
    var navBar = $("#navbarCollapse");
    navBar.on("click", "a", null, function () {
        navBar.collapse("hide");
    });
});

// code to close hamburger menu by clicking outside of it
$(document).click(function(e) {
    if (!$(e.target).is('a')) {
        $('.collapse').collapse('hide');        
    }
});

$("#watchWebinarBtn").on("click", function () {
    window.open("webinarPage.html");
});

// verify required form email is valid
$("#mce-EMAIL").on("input", function () {
    var input = $(this);
    var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    var is_email = re.test(input.val());
    if (is_email) {
        input.removeClass("invalid").addClass("valid");
    }
    else {
        input.removeClass("valid").addClass("invalid");
    }
});

// code to close jobModal and open Thank you!
$("#mc-embedded-subscribe").on("click", function (e) {
    var element = $("#mce-EMAIL");
    var valid = element.hasClass("valid");
    if (!valid) {
        $("#mce-error-response").show();
    }
    else {
        $("#jobModal").modal("toggle");
    }
});

$("#metamaskDownloadBtn").on("click", function () {
    window.open("https://metamask.io/");
});

// switch toggle on/off code
const chk = document.getElementById('customSwitch');

chk.addEventListener('change', () => {
    $("#income").toggle("visible");
});

function goToInventory() {
    $("#upload-container").hide();
    $("#deed-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();

    $("#blockLink").removeClass("active");
    $("#portfolioLink").removeClass("active");
    $("#homeLink").removeClass("active");
  
    $("#marketLink").addClass("active");
    $("#market-container").show();

    $("#houseDiv").empty();
    $("#houseDivSale").empty();
    $(".portfolioDisplay").empty();

    $("#tokenAlert").hide();
    $("#tokenAlert2").hide();

    getInventory();
}

function goToPortfolio() {
    $("#upload-container").hide();
    $("#market-container").hide();
    $("#homePage").hide();
    $("#deed-container").hide();
    $("#upload-what").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();

    $("#blockLink").removeClass("active");
    $("#marketLink").removeClass("active");
    $("#homeLink").removeClass("active");

    $("#portfolioLink").addClass("active");
    $("#portfolio").show();

    $("#houseDiv").empty();
    $("#houseDivSale").empty();
    $(".portfolioDisplay").empty();

    if (user === contractOwnerAddress) {
        $(".contractOwner").show();
    } else {
        $(".contractOwner").hide();
    }
    
    getHouses();
    fetchEscrowInfo();
    sellerEscrowInfo();
}

function certificationValidation() {
    if ($("#certification").prop("checked") == false){
      alert("WARNING: You have failed to certify ownership. Ownership certificaiton is shown to all. Please CANCEL upload, verify ownership, then proceed.");
    }
  }

$("#file").on("click", function () {
    certificationValidation();
});
    
function selectHouseForSale(id) {
    saleId = id;
}

$("#sellBtn").on("click", function () {
    sellCryptoHouse(saleId).then(() => {
        $("#sellHouseModal").modal("hide");
    });
});

function selectHouseToBuy(id, price, token) {
    saleId = id;
    console.log("selectHouse verification", id, price, token);
    salePrice = web3.utils.toWei(price.toString());
    saleToken = token;
    console.log("selectHouseToBuy", saleId, salePrice, saleToken);
    
    displayPurchase(saleId, salePrice, saleToken);
}

$("#purchaseBtn").on("click", function () {
    buyCryptoHouse(saleId, salePrice, saleToken).then(() => {
        $("#buyHouseModal").modal("hide");
    });
});

$("#escrowBuyBtn").on("click", function () {
    escrowBuy(saleId, salePrice, saleToken).then(() => {
        $("#buyHouseModal").modal("hide");
    });
});

function cancelSale(id) {
    saleId = id;
    removeOffer(id);
}

// for owner to get all users
$("#getAllUsersBtn").on("click", function () {
    $("#ownerCloseBtn").show();
    $("#userDisplayTable").empty();
    getAllTsaishenUsers();
});

// for owner to get all escrow info
$("#getEscrowInfoBtn").on("click", function () {
    $("#ownerCloseBtn").show();
    $("#escrowDisplayTable").empty();
    getEscrowInfo();
});

$("#addTokenBtn").on("click", function () {
    addNewToken().then(() => {
        $("#tokenInputModal").modal("hide");
    });
});

$("#removeTokenBtn").on("click", function () {
    removeTokens().then(() => {
        $("#tokenInputModal").modal("hide");
    });
});

$("#balanceBtn").on("click", function () {
    checkContractBalance(); 
});

$("#withdrawBtn").on("click", function () {
    withdrawFunds(); 
});

$("#pauseBtn").on("click", function () {
    pauseHouseTokenContract(); 
});

$("#unpauseBtn").on("click", function () {
    unPauseHouseTokenContract(); 
});

$("#mintBtn").on("click", function () {
    mintHouse(); 
});

$("#burnBtn").on("click", function () {
    burnHouseToken(); 
});

$("#updateUriBtn").on("click", function () {
    ownerUpdateUri(); 
});

$("#getDeedInfoBtn").on("click", function () {
    fetchDeedInfo();
});

$("#ownerCloseBtn").hide();

$("#ownerCloseBtn").on("click", function () {
    $("#balanceDisplay").hide();
    $("#escrowDisplayTable").hide()
    $("#ownerCloseBtn").hide();
    $("#userDisplayTable").hide();
});

// for individual house escrow info
$("#escrowInfoBtn").on("click", function () {
    houseEscrowInfo().then(() => {
        $("#escrowInfoModal").modal("show"); 
    });
});