// running non-refresh is preventing connect blockchain button
// ethereum.autoRefreshOnNetworkChange = false;

var houseTokenInstance;
var marketplaceInstance;
var usersInstance;
// var houseTokenAddress = "";
// var tsaishenUsersAddress = "0x...";
// var marketplaceAddress = "0x...";

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

  usersInstance = await new web3.eth.Contract(abi, contractAddress, {from: user})

  console.log(usersInstance);
});