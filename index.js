#!/usr/bin/env node
"use strict";
/// <reference types="./typing" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vorpal_1 = __importDefault(require("vorpal"));
const ms_1 = __importDefault(require("ms"));
const utils_1 = require("./src/utils");
const queue_1 = require("./src/queue");
exports.vorpal = new vorpal_1.default();
exports.vorpal
    .command("connect <queue>", "connect to bull queue")
    .option("-p, --prefix <prefix>", "prefix to use for all queue jobs")
    .option("-r, --redis <redis>", "redis url in format: redis://[:password@]host[:port][/db-number][?option=value]; default redis://localhost:6379")
    .action(utils_1.wrapTryCatch(async ({ queue: name, options }) => {
    const url = options.redis
        ? `redis://${options.redis.replace(/^redis:\/\//, "")}`
        : "redis://localhost:6379";
    const prefix = options.prefix || "bull";
    await queue_1.setQueue(name, url, { prefix });
    utils_1.logGreen(`Connected to ${url}, prefix: ${prefix}, queue: ${name}`);
    exports.vorpal.delimiter(`BULL-REPL | ${prefix}.${name}> `).show();
}));
exports.vorpal.command("stats", "count of jobs by groups").action(utils_1.wrapTryCatch(async () => {
    const queue = await queue_1.getQueue();
    const [counts, paused] = await Promise.all([
        queue.getJobCounts(),
        queue.getPausedCount()
    ]);
    console.table({ ...counts, ...{ paused } });
}));
exports.vorpal
    .command("active", "fetch active jobs")
    .option("-f, --filter <filter>", `filter jobs via ${utils_1.searchjsLink}`)
    .option("-ta, --timeAgo <timeAgo>", `get jobs since time ago via ${utils_1.msLink}`)
    .action(utils_1.wrapTryCatch(async ({ options }) => {
    const queue = await queue_1.getQueue();
    const filter = await utils_1.getFilter(options.filter);
    const timeAgoFilter = await utils_1.getTimeAgoFilter(options.timeAgo);
    utils_1.showJobs(await queue.getActive(), { ...filter, ...timeAgoFilter });
}));
exports.vorpal
    .command("waiting", "fetch waiting jobs")
    .option("-f, --filter <filter>", `filter jobs via ${utils_1.searchjsLink}`)
    .option("-ta, --timeAgo <timeAgo>", `get jobs since time ago via ${utils_1.msLink}`)
    .action(utils_1.wrapTryCatch(async ({ options }) => {
    const queue = await queue_1.getQueue();
    const filter = await utils_1.getFilter(options.filter);
    const timeAgoFilter = await utils_1.getTimeAgoFilter(options.timeAgo);
    utils_1.showJobs(await queue.getWaiting(), { ...filter, ...timeAgoFilter });
}));
exports.vorpal
    .command("completed", "fetch completed jobs")
    .option("-f, --filter <filter>", `filter jobs via ${utils_1.searchjsLink}`)
    .option("-ta, --timeAgo <timeAgo>", `get jobs since time ago via ${utils_1.msLink}`)
    .action(utils_1.wrapTryCatch(async ({ options }) => {
    const queue = await queue_1.getQueue();
    const filter = await utils_1.getFilter(options.filter);
    const timeAgoFilter = await utils_1.getTimeAgoFilter(options.timeAgo);
    utils_1.showJobs(await queue.getCompleted(), { ...filter, ...timeAgoFilter });
}));
exports.vorpal
    .command("failed", "fetch failed jobs")
    .option("-f, --filter <filter>", `filter jobs via ${utils_1.searchjsLink}`)
    .option("-ta, --timeAgo <timeAgo>", `get jobs since time ago via ${utils_1.msLink}`)
    .action(utils_1.wrapTryCatch(async ({ options }) => {
    const queue = await queue_1.getQueue();
    const filter = await utils_1.getFilter(options.filter);
    const timeAgoFilter = await utils_1.getTimeAgoFilter(options.timeAgo);
    utils_1.showJobs(await queue.getFailed(), { ...filter, ...timeAgoFilter });
}));
exports.vorpal
    .command("delayed", "fetch delayed jobs")
    .option("-f, --filter <filter>", `filter jobs via ${utils_1.searchjsLink}`)
    .option("-ta, --timeAgo <timeAgo>", `get jobs since time ago via ${utils_1.msLink}`)
    .action(utils_1.wrapTryCatch(async ({ options }) => {
    const queue = await queue_1.getQueue();
    const filter = await utils_1.getFilter(options.filter);
    const timeAgoFilter = await utils_1.getTimeAgoFilter(options.timeAgo);
    utils_1.showJobs(await queue.getDelayed(), { ...filter, ...timeAgoFilter });
}));
exports.vorpal.command("pause", "pause current queue").action(utils_1.wrapTryCatch(async () => {
    const queue = await queue_1.getQueue();
    await utils_1.answer(exports.vorpal, "Pause queue");
    await queue.pause(false);
    utils_1.logGreen(`Queue paused`);
}));
exports.vorpal.command("resume", "resume current queue from pause").action(utils_1.wrapTryCatch(async () => {
    const queue = await queue_1.getQueue();
    await utils_1.answer(exports.vorpal, "Resume queue");
    await queue.resume(false);
    utils_1.logGreen(`Queue resumed from pause`);
}));
exports.vorpal.command("get <jobId...>", "get job").action(utils_1.wrapTryCatch(async ({ jobId }) => {
    const { notFoundIds, foundJobs } = await utils_1.splitJobsByFound(jobId);
    notFoundIds.length && utils_1.logYellow(`Not found jobs: ${notFoundIds}`);
    foundJobs.length && utils_1.showJobs(foundJobs, {});
}));
exports.vorpal
    .command("add <data>", "add job to queue")
    .option("-n, --name <name>", "name for named job")
    .action(utils_1.wrapTryCatch(async function ({ data, options }) {
    const queue = await queue_1.getQueue();
    let jobData;
    try {
        jobData = JSON.parse(data);
    }
    catch (e) {
        return utils_1.throwYellow(`Error occured, seems "data" incorrect json`);
    }
    await utils_1.answer(exports.vorpal, "Add");
    const jobName = options.name || "__default__";
    const addedJob = await queue.add(jobName, jobData);
    utils_1.logGreen(`Job with name '${jobName}', id '${addedJob.id}' added`);
}));
exports.vorpal.command("rm <jobId...>", "remove job").action(utils_1.wrapTryCatch(async function ({ jobId }) {
    await utils_1.answer(exports.vorpal, "Remove");
    const { notFoundIds, foundJobs } = await utils_1.splitJobsByFound(jobId);
    await Promise.all(foundJobs.map(j => j.remove()));
    notFoundIds.length && utils_1.logYellow(`Not found jobs: ${notFoundIds}`);
    foundJobs.length && utils_1.logGreen(`Jobs "${foundJobs.map(j => j.id)}" removed`);
}));
exports.vorpal.command("retry <jobId...>", "retry job").action(utils_1.wrapTryCatch(async function ({ jobId }) {
    await utils_1.answer(exports.vorpal, "Retry");
    const { notFoundIds, foundJobs } = await utils_1.splitJobsByFound(jobId);
    await Promise.all(foundJobs.map(j => j.retry()));
    notFoundIds.length && utils_1.logYellow(`Not found jobs: ${notFoundIds}`);
    foundJobs.length && utils_1.logGreen(`Jobs "${foundJobs.map(j => j.id)}" retried`);
}));
exports.vorpal.command("retry-failed", "retry all failed jobs").action(utils_1.wrapTryCatch(async function () {
    const queue = await queue_1.getQueue();
    await utils_1.answer(exports.vorpal, "Retry failed jobs");
    const failedJobs = await queue.getFailed();
    await Promise.all(failedJobs.map(j => j.retry()));
    utils_1.logGreen('All failed jobs retried');
}));
exports.vorpal.command("promote <jobId...>", "promote job").action(utils_1.wrapTryCatch(async function ({ jobId }) {
    await utils_1.answer(exports.vorpal, "Promote");
    const { notFoundIds, foundJobs } = await utils_1.splitJobsByFound(jobId);
    await Promise.all(foundJobs.map(j => j.promote()));
    notFoundIds.length && utils_1.logYellow(`Not found jobs: ${notFoundIds}`);
    foundJobs.length && utils_1.logGreen(`Jobs "${foundJobs.map(j => j.id)}" promoted`);
}));
exports.vorpal.command("fail <jobId> <reason>", "fail job").action(utils_1.wrapTryCatch(async function ({ jobId, reason }) {
    await queue_1.getQueue();
    const job = await utils_1.getJob(jobId);
    await utils_1.answer(exports.vorpal, "Fail");
    await job.moveToFailed({ message: reason }, true);
    utils_1.logGreen(`Job "${jobId}" failed`);
}));
exports.vorpal.command("complete <jobId> <data>", "complete job").action(utils_1.wrapTryCatch(async function ({ jobId, data }) {
    await queue_1.getQueue();
    const job = await utils_1.getJob(jobId);
    let returnValue;
    try {
        returnValue = JSON.parse(data);
    }
    catch (e) {
        return utils_1.throwYellow(`Error occured, seems "data" incorrect json`);
    }
    await utils_1.answer(exports.vorpal, "Complete");
    await job.moveToCompleted(returnValue, true);
    utils_1.logGreen(`Job "${jobId}" completed`);
}));
exports.vorpal
    .command("clean <period>", `Clean queue for period ago, period format - ${utils_1.msLink}`)
    .option("-s, --status <status>", "Status of the job to clean, default: completed")
    .option("-l, --limit <limit>", "Maximum amount of jobs to clean per call, default: all")
    .action(utils_1.wrapTryCatch(async function ({ period, options }) {
    const queue = await queue_1.getQueue();
    await utils_1.answer(exports.vorpal, "Clean");
    const grace = period && period.length ? ms_1.default(period) : void 0;
    if (!grace) {
        return utils_1.throwYellow("Incorrect period");
    }
    const status = options.status || "completed";
    if (!["completed", "wait", "active", "delayed", "failed"].includes(status)) {
        return utils_1.throwYellow("Incorrect status, should be: completed or wait or active or delayed or failed");
    }
    const limit = Number.isInteger(options.limit)
        ? options.limit
        : void 0;
    await queue.clean(grace, status, limit);
    utils_1.logGreen(`Jobs cleaned`);
}));
exports.vorpal
    .command("logs <jobId>", "get logs of job")
    .option("-s, --start <start>", "Start of logs")
    .option("-e, --end <end>", "End of logs")
    .action(utils_1.wrapTryCatch(async ({ jobId, options }) => {
    const queue = await queue_1.getQueue();
    const { logs, count } = await queue.getJobLogs(jobId, options.start, options.end);
    console.log(`Count of job logs: ${count}`);
    if (logs.length) {
        console.log("Logs:");
        utils_1.logArray(logs);
    }
}));
exports.vorpal.command("log <jobId> <data>", "add log to job").action(utils_1.wrapTryCatch(async function ({ jobId, data }) {
    await queue_1.getQueue();
    const job = await utils_1.getJob(jobId);
    await utils_1.answer(exports.vorpal, "Add log");
    await job.log(data);
    utils_1.logGreen("Log added to job");
}));
exports.vorpal.history("bull-repl-default");
exports.vorpal.delimiter("BULL-REPL> ").show();
