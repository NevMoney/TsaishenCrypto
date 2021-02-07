function appendCryptoHouse(houseId, isMarketplace, price, owner) {
    houseBox(houseId, isMarketplace, price, owner);
    renderBlockchainHouse(houseId);
    $("#houseImport" + houseId).html();
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
                    <th scope="row" class="notbold">House ID: ${houseId}</th>
                    <td><img width=200px src=${data[houseId].image}></td>
                    <td>Address: ${data[houseId].attributes.address}
                        <br>Beds: ${data[houseId].attributes.bedrooms}
                        &nbsp;/&nbsp; Baths: ${data[houseId].attributes.bathrooms}
                        <br>Year Built: ${data[houseId].attributes.yearBuilt}</td>
                    <td>House Size: ${data[houseId].attributes.houseSize}
                        &nbsp;/&nbsp; Lot Size: ${data[houseId].attributes.lotSize}
                        <br>Parcel Number: ${data[houseId].attributes.parcelNumber}
                        <br>Property Type: ${data[houseId].attributes.propertyType}</td>
                    <td>Additional Info: ${data[houseId].attributes.propertyLink}
                        <br>Video: ${data[houseId].attributes.videoLink}
                        <br>Value: ${data[houseId].attributes.marketValue}
                        &nbsp;/&nbsp; Income: ${data[houseId].attributes.currentIncome}</td>
                </tr>`
           )
        }); 
    });
    
}

function houseBox(houseId, isMarketplace, price, owner, token) {
    
    var houseDiv = `<div class="col-lg-3 houseBox m-5 light-b-shadow" id="portfolioDisplay${houseId}">

                        <div class="house" onclick="selectHouse(${houseId})">
                            <button class="btn btn-success" id="selectSaleBtn${houseId}" onclick="selectHouseForSale(${houseId})" data-toggle="modal" data-target="#sellHouseModal">Sell</button>
                        
                            <button class="btn btn-warning light-b-shadow" id="buyBtn${houseId}" onclick="selectHouseToBuy(${houseId})">Buy ${price, token}</button>
                            <button class="btn btn-warning light-b-shadow" id="buyEscrowBtn${houseId}" onclick="selectHouseToBuyWEscrow(${price, token})">Escrow Buy ${price}</button>
                            <button class="btn btn-danger" id="cancelBtn${houseId}" onclick="cancelSale(${houseId})">Cancel Sale</button>
                        </div >
                    </div>`


    if (!isMarketplace) {
        $("#houseDiv").append(houseDiv);
        $(`#buyBtn${houseId}`).hide();
        $(`#buyEscrowBtn${houseId}`).hide();
        $(`#cancelBtn${houseId}`).hide();
        $(`#selectSaleBtn${houseId}`).show();
    }
    else {
        $("#houseDivSale").append(houseDiv);
        $(`#selectSaleBtn${houseId}`).hide();

        if (owner === user) {
            $(`#buyBtn${houseId}`).hide();
            $(`#buyEscrowBtn${houseId}`).hide();
            $(`#cancelBtn${houseId}`).show();
        }
        else {
            $(`#buyBtn${houseId}`).show();
            $(`#buyEscrowBtn${houseId}`).show();
            $(`#cancelBtn${houseId}`).hide();
        }
    }
}

