"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const delay = require("delay");
const fse = require("fs-extra");
const random = require("random");
const Config_1 = require("./Config");
const Singletons_1 = require("./Singletons");
const ThreadSavedInfo_1 = require("./ThreadSavedInfo");
class MediaFetcherError extends Error {
}
class MediaFetcher {
    constructor(maxErrors, postsToReadAtOnceMin, postsToReadAtOnceMax, threadsToReadAtOnce, msgApi) {
        this.emptyMessagesBeforeSkipping = 3;
        this.errorsCount = 0;
        this.maxErrors = maxErrors;
        this.postsToReadAtOnceMin = postsToReadAtOnceMin;
        this.postsToReadAtOnceMax = postsToReadAtOnceMax;
        this.threadsToReadAtOnce = threadsToReadAtOnce;
        this.facebookApi = msgApi;
    }
    get threadsInfoManager() {
        return Singletons_1.Singletons.savedThreadsManager;
    }
    get pathsManager() {
        return Singletons_1.Singletons.pathsManager;
    }
    saveAll() {
        return __awaiter(this, void 0, void 0, function* () {
            let threadTimestamp;
            do {
                try {
                    console.log("Getting thread info...");
                    let threadsInfo = yield this.getNextThreads(this.threadsToReadAtOnce, threadTimestamp);
                    if (threadsInfo && threadsInfo.length > 0) {
                        for (let threadInfo of threadsInfo) {
                            if (threadInfo != null) {
                                threadTimestamp = Number(threadInfo.timestamp);
                                let name = yield this.getThreadName(threadInfo);
                                console.log("Thread name: " +
                                    name +
                                    ", message count: " +
                                    threadInfo.messageCount);
                                let urls = yield this.getUrlsForThread(threadInfo, name);
                                yield this.saveUrlsToDisk(threadInfo.threadID, urls);
                            }
                        }
                    }
                    else {
                        break;
                    }
                    yield delay(random.int(1000, 5000));
                }
                catch (error) {
                    if (error instanceof MediaFetcherError) {
                        Config_1.Config.logError(error.message);
                        console.log("Could not get the whole conversation, skipping...");
                        this.errorsCount++;
                    }
                    else {
                        Config_1.Config.logError(error);
                        Config_1.Config.logError("Retrying...");
                    }
                    this.onError();
                }
            } while (1);
            console.log("saveAll Finished!");
        });
    }
    saveUrlsForThread(threadId) {
        return __awaiter(this, void 0, void 0, function* () {
            do {
                try {
                    console.log("Getting thread info...");
                    let threadInfo = yield this.getThreadInfo(threadId);
                    if (threadInfo) {
                        let name = yield this.getThreadName(threadInfo);
                        console.log("Thread name: " +
                            name +
                            ", message count: " +
                            threadInfo.messageCount);
                        let urls = yield this.getUrlsForThread(threadInfo, name);
                        yield this.saveUrlsToDisk(threadId, urls);
                    }
                    else {
                        throw new MediaFetcherError("Failed to query thread info");
                    }
                    break;
                }
                catch (error) {
                    if (error instanceof MediaFetcherError) {
                        Config_1.Config.logError(error.message);
                        Config_1.Config.logError("Failed to get urls");
                    }
                    else {
                        Config_1.Config.logError(error);
                        Config_1.Config.logError("Retrying...");
                    }
                    throw error;
                }
            } while (1);
            console.log("saveUrlsForThread Finished!");
        });
    }
    /**
     * Get urls for a given thread.
     * @param threadInfo
     * @returns
     */
    getUrlsForThread(threadInfo, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let threadId = threadInfo.threadID;
            let threadProgress = this.threadsInfoManager.getThreadInfo(threadId);
            let messageTimestamp = threadProgress.lastTimestamp;
            let readMessages = threadProgress.messagesRead;
            let messageCount = threadProgress.messageCount
                ? threadProgress.messageCount
                : threadInfo.messageCount;
            let urls = this.readTempSavedUrls(threadId);
            let history = [];
            let emptyHistoryCounter = 0;
            let percentReadNotify = 10;
            if (threadProgress.completed) {
                return urls;
            }
            const saveProgress = () => {
                // Do not save the progress when no messages read as we do not have timestamp and that will fuck up messageCount if there come new messages meanwhile
                if (readMessages > 0) {
                    this.threadsInfoManager.saveThreadInfo(threadId, new ThreadSavedInfo_1.ThreadSavedInfo(messageTimestamp, name || threadId, readMessages, readMessages >= messageCount, messageCount));
                    this.saveTempSavedUrls(threadId, urls);
                }
            };
            const calculateProgress = () => Math.floor((readMessages / messageCount) * 100);
            const printProgress = (percent) => console.log("Read " + percent + "% messages");
            printProgress(calculateProgress());
            while (readMessages < messageCount) {
                try {
                    history = yield this.fetchThreadHistory(threadId, messageTimestamp);
                    if (history.length > 0) {
                        readMessages += history.length;
                        let percent = calculateProgress();
                        if (percent > percentReadNotify) {
                            printProgress(percent);
                            percentReadNotify = 10 + percent;
                        }
                        messageTimestamp = Number(history[0].timestamp);
                        history.forEach(msg => (urls = urls.concat(this.getUrlsFromMessage(msg))));
                    }
                    else {
                        emptyHistoryCounter++;
                        if (emptyHistoryCounter >= this.emptyMessagesBeforeSkipping) {
                            saveProgress();
                            throw new MediaFetcherError("API calls limit reached");
                        }
                    }
                }
                catch (error) {
                    if (error instanceof MediaFetcherError) {
                        //Internal error, rethrow
                        throw error;
                    }
                    else {
                        Config_1.Config.logError(error);
                        Config_1.Config.logError("Retrying...");
                    }
                    this.onError();
                }
            }
            saveProgress();
            return urls;
        });
    }
    getUrlsFromMessage(msg) {
        let urls = [];
        if (msg.type == "message") {
            if (msg.attachments.length > 0) {
                msg.attachments.forEach(attachment => {
                    let url = null;
                    if (attachment.type == "photo") {
                        url = attachment.largePreviewUrl;
                    }
                    else if (attachment.type == "audio" || attachment.type == "video") {
                        url = attachment.url;
                    }
                    if (url != null) {
                        urls.push(url);
                    }
                });
            }
        }
        return urls;
    }
    saveThreadsList() {
        return __awaiter(this, void 0, void 0, function* () {
            let threadsList = [];
            let threadTimestamp;
            do {
                try {
                    let fetched = yield this.getNextThreads(this.threadsToReadAtOnce, threadTimestamp);
                    if (fetched.length > 0) {
                        threadTimestamp = Number(fetched[fetched.length - 1].timestamp);
                        threadsList = threadsList.concat(fetched);
                    }
                    else {
                        break;
                    }
                }
                catch (error) {
                    Config_1.Config.logError(error);
                    Config_1.Config.logError("Retrying...");
                    this.onError();
                }
            } while (1);
            const threadToString = thread => "Name: " +
                thread.name +
                ", message count: " +
                thread.messageCount +
                ", threadID: " +
                thread.threadID;
            threadsList.sort((a, b) => b.messageCount - a.messageCount);
            if (threadsList.length > 0) {
                let filePath = this.pathsManager.getThreadsIdsFilePath();
                let writeStream = fse.createWriteStream(filePath);
                writeStream.on("error", function (err) {
                    Config_1.Config.logError("IO ERROR: " + err);
                });
                threadsList.forEach(thread => writeStream.write(threadToString(thread) + "\n", "utf8"));
                writeStream.end();
                console.log("Saved results to " + filePath);
            }
        });
    }
    onError() {
        this.errorsCount++;
        if (this.errorsCount >= this.maxErrors) {
            throw Error("Exiting due too many errors");
        }
    }
    getThreadName(threadInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let name = threadInfo.name;
            if (name == null) {
                name = "";
                let users = yield this.getUserInfo(threadInfo.participantIDs);
                users.forEach(user => (name += user.name + "_"));
                if (name.length > 1) {
                    name = name.substring(0, name.length - 1);
                }
            }
            return name;
        });
    }
    readTempSavedUrls(threadID) {
        let filePath = this.pathsManager.getTempUrlFilePath(threadID);
        let urls = [];
        try {
            urls = fse.readJsonSync(filePath);
        }
        catch (error) { }
        return urls;
    }
    saveTempSavedUrls(threadID, urls) {
        let filePath = this.pathsManager.getTempUrlFilePath(threadID);
        try {
            fse.outputJsonSync(filePath, urls);
        }
        catch (error) { }
    }
    saveUrlsToDisk(threadId, urls) {
        return __awaiter(this, void 0, void 0, function* () {
            if (urls.length > 0) {
                // Remove duplicates
                let uniqUrls = [...new Set(urls)];
                let urlsPath = this.pathsManager.getUrlsPathForThread(threadId);
                yield fse.ensureFile(urlsPath);
                let writeStream = fse.createWriteStream(urlsPath);
                writeStream.on("error", function (err) {
                    Config_1.Config.logError("IO ERROR: " + err);
                });
                uniqUrls.forEach(url => writeStream.write(url + "\n", "utf8"));
                let awaitableStreamEnd = new Promise(resolve => {
                    writeStream.end(resolve);
                });
                yield awaitableStreamEnd;
                console.log("Urls saved to " + urlsPath);
            }
        });
    }
    getUserInfo(userIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.facebookApi.getUserInfo(userIds, (err, data) => {
                    if (err) {
                        Config_1.Config.logError(err);
                        reject(Error("Failed to get thread info"));
                        return;
                    }
                    let result = [];
                    for (var prop in data) {
                        if (data.hasOwnProperty(prop)) {
                            result.push(data[prop]);
                        }
                    }
                    resolve(result);
                });
            });
        });
    }
    fetchThreadHistory(threadID, messageTimestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            // Delay so we do not reach api calls limit that fast
            yield delay(random.int(300, 500));
            return new Promise((resolve, reject) => {
                this.facebookApi.getThreadHistory(threadID, random.int(this.postsToReadAtOnceMin, this.postsToReadAtOnceMax), messageTimestamp, (err, history) => {
                    if (err) {
                        Config_1.Config.logError(err);
                        reject(Error("Failed to get thread history"));
                        return;
                    }
                    // If the timestamp is not null then the first message on the list is the one we got the last time
                    if (messageTimestamp != null) {
                        if (history == null) {
                            history = null;
                        }
                        history.pop();
                    }
                    resolve(history);
                });
            });
        });
    }
    getNextThreads(amount, threadTimestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.facebookApi.getThreadList(amount, threadTimestamp || null, [], (err, list) => {
                    if (err) {
                        Config_1.Config.logError(err);
                        reject(Error("Error getting threads"));
                        return;
                    }
                    // If the timestamp is not null then the first thread on the list is the one we got the last time
                    if (threadTimestamp != null) {
                        list.pop();
                    }
                    resolve(list);
                });
            });
        });
    }
    getThreadInfo(threadID) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.facebookApi.getThreadInfo(threadID, (err, info) => {
                    if (err) {
                        Config_1.Config.logError(err);
                        reject(Error("Failed to get thread info"));
                        return;
                    }
                    resolve(info);
                });
            });
        });
    }
}
exports.MediaFetcher = MediaFetcher;
//# sourceMappingURL=MediaFetcher.js.map