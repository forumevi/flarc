// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../FlareLaunchpad.sol";

contract DeployFlareLaunchpad is Script {
    // Arc Mainnet USDC (ERC-20)
    address constant USDC = 0x3600000000000000000000000000000000000000;
    // Fee recipient — your wallet
    address constant FEE_RECIPIENT = 0x95773C1f40B82DD8D0529471f6A6016fdfE990Aa;

    function run() external {
        vm.startBroadcast();

        FlareLaunchpad launchpad = new FlareLaunchpad(USDC, FEE_RECIPIENT);

        console.log("FlareLaunchpad deployed at:", address(launchpad));
        console.log("USDC:", USDC);
        console.log("Fee recipient:", FEE_RECIPIENT);

        vm.stopBroadcast();
    }
}
