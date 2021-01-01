//Executed when page finish loading
$(document).ready(async () => {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#upload-container").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
    $("#learnMore").hide();
  
    // this allows the website to use the metamask account
    const accounts = await ethereum.enable();
  
    web3 = new Web3(ethereum);
  
    toWei = (amount) => web3.utils.toWei(String(amount));
    fromWei = (amount) => Number(web3.utils.fromWei(amount)).toFixed(4);
  
    ethereum.on("accountsChanged", (_accounts) => {
      console.log("Account Changed!", accounts[0]);
      user = web3.utils.toChecksumAddress(_accounts[0]);
    });
  
    // User will be the first item in the accounts array
    user = web3.utils.toChecksumAddress(accounts[0]);
  });

// Navigation
$(".marketLink").on("click", function () {
    $("#upload-container").hide();
    $("#deed-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
    $("#learnMore").hide();

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

    $("#upload-container").show();    
});

$(".deedLinkBtn").on("click", function () {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
    $("#learnMore").hide();
    
    $("#deed-container").show();
});

$(".learnMoreBtn").on("click", function () {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
    $("#deed-container").hide();

    $("#learnMore").show();
});

$("#pricingBtn").on("click", function () {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#homePage").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
    $("#deed-container").hide();

    $("#learnMore").show();
});

