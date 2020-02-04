import * as Command from "commander";
import * as delay from "delay";
import * as fse from "fs-extra";
import { Config } from "./Config";
import { Core } from "./Core";
import { Downloader } from "./Downloader";
import { MediaFetcher } from "./MediaFetcher";
import { PathsManager } from "./PathsManager";
import { Singletons } from "./Singletons";

let pathsManager: PathsManager = Singletons.pathsManager;

Main();

async function Main() {
  Command.version("0.0.3");

  Command.option(
    "-r, --reset",
    "Resets the saved session, allows to relog to fb"
  )
    .option("-a, --all", "Download photos/videos/audios from all conversations")
    .option("-l, --list", "List all conversations and their threadIds")
    .option("-i, --infinite", "Keep retrying until all operations succeed")
    .option(
      "-t, --thread <threadID>",
      "Download photos/videos/audios from the conversation with given threadID"
    )
    .option(
      "-m, --max-errors <number>",
      "Set the limit of errors to accept before interrupting, default is 3",
      3
    )
    .option(
      "-d, --delay",
      "Delay before a new attempt is performed, default is 3",
      3
    )
    .option(
      "-o, --read-threads-at-once <number>",
      "Amount of threads to read at once, default is 30",
      30
    )
    .option(
      "-y, --min-read-limit <number>",
      "Minimum of posts to read at once, default is 250",
      250
    )
    .option(
      "-x, --max-read-limit <number>",
      "Maximum of posts to read at once, default is 500",
      500
    )
    .option("-e, --examples", "See a list of examples");

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

  if (Command.minReadLimit > Command.maxReadLimit) {
    Config.logError("--min-read-limit cannot be higher than --max-read-limit");
    process.exit(1);
  }

  if (Command.examples) {
    console.log("Examples:");
    console.log("node dist/app.js --thread 123456789");
    console.log("node dist/app.js --thread 123456789 --infinite");
    console.log("node dist/app.js --thread 123456789 --delay 3");
    console.log(
      "node dist/app.js --thread 123456789 --max-errors 5 --max-read-limit 500"
    );
    console.log(
      "node dist/app.js --thread 123456789 -md 4 -o 25 -y 300 -x 600"
    );
    process.exit(0);
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

  console.log("See options: node dist/app.js --help");
  console.log("See examples: node dist/app.js --examples");
}
