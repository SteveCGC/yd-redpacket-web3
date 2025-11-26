// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MessageLog {
    event MessageLogged(address indexed sender, string message, uint256 timestamp);

    function store(string calldata text) external {
        emit MessageLogged(msg.sender, text, block.timestamp);
    }
}
