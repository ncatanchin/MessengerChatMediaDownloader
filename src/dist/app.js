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
const Command = require("commander");
const delay = require("delay");
const fse = require("fs-extra");
const Config_1 = require("./Config");
const Core_1 = require("./Core");
const Downloader_1 = require("./Downloader");
const MediaFetcher_1 = require("./MediaFetcher");
const Singletons_1 = require("./Singletons");
let pathsManager = Singletons_1.Singletons.pathsManager;
Main();
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        Command.version("0.0.3");
        Command.option("-r, --reset", "Resets the saved session, allows to relog to fb")
            .option("-a, --all", "Download photos/videos/audios from all conversations")
            .option("-l, --list", "List all conversations and their threadIds")
            .option("-i, --infinite", "Keep retrying until all operations succeed")
            .option("-t, --thread <threadID>", "Download photos/videos/audios from the conversation with given threadID")
            .option("-m, --max-errors <number>", "Set the limit of errors to accept before interrupting, default is 3", 3)
            .option("-d, --delay", "Delay before a new attempt is performed, default is 3", 3)
            .option("-o, --read-threads-at-once <number>", "Amount of threads to read at once, default is 30", 30)
            .option("-y, --min-read-limit <number>", "Minimum of posts to read at once, default is 250", 250)
            .option("-x, --max-read-limit <number>", "Maximum of posts to read at once, default is 500", 500)
            .option("-e, --examples", "See a list of examples");
        Command.parse(process.argv);
        let appState;
        let appStateFileName = pathsManager.getAppStatePath();
        if (!Command.reset && fse.existsSync(appStateFileName)) {
            try {
                appState = yield fse.readJson(appStateFileName);
            }
            catch (error) {
                Config_1.Config.logError(error);
            }
        }
        if (Command.minReadLimit > Command.maxReadLimit) {
            Config_1.Config.logError("--min-read-limit cannot be higher than --max-read-limit");
            process.exit(1);
        }
        if (Command.examples) {
            console.log("Examples:");
            console.log("node dist/app.js --thread 123456789");
            console.log("node dist/app.js --thread 123456789 --infinite");
            console.log("node dist/app.js --thread 123456789 --delay 3");
            console.log("node dist/app.js --thread 123456789 --max-errors 5 --max-read-limit 500");
            console.log("node dist/app.js --thread 123456789 -md 4 -o 25 -y 300 -x 600");
            process.exit(0);
        }
        if (Command.all || Command.list || Command.thread) {
            try {
                let core = new Core_1.Core();
                yield core.setup(appState);
                while (1) {
                    try {
                        let downloader;
                        let mediaFetcher = new MediaFetcher_1.MediaFetcher(Command.maxErrors, Command.minReadLimit, Command.maxReadLimit, Command.readThreadsAtOnce, core.facebookApi);
                        if (Command.all || Command.thread) {
                            downloader = new Downloader_1.Downloader();
                        }
                        if (Command.all) {
                            yield mediaFetcher.saveAll();
                            yield downloader.downloadFilesForAll();
                        }
                        if (Command.list) {
                            yield mediaFetcher.saveThreadsList();
                        }
                        if (Command.thread) {
                            let threadId = Command.thread;
                            yield mediaFetcher.saveUrlsForThread(threadId);
                            yield downloader.downloadFilesForThread(threadId);
                        }
                    }
                    catch (error) {
                        Config_1.Config.logError(error);
                        if (!Command.infinite) {
                            throw error;
                        }
                        else {
                            let delayInMs = 1000 * 60 * Command.delay;
                            console.log("Retry in " + delayInMs / 1000 / 60 + " minutes...");
                            yield delay(delayInMs);
                            continue;
                        }
                    }
                    break;
                }
            }
            catch (error) {
                Config_1.Config.logError(error);
            }
        }
        console.log("See options: node dist/app.js --help");
        console.log("See examples: node dist/app.js --examples");
    });
}
//# sourceMappingURL=app.js.map