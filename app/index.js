// running non-refresh is preventing connect blockchain button
// ethereum.autoRefreshOnNetworkChange = false;

var houseTokenInstance;
var marketplaceInstance;
var usersInstance;

var tsaishenUsersAddress = "0x7F25b0104c864118B2f5B12c390756DF4F9d8b0F";
var houseTokenAddress = "0x4330ca56Ee9a7675EFcAaD82932B4cd15A6d7976";
var marketplaceAddress = "0xc333468B5b6dEb333cd9d6E66655E454A813eAf9";
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

  ethereum.on("accountsChanged", (_accounts) => {
    console.log("Account Changed!", accounts[0]);
    user = web3.utils.toChecksumAddress(_accounts[0]);
  });

  // User will be the first item in the accounts array
  user = web3.utils.toChecksumAddress(accounts[0]);

  usersInstance = await new web3.eth.Contract(abi.TsaishenUsers, tsaishenUsersAddress, { from: user });
  houseTokenInstance = await new web3.eth.Contract(abi.HouseToken, houseTokenAddress, { from: creatorAddress });
  marketplaceInstance = await new web3.eth.Contract(abi.Marketplace, marketplaceAddress, { from: address[1] });

  console.log("users ", usersInstance);
  console.log("house ", houseTokenInstance);
  console.log("marketplace ", marketplaceInstance);

  // we'll put events here for notifications
});

function uploadHouse() {
  var value = 
}