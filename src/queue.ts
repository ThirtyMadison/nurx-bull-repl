import Queue, { Queue as TQueue, QueueOptions } from "bull";
import { throwYellow } from "./utils";

let queue: TQueue | void;

export async function getQueue() {
  if (!queue) {
    return throwYellow("Need connect before");
  }
  return await queue.isReady();
}

export async function setQueue(
  name: string,
  url: string,
  options: QueueOptions
): void;
export async function setQueue(queue: Queue): void;
export async function setQueue(...args: any[]): void {
  if (args[0] instanceof Queue) {
    queue = args[0];
  } else {
    const [name, url, options] = args;

    queue && (await queue.close());
    queue = Queue(name, url, options);
    await queue.isReady();
  }
}

