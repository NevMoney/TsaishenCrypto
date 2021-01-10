function appendCryptoHouse(id, isMarketplace, price, owner) {
    houseBox(id, isMarketplace, price, owner);
    renderBlockchainHouse(id);
    $("#houseImport" + id).html();
}

function houseBox(id, isMarketplace, price, owner) {
    var houseDiv = `<div class="col-lg-3 houseBox m-5 light-b-shadow" id="portfolioDisplay${id}">
                        <div class="house" onclick="selectHouse(${id})">
                            <button class="btn btn-success" id="selectSaleBtn${id}" onclick="selectHouseForSale(${id})" data-toggle="modal" data-target="#sellHouseModal">Sell</button>
                        
                            <button class="btn btn-warning light-b-shadow" id="buyWithETH${id}" onclick="selectHouseToBuy(${id})">Buy ETH ${price}</button>
                            <button class="btn btn-warning light-b-shadow" id="buyWithETHEscrow${id}" onclick="selectHouseToBuy(${id})">Escrow Buy ETH ${price}</button>
                            <button class="btn btn-warning light-b-shadow" id="buyWithUSDC${id}" onclick="selectHouseToBuy(${id})">Buy USDC ${price}</button>
                            <button class="btn btn-warning light-b-shadow" id="buyWithUSDCEscrow${id}" onclick="selectHouseToBuy(${id})">Escrow Buy USDC ${price}</button>
                            <button class="btn btn-danger" id="cancelBtn${id}" onclick="cancelSale(${id})">Cancel Sale</button>
                    </div >
                    </div>`


    if (!isMarketplace) {
        $("#houseDiv").append(houseDiv);
        $(`#buyBtn${id}`).hide();
        $(`#cancelBtn${id}`).hide();
        $(`#selectSaleBtn${id}`).show();
    }
    else {
        $("#houseDivSale").append(houseDiv);
        $(`#selectSaleBtn${id}`).hide();

        if (owner === user) {
            $(`#buyBtn${id}`).hide();
            $(`#cancelBtn${id}`).show();
        }
        else {
            $(`#buyBtn${id}`).show();
            $(`#cancelBtn${id}`).hide();
        }
    }
}

