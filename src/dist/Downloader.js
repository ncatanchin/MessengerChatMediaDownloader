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
const download = require("download");
const fse = require("fs-extra");
const path = require("path");
const Config_1 = require("./Config");
const Singletons_1 = require("./Singletons");
class FileProgress {
    constructor(url) {
        this.downloaded = false;
        this.url = url;
    }
}
class Downloader {
    constructor() { }
    get pathsManager() {
        return Singletons_1.Singletons.pathsManager;
    }
    downloadFilesForAll() {
        return __awaiter(this, void 0, void 0, function* () {
            let mainThreadsPath = this.pathsManager.threadsMainPath;
            const isDirectory = (source) => fse.lstatSync(source).isDirectory();
            let sourceDir = mainThreadsPath;
            let directories = fse
                .readdirSync(sourceDir)
                .map(name => path.join(sourceDir, name))
                .filter(isDirectory);
            for (let dir of directories) {
                let threadId = path.basename(dir);
                yield this.downloadFilesForThread(threadId);
            }
        });
    }
    downloadFilesForThread(threadId) {
        return __awaiter(this, void 0, void 0, function* () {
            let urlsPath = this.pathsManager.getUrlsPathForThread(threadId);
            let outputPath = this.pathsManager.getOutputPathForThread(threadId);
            let urlsFileContent = fse.readFileSync(urlsPath, "utf8");
            let urls = urlsFileContent.split("\n");
            yield this.downloadFiles(threadId, outputPath, urls);
        });
    }
    downloadFiles(threadId, outputPath, urls) {
        return __awaiter(this, void 0, void 0, function* () {
            let filesProgressesPath = this.pathsManager.getFileProgressPathForThread(threadId);
            let filesProgresses = [];
            let saveChanges = false;
            // Will fail if the file does not exist
            try {
                filesProgresses = yield fse.readJson(filesProgressesPath);
            }
            catch (error) { }
            for (let url of urls) {
                if (url.length == 0) {
                    continue;
                }
                if (!filesProgresses.some(fileProgress => fileProgress.url == url)) {
                    filesProgresses.push(new FileProgress(url));
                }
            }
            let unfinishedFiles = filesProgresses.filter(fileProgress => fileProgress.downloaded == false);
            if (unfinishedFiles.length > 0) {
                saveChanges = true;
            }
            try {
                for (let file of unfinishedFiles) {
                    try {
                        yield download(file.url, outputPath);
                        file.downloaded = true;
                        console.log("Downloaded: " + file.url);
                    }
                    catch (error) {
                        Config_1.Config.logError(error);
                    }
                }
            }
            catch (error) {
                Config_1.Config.logError(error);
            }
            finally {
                if (saveChanges) {
                    yield fse.outputJson(filesProgressesPath, filesProgresses);
                    console.log("Download progress saved!");
                }
            }
        });
    }
}
exports.Downloader = Downloader;
//# sourceMappingURL=Downloader.js.map