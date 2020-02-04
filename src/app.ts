import * as Command from "commander";
import * as delay from "delay";
import * as fse from "fs-extra";
import { Config } from "./Config";
import { Core } from "./Core";
import { Downloader } from "./Downloader";
import { MediaFetcher } from "./MediaFetcher";
import { PathsManager } from "./PathsManager";
import { Singletons } from "./Singletons";
import commander = require("commander");

let pathsManager: PathsManager = Singletons.pathsManager;

Main();

async function Main() {
  Command.version("0.0.3");

  Command.option(
    "-r, --reset",
    "resets the saved session, allows to relog to fb"
  )
    .option("-a, --all", "download photos/videos/audios from all conversations")
    .option("-l, --list", "list all conversations and their threadIds")
    .option("-i, --infinite", "keep retrying until all operations succeed")
    .option(
      "-t, --thread <threadID>",
      "download photos/videos/audios from the conversation with given threadID"
    )
    .option(
      "-me, --max-errors <number>",
      "set the limit of errors to accept before interrupting, default is 3",
      3
    )
    .option(
      "-readthr, --read-threads-at-once <number>",
      "the amount of threads to read at once, default is 30",
      30
    )
    .option("-d, --delay", "Delay before a new attempt is performed.", 3)
    .option(
      "-minrl, --min-read-limit <number>",
      "the minimum of posts to read at once, default is 100",
      100
    )
    .option(
      "-maxrl, --max-read-limit <number>",
      "the maximum of posts to read at once, default is 500",
      500
    );

  Command.parse(process.argv);

  let appState: any;
  let appStateFileName: string = pathsManager.getAppStatePath();

  if (!Command.reset && fse.existsSync(appStateFileName)) {
    try {
      appState = await fse.readJson(appStateFileName);
    } catch (error) {
      Config.logError(error);
    }
  }

  if (Command.all || Command.list || Command.thread) {
    try {
      let core: Core = new Core();
      await core.setup(appState);

      while (1) {
        try {
          let downloader: Downloader;

          let mediaFetcher = new MediaFetcher(
            Command.maxErrors,
            Command.minReadLimit,
            Command.maxReadLimit,
            Command.readThreadsAtOnce,
            core.facebookApi
          );

          if (Command.all || Command.thread) {
            downloader = new Downloader();
          }

          if (Command.all) {
            await mediaFetcher.saveAll();
            await downloader.downloadFilesForAll();
          }

          if (Command.list) {
            await mediaFetcher.saveThreadsList();
          }

          if (Command.thread) {
            let threadId: string = Command.thread;

            await mediaFetcher.saveUrlsForThread(threadId);
            await downloader.downloadFilesForThread(threadId);
          }
        } catch (error) {
          Config.logError(error);

          if (!Command.infinite) {
            throw error;
          } else {
            let delayInMs: number = 1000 * 60 * Command.delay;
            console.log("Retry in " + delayInMs / 1000 / 60 + " minutes...");

            await delay(delayInMs);
            continue;
          }
        }

        break;
      }
    } catch (error) {
      Config.logError(error);
    }
  }

  console.log("No arguments provided...");
  console.log("Example: node dist/app.js --thread 123456789");
  console.log("Example: node dist/app.js --thread 123456789 --infinite");
  console.log("Example: node dist/app.js --thread 123456789 --delay 3");
  console.log(
    "Example: node dist/app.js --thread 123456789 --max-errors 5 -maxrl 500"
  );
}
