"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Singletons_1 = require("./Singletons");
class PathsManager {
    get threadsInfoManager() {
        return Singletons_1.Singletons.savedThreadsManager;
    }
    get threadsMainPath() {
        return path.join(this.basedir, "threads");
    }
    get threadsMainOutputPath() {
        return path.join(this.basedir, "outputs");
    }
    get basedir() {
        return process.cwd();
    }
    getPathForThread(threadId) {
        return path.join(this.threadsMainPath, threadId);
    }
    getUrlsPathForThread(threadId) {
        return path.join(this.getPathForThread(threadId), "urls.txt");
    }
    getOutputPathForThread(threadId) {
        let name = this.threadsInfoManager.getThreadInfo(threadId).name;
        return path.join(this.threadsMainOutputPath, name);
    }
    getFileProgressPathForThread(threadId) {
        return path.join(this.basedir, threadId, "fileProgresses.json");
    }
    getThreadsInfoFilePath() {
        return path.join(this.basedir, "threadsInfo.json");
    }
    getThreadsIdsFilePath() {
        return path.join(this.basedir, "threadsIDs.txt");
    }
    getTempUrlFilePath(threadID) {
        return path.join(this.basedir, "temp", threadID + ".json");
    }
    getAppStatePath() {
        return path.join(this.basedir, "appstate.json");
    }
}
exports.PathsManager = PathsManager;
//# sourceMappingURL=PathsManager.js.map