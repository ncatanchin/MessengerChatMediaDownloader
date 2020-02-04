"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const ThreadSavedInfo_1 = require("./ThreadSavedInfo");
class SavedThreadManager {
    constructor(pathsManager) {
        this.threadsInfo = {};
        this.pathsManager = pathsManager;
        this.threadsInfo = this.readThreadsInfo();
    }
    get threadsInfoPath() {
        return this.pathsManager.getThreadsInfoFilePath();
    }
    saveThreadsInfo() {
        fse.outputJsonSync(this.threadsInfoPath, this.threadsInfo);
    }
    readThreadsInfo() {
        let threadsInfo = {};
        try {
            threadsInfo = fse.readJsonSync(this.threadsInfoPath);
        }
        catch (error) { }
        return threadsInfo;
    }
    getThreadInfo(threadId) {
        return this.threadsInfo[threadId] || new ThreadSavedInfo_1.ThreadSavedInfo();
    }
    saveThreadInfo(threadId, threadInfo) {
        this.threadsInfo[threadId] = threadInfo;
        this.saveThreadsInfo();
    }
}
exports.SavedThreadManager = SavedThreadManager;
//# sourceMappingURL=SavedThreadManager.js.map