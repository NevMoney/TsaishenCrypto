const Marketplace = artifacts.require("Marketplace");

contract("Marketplace", ([creator, randomAdd]) => {
    let name = "Tsaishen Real Estate";
    let symbol = "HOUS";
    let decimals = 18;
    let uri = "https://ipfs.daonomic.com/ipfs/";

    beforeEach(async() => {
        this.Marketplace = await Marketplace.new(name, symbol, decimals, uri);
        console.log(Marketplace.address);
    });

    describe("Token::Deployment", () => {
        it("Correct Name", async() => {
            let x = await this.HouseToken.name();
            assert.equal(x, name, "incorrect name");
        });

        it("Correct Symbol", async() => {
            let x = await this.HouseToken.symbol();
            assert.equal(x, symbol, "incorrect symbol");
        });

        it("Correct Decimals", async() => {
            let x = await this.HouseToken.decimals();
            assert.equal(x.toNumber(), decimals, "incorrect decimals");
        });

        it("Correct URI", async() => {
            let x = await this.HouseToken.uri();
            assert.equal(x, uri, "incorrect uri");
        });
    
        it("Should make first account an owner of HouseToken", async() => {
            let owner = await HouseToken.owner();
            assert.equal(owner, accounts[0], "incorrect owner account");
        });
    });

    describe("Token::Minting", () => {
        it("Creates a new token", async() => {
            let result = await HouseToken.mint("firstHouse");
            let creatorBalance = await this.HouseToken.balanceOf(creator);
            let totalSupply = await this.HouseToken.totalSupply();
            assert.equal(totalSupply, 1, "incorrect total supply");
            console.log(result);
            assert.equal(creatorBalance, 1, "incorrect creator balance");
        });

        it("Emits when token is minted", async() => {
            let event = result.logs[0].args;
            assert.equal(event.tokenId.toNumber(), 0, "token id is incorrect");
            assert.equal(event.from, "0x0000000000000000000000000000000000000000", "creation account is incorrect");
            assert.equal(event.to, accounts[0], "to account is incorrect");
        });            
    });
});