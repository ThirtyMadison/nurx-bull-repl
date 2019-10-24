"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bull_1 = __importDefault(require("bull"));
const utils_1 = require("./utils");
let queue;
async function getQueue() {
    if (!queue) {
        return utils_1.throwYellow("Need connect before");
    }
    return await queue.isReady();
}
exports.getQueue = getQueue;
async function setQueue(...args) {
    if (args[0] instanceof bull_1.default) {
        queue = args[0];
    }
    else {
        const [name, url, options] = args;
        queue && (await queue.close());
        queue = bull_1.default(name, url, options);
        await queue.isReady();
    }
}
exports.setQueue = setQueue;
