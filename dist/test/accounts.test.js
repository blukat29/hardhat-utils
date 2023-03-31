"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
describe("task accounts", function () {
    helpers_1.useEnvironment("hardhat-project");
    it("success", async function () {
        //await this.hre.run("accounts")
        //await this.hre.run("accounts", { from: 1, json: true })
        await this.hre.run("addr", { name: 'Lock' });
    });
});
//# sourceMappingURL=accounts.test.js.map