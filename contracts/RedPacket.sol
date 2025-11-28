// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RedPacket {
    struct Packet {
        address sender;
        uint256 totalAmount;
        uint256 count;
        uint256 remaining;
    }

    event PacketSent(address indexed sender, uint256 amount, uint256 count);
    event GrabSuccess(address indexed user, uint256 amount);
    event GrabFailed(address indexed user, string reason);
    event PacketFinished();

    Packet public packet;
    uint256 public currentRound;
    uint256 private amountLeft;
    mapping(address => uint256) private lastClaimedRound;
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "REENTRANCY");
        locked = true;
        _;
        locked = false;
    }

    function sendRedPacket(uint256 totalAmount, uint256 count) external payable nonReentrant {
        require(count > 0, "COUNT_ZERO");
        require(totalAmount > 0, "AMOUNT_ZERO");
        require(msg.value == totalAmount, "VALUE_MISMATCH");
        require(packet.remaining == 0, "ACTIVE_PACKET");

        packet = Packet({sender: msg.sender, totalAmount: totalAmount, count: count, remaining: count});
        amountLeft = totalAmount;
        currentRound++;

        emit PacketSent(msg.sender, totalAmount, count);
    }

    function grab() external nonReentrant {
        if (packet.remaining == 0) {
            emit GrabFailed(msg.sender, unicode"红包已抢完");
            return;
        }

        if (lastClaimedRound[msg.sender] == currentRound) {
            emit GrabFailed(msg.sender, unicode"已经抢过");
            return;
        }

        if (amountLeft == 0) {
            emit GrabFailed(msg.sender, unicode"金额已分配完");
            return;
        }

        uint256 amount;
        if (packet.remaining == 1) {
            amount = amountLeft;
        } else {
            amount = packet.totalAmount / packet.count;
        }

        packet.remaining -= 1;
        amountLeft -= amount;
        lastClaimedRound[msg.sender] = currentRound;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "TRANSFER_FAILED");

        emit GrabSuccess(msg.sender, amount);

        if (packet.remaining == 0) {
            amountLeft = 0;
            emit PacketFinished();
        }
    }

    function claimed(address user) external view returns (bool) {
        return packet.remaining > 0 && lastClaimedRound[user] == currentRound;
    }

    function remaining() external view returns (uint256) {
        return packet.remaining;
    }
}
