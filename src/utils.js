"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const searchjs_1 = require("searchjs");
const chalk_1 = __importDefault(require("chalk"));
const ms_1 = __importDefault(require("ms"));
const terminal_link_1 = __importDefault(require("terminal-link"));
const queue_1 = require("./queue");
exports.getJob = async (jobId) => {
    const queue = await queue_1.getQueue();
    const job = await queue.getJob(jobId);
    if (!job) {
        return exports.throwYellow(`Job "${jobId}" not found`);
    }
    return job;
};
exports.showJobs = (arr, filter) => {
    const jobs = arr;
    const data = jobs
        .filter(j => j)
        .map(job => ({
        id: job.id,
        data: job.data,
        time: Number.isNaN(job.timestamp)
            ? job.timestamp
            : new Date(job.timestamp),
        name: job.name,
        failedReason: job.failedReason,
        stackTrace: job.stacktrace,
        returnValue: job.returnvalue,
        attemptsMade: job.attemptsMade,
        delay: job.delay,
        progress: job._progress
    }));
    const filteredData = searchjs_1.matchArray(data, filter);
    exports.logArray(filteredData);
};
exports.getFilter = (filter) => {
    return new Promise(resolve => {
        try {
            resolve(JSON.parse(filter || "{}"));
        }
        catch (e) {
            exports.throwYellow(`Error occured, seems passed "filter" incorrect json`);
        }
    });
};
exports.getTimeAgoFilter = (timeAgo) => {
    return new Promise(resolve => {
        try {
            const msAgo = timeAgo && timeAgo.length ? ms_1.default(timeAgo) : void 0;
            const filter = msAgo ? { time: { gte: Date.now() - msAgo } } : {};
            resolve(filter);
        }
        catch (e) {
            exports.throwYellow(`Error occured, seems passed "timeAgo" incorrect`);
        }
    });
};
exports.logArray = (arr) => {
    console.dir(arr, {
        colors: true,
        depth: null,
        maxArrayLength: Infinity
    });
};
exports.searchjsLink = terminal_link_1.default("searchjs", "https://github.com/deitch/searchjs#examples");
exports.msLink = terminal_link_1.default("ms", "https://github.com/zeit/ms#examples");
exports.answer = async (vorpal, question) => {
    const answer = (await vorpal.activeCommand.prompt({
        name: "a",
        message: `${question}? (y/n): `
    }));
    if (answer.a !== "y") {
        exports.throwYellow("You cancel action");
    }
};
exports.logGreen = (msg) => {
    console.log(chalk_1.default.green(msg));
};
exports.logYellow = (msg) => {
    console.log(chalk_1.default.yellow(msg));
};
exports.throwYellow = (msg) => {
    let err = new Error();
    err.yellow = true;
    err.stack = chalk_1.default.yellow(msg);
    throw err;
};
async function splitJobsByFound(jobIds) {
    const queue = await queue_1.getQueue();
    const jobs = await Promise.all(jobIds.map(id => queue.getJob(id)));
    let notFoundIds = [];
    let foundJobs = [];
    let i = 0;
    for (const jobId of jobIds) {
        const job = jobs[i];
        if (job) {
            foundJobs.push(job);
        }
        else {
            notFoundIds.push(jobId);
        }
        i++;
    }
    return { notFoundIds, foundJobs };
}
exports.splitJobsByFound = splitJobsByFound;
function wrapTryCatch(fn) {
    return async function (args) {
        try {
            return await fn.call(this, args);
        }
        catch (e) {
            if (e.yellow) {
                throw e;
            }
            return exports.throwYellow(e.message);
        }
    };
}
exports.wrapTryCatch = wrapTryCatch;
