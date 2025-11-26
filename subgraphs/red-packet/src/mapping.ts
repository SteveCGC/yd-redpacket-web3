import {
  GrabFailed as GrabFailedEvent,
  GrabSuccess as GrabSuccessEvent,
  PacketFinished as PacketFinishedEvent,
  PacketSent as PacketSentEvent
} from "../generated/RedPacket/RedPacket";
import { GrabFailed, GrabSuccess, PacketFinished, PacketSent } from "../generated/schema";

function eventId(txHash: string, logIndex: string): string {
  return txHash + "-" + logIndex;
}

export function handlePacketSent(event: PacketSentEvent): void {
  const entity = new PacketSent(eventId(event.transaction.hash.toHex(), event.logIndex.toString()));

  entity.sender = event.params.sender;
  entity.amount = event.params.amount;
  entity.count = event.params.count;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;

  entity.save();
}

export function handleGrabSuccess(event: GrabSuccessEvent): void {
  const entity = new GrabSuccess(eventId(event.transaction.hash.toHex(), event.logIndex.toString()));

  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;

  entity.save();
}

export function handleGrabFailed(event: GrabFailedEvent): void {
  const entity = new GrabFailed(eventId(event.transaction.hash.toHex(), event.logIndex.toString()));

  entity.user = event.params.user;
  entity.reason = event.params.reason;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;

  entity.save();
}

export function handlePacketFinished(event: PacketFinishedEvent): void {
  const entity = new PacketFinished(eventId(event.transaction.hash.toHex(), event.logIndex.toString()));

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;

  entity.save();
}
