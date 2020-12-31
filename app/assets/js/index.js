const { document } = require("globalthis/implementation");
const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

let buffer;
let ipfsHash;

//Executed when page finish loading
$(document).ready(async () => {
  $("#read-container").hide();

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

const hashFile = (file) => {
  console.log(file);
  console.log(file.name);
  $("#fileUpload").hide(file.name);
  $("#fileName").show();
  $("#fileName>h4").html(`File Name: ${file.name}`);

  var reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onloadend = () => {
    buffer = Buffer(reader.result);
    console.log(buffer);
    const hash = window.web3.utils.sha3(buffer);
    console.log("hash", hash);
  };
};

const addToIpfs = async () => {
  console.log("adding to IPFS...");
  $("#upload").html("Uploading");

  const added = await ipfs.add(buffer, {
    progress: (prog) => console.log(`received: ${prog}`),
  });

  $("#upload").hide();

  ipfsHash = added.cid.toString();

  const ipfsLink =
    "<a target='_blank' rel='noopener noreferrer' href='https://gateway.ipfs.io/ipfs/" +
    ipfsHash +
    "'>" +
    ipfsHash +
    "</a>";
  $("#ipfsResult").html(ipfsLink);
};

const showModal = (title, content) => {
  const modal = `
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title font-weight-bold">${title}</h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>
              ${content}
            </p>
          </div>         
        </div>
      </div>
    `;

  $("#myModal").html(modal).modal("show");
};

$("#file").change((e) => {
  console.log(e.target.files[0]);
  hashFile(e.target.files[0]);
});

$("#upload").click(() => addToIpfs());

// Navigation
$("#readLink").click(() => {
  $("#upload-container").hide();
  $("#uploadLink").removeClass("active");

  $("#readLink").addClass("active");
  $("#read-container").show();
});

$("#uploadLink").click(() => {
  $("#read-container").hide();
  $("#readLink").removeClass("active");

  $("#uploadLink").addClass("active");
  $("#upload-container").show();
});

// function validateCheckbox(){
//   var checkbox = $("#checkbox");
//   if(checkbox.checked == false){
//     alert("You must certify you own the property.");
//     return false;
//   }
// };