import { assert } from "chai";

import { useEnvironment } from "./helpers";

describe("task accounts", function() {
  useEnvironment("hardhat-project");
  it("success", async function() {
    await this.hre.run("accounts")
    await this.hre.run("accounts", { from: 1, json: true })
  });
});
