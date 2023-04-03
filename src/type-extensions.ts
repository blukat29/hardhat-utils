import "@nomiclabs/hardhat-ethers/internal/type-extensions";
import "hardhat-deploy/dist/src/type-extensions";
import {HardhatRuntimeEnvironment} from "hardhat/types";
declare global {
  var hre: HardhatRuntimeEnvironment;
}
