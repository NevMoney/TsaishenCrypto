const Marketplace = artifacts.require("Marketplace");

//this contract is dependent on the houseToken --> perhaps one test or deploy houseToken here as well? 

contract("Marketplace", (owner) => {
    let token;
    let contract;

    beforeEach(async() => {
        this.Marketplace = await Marketplace.new();
        console.log(Marketplace.address);
    });

    it("Should make first account an owner of Marketplace", async() => {
        let owner = await Marketplace.owner();
        assert.equal(owner, accounts[0], "incorrect owner account");
    });
    
    it("Returns correct balances after transfer", async() => {
        let x = await this.Marketplace.enableTransfer();
        token = await this.Marketplace.
        let y = await this.Marketplace.transfer(accounts[1], )
        assert.equal(x, "incorrect name");
    });

});