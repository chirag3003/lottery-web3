// contract test code will go here
const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { abi, evm } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(abi)
        .deploy({ data: evm.bytecode.object })
        .send({ from: accounts[0], gas: 1000000 });
});

describe("Lottery Contrac", () => {
    it("deploys a contract", async () => {
        assert.ok(lottery.options.address);
    });

    it("Entering a lottery", async () => {
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei("0.2", "ether"),
            gas: 1000000,
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei("0.2", "ether"),
            gas: 1000000,
        });
        const players = await lottery.methods.getPlayers().call({ from: accounts[0] });

        assert.equal(accounts[1], players[0]);
        assert.equal(accounts[2], players[1]);
        assert.equal(players.length, 2);
    });

    it("Requires a minimum amount of ether to enter", async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[1],
                gas: 1000000,
                value: 200,
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it("only manager can call pick winner", async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1],
                gas: 10000000,
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it("sends money to the winner", async () => {
        await lottery.methods
            .enter()
            .send({ from: accounts[3], value: web3.utils.toWei("2", "ether") });
        const initialBalance = await web3.eth.getBalance(accounts[3]);
        await lottery.methods.pickWinner().send({
            from: accounts[0],
        });
        const finalBalance = await web3.eth.getBalance(accounts[3]);
        const difference = finalBalance - initialBalance;

        assert(difference > web3.utils.toWei("1.9", "ether"));
    });
});
