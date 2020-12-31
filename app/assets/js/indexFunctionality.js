//Executed when page finish loading
$(document).ready(async () => {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#upload-container").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
  
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
$("#marketLink").click(() => {
    $("#upload-container").hide();
    $("#deed-container").hide();
    $("#home-container").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();

    $("#blockLink").removeClass("active");
    $("#portfolioLink").removeClass("active");
    $("#homeLink").removeClass("active");
  
    $("#marketLink").addClass("active");
    $("#market-container").show();
});
  
$("#portfolioLink").click(() => {
    $("#upload-container").hide();
    $("#market-container").hide();
    $("#home-container").hide();
    $("#deed-container").hide();
    $("#upload-what").hide();

    $("#blockLink").removeClass("active");
    $("#marketLink").removeClass("active");
    $("#homeLink").removeClass("active");

    $("#portfolioLink").addClass("active");
    $("#portfolio-container").show();
});

$("#blockLink").click(() => {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#home-container").hide();
    $("#upload-container").hide();
    $("#portfolio-container").hide();

    $("#marketLink").removeClass("active");
    $("#portfolioLink").removeClass("active");
    $("#homeLink").removeClass("active");

    $("#blockLink").addClass("active");    
    $("#upload-what").show();
});

$("#homeLink").click(() => {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#upload-container").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();

    $("#blockLink").removeClass("active");
    $("#marketLink").removeClass("active");
    $("#portfolioLink").removeClass("active");
    

    $("#homeLink").addClass("active");
    $("#home-container").show(); 
});

$("#uploadLinkBtn").click(() => {
    $("#market-container").hide();
    $("#deed-container").hide();
    $("#home-container").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();

    $("#upload-container").show();    
});

$("#deedLinkBtn").click(() => {
    $("#market-container").hide();
    $("#upload-container").hide();
    $("#home-container").hide();
    $("#upload-what").hide();
    $("#portfolio-container").hide();
    
    $("#deed-container").show();
});
