import { MessageLogged } from "../generated/MessageLog/MessageLog";
import { Message } from "../generated/schema";

export function handleMessageLogged(event: MessageLogged): void {
  const entity = new Message(event.transaction.hash.toHex() + "-" + event.logIndex.toString());

  entity.sender = event.params.sender;
  entity.message = event.params.message;
  entity.timestamp = event.params.timestamp;

  entity.save();
}
