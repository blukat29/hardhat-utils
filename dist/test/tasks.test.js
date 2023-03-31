"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
describe("tasks", function () {
    (0, helpers_1.useEnvironment)("hardhat-project");
    describe("accounts", function () {
        it("success", async function () {
            await this.hre.run("accounts");
            await this.hre.run("accounts", { from: 1, json: true });
        });
    });
    describe("addr", function () {
        it("success", async function () {
            await this.hre.run("addr", { name: 'Lock' });
        });
    });
});
//# sourceMappingURL=tasks.test.js.map