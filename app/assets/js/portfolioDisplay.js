function appendCryptoHouse(id, isMarketplace, price, owner) {
    houseBox(id, isMarketplace, price, owner);
    renderBlockchainHouse(id);
    $("#houseImport" + id).html();
}

// get url for the minted token/house
let BASE_URL = "https://gateway.ipfs.io/ipfs/";
let TOKEN_ENDPOINT = ipfsFileHash;
let urlToken = BASE_URL + TOKEN_ENDPOINT;

// function to get data from IPFS
function getHouseData() {
    fetch(urlToken).then(function (res) {
        res.json().then(function (data) {
            $("#portfolioDisplay").append(
                `<tr>
                    <th scope="row" class="notbold">House ID: ${id}</th>
                    <td><img width=200px src=${data[id].image}></td>
                    <td>Address: ${data[id].attributes.address}
                        <br>Beds: ${data[id].attributes.bedrooms}
                        &nbsp;/&nbsp; Baths: ${data[id].attributes.bathrooms}
                        <br>Year Built: ${data[id].attributes.yearBuilt}</td>
                    <td>House Size: ${data[id].attributes.houseSize}
                        &nbsp;/&nbsp; Lot Size: ${data[id].attributes.lotSize}
                        <br>Parcel Number: ${data[id].attributes.parcelNumber}
                        <br>Property Type: ${data[id].attributes.propertyType}</td>
                    <td>Additional Info: ${data[id].attributes.propertyLink}
                        <br>Video: ${data[id].attributes.videoLink}
                        <br>Value: ${data[id].attributes.marketValue}
                        &nbsp;/&nbsp; Income: ${data[id].attributes.currentIncome}</td>
                </tr>`
           )
        }); 
    });
    
}

function houseBox(id, isMarketplace, price, owner, token) {
    
    var houseDiv = `<div class="col-lg-3 houseBox m-5 light-b-shadow" id="portfolioDisplay${id}">

                        <div class="house" onclick="selectHouse(${id})">
                            <button class="btn btn-success" id="selectSaleBtn${id}" onclick="selectHouseForSale(${id})" data-toggle="modal" data-target="#sellHouseModal">Sell</button>
                        
                            <button class="btn btn-warning light-b-shadow" id="buyBtn${id}" onclick="selectHouseToBuy(${id})">Buy ${price, token}</button>
                            <button class="btn btn-warning light-b-shadow" id="buyEscrowBtn${id}" onclick="selectHouseToBuyWEscrow(${price, token})">Escrow Buy ${price}</button>
                            <button class="btn btn-danger" id="cancelBtn${id}" onclick="cancelSale(${id})">Cancel Sale</button>
                        </div >
                    </div>`


    if (!isMarketplace) {
        $("#houseDiv").append(houseDiv);
        $(`#buyBtn${id}`).hide();
        $(`#buyEscrowBtn${id}`).hide();
        $(`#cancelBtn${id}`).hide();
        $(`#selectSaleBtn${id}`).show();
    }
    else {
        $("#houseDivSale").append(houseDiv);
        $(`#selectSaleBtn${id}`).hide();

        if (owner === user) {
            $(`#buyBtn${id}`).hide();
            $(`#buyEscrowBtn${id}`).hide();
            $(`#cancelBtn${id}`).show();
        }
        else {
            $(`#buyBtn${id}`).show();
            $(`#buyEscrowBtn${id}`).show();
            $(`#cancelBtn${id}`).hide();
        }
    }
}

