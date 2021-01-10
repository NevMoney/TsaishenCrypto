$(document).ready(async () => {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#upload-container").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();
});  

$(".marketLink").on("click", function () {
    $("#upload-container").hide();
    $("#deed-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();

    $("#blockLink").removeClass("active");
    $("#portfolioLink").removeClass("active");
    $("#homeLink").removeClass("active");
  
    $("#marketLink").addClass("active");
    $("#market-container").show();
});
  
$("#portfolioLink").on("click", function () {
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
    $("#portfolio-container").show();
});

$(".blockLink").on("click", function () {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#homePage").hide();
    $("#upload-container").hide();
    $("#portfolio-container").hide();
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
    $("#portfolio-container").hide();
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
    $("#portfolio-container").hide();
    $("#learnMore").hide();
    $("#aboutPage").hide();
    $("#escrowPage").hide();
    $("#houseUploadedMsg").hide();

    $("#upload-container").show();    
});

$(".deedLinkBtn").on("click", function () {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
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
    $("#portfolio-container").hide();
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
    $("#portfolio-container").hide();
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
    $("#portfolio-container").hide();
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
    $("#portfolio-container").hide();
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

$("#upload").on("click", function () {
    uploadHouse();
});

// FOR TESTING ONLY DELETE
$("#testing").on("click", function () {
    uploadHouse();
});

function goToInventory() {
    $("#upload-container").hide();
    $("#deed-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
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

    getInventory();
}

//NOT WORKING!!!
function validateCheckbox(){
    if($("#certification").checked){
        return true;
    }
    return false;
}

var saleId;
var salePrice;
    
function selectHouseForSale(id) {
    saleId = id;
}

$("#sellBtn").on("click", function () {
    sellHouse(saleId).then(() => {
        $("#sellHouseModal").modal("hide");
    });
});

function selectHouseToBuyWEth(id) {
    saleId = id;
    checkOffer(saleId).then((offer) => {
        salePrice = offer.price;
        buyHomeInETH(saleId, salePrice);
    });
}

function selectHouseToBuyWUsdc(id) {
    saleId = id;
    checkOffer(saleId).then((offer) => {
        salePrice = offer.price;
        buyHomeInUDSC(saleId, salePrice);
    });
}

function cancelSale(id) {
    saleId = id;
    removeOffer(id);
}