# hardhat-utils

[Hardhat](https://hardhat.org) utility tasks.

## Installation

```bash
npm install @klaytn/hardhat-utils
```

Import the plugin in your `hardhat.config.js`:

```js
require("@klaytn/hardhat-utils");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "@klaytn/hardhat-utils";
```

## Required plugins

This plugin is dependent on other plugins. Make sure to require or import them in your `hardhat.config.js`.

- [@nomiclabs/hardhat-ethers](https://www.npmjs.com/package/@nomiclabs/hardhat-ethers)
- [hardhat-deploy](https://www.npmjs.com/package/hardhat-deploy)

## Tasks

TBD

## Configuration

TBD

## Usage

```sh
# Show addresses and balances of loaded accounts
hh accounts
hh accounts --from 2 --json

# Get address from deployments
hh addr Counter

# Call contract function
hh call Counter number              # load address from deployments
hh call Counter number --to 0xaddr  # call designated address

# Send transaction to contract
hh send Counter setNumber 123              # load address from deployments
hh send Counter setNumber 123 --to 0xaddr  # call designated address
hh send Counter setNumber 123 --from 0xaddr --unsigned  # print unsigned tx
```
