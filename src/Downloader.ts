import * as download from "download";
import * as fse from "fs-extra";
import * as path from "path";
import { Config } from "./Config";
import { PathsManager } from "./PathsManager";
import { Singletons } from "./Singletons";

class FileProgress {
  url: string;
  downloaded: boolean = false;

  constructor(url: string) {
    this.url = url;
  }
}

export class Downloader {
  facebookApi: any;

  constructor() {}

  get pathsManager(): PathsManager {
    return Singletons.pathsManager;
  }

  async downloadFilesForAll() {
    let mainThreadsPath = this.pathsManager.threadsMainPath;

        // for some reason withFileTypes is not available
        //const getDirectories = source =>
        //    fs.readdirSync(source, { withFileTypes: true })
        //        .filter(dirent => dirent.isDirectory())
        //        .map(dirent => dirent.name);

        const isDirectory = (source: fse.PathLike) =>
            fse.lstatSync(source).isDirectory();


        let sourceDir: string = mainThreadsPath;

        let directories: string[] = fse
            .readdirSync(sourceDir)
            .map(name => path.join(sourceDir, name))
            .filter(isDirectory);

        for (let dir of directories) {
            let threadId = path.basename(dir);
            await this.downloadFilesForThread(threadId);
        }
    }

    async downloadFilesForThread(threadId: string) {
        let urlsPath = this.pathsManager.getUrlsPathForThread(threadId);

        console.log('urlsPath: '+urlsPath);

        let outputPath = this.pathsManager.getOutputPathForThread(threadId);
        console.log('outputPath: '+outputPath);

        fse.pathExists(urlsPath, async (err, exists) => {
            console.log(err);
            console.log(exists);

            if (exists) {
                let urlsFileContent: string = fse.readFileSync(urlsPath, "utf8");
                console.log('whhyyyy');
                let urls: string[] = urlsFileContent.split("\n");
                await this.downloadFiles(threadId, outputPath, urls);
            } else {
                console.log('not exists');
            }
        });
        

    }

    private async downloadFiles(
        threadId: string,
        outputPath: string,
        urls: string[]
    ) {
        let filesProgressesPath: string = this.pathsManager.getFileProgressPathForThread(
            threadId
        );
        let filesProgresses: FileProgress[] = [];
        let saveChanges: boolean = false;

        // will fail if the file does not exist
        try {
            filesProgresses = await fse.readJson(filesProgressesPath);
        } catch (error) { }

        for (let url of urls) {
            if (url.length == 0) {
                continue;
            }
            if (!filesProgresses.some(fileProgress => fileProgress.url == url)) {
                filesProgresses.push(new FileProgress(url));
            }
        };

        let unfinishedFiles: FileProgress[] = filesProgresses.filter(
            fileProgress => fileProgress.downloaded == false
        );
        if (unfinishedFiles.length > 0) {
            saveChanges = true;
        }

        try {
            for (let file of unfinishedFiles) {
                try {
                    await download(file.url, outputPath);
                    file.downloaded = true;
                    console.log("Downloaded: " + file.url);
                } catch (error) {
                    Config.logError(error);
                }
            }
        } catch (error) {
            Config.logError(error);
        } finally {
            if (saveChanges) {
                await fse.outputJson(filesProgressesPath, filesProgresses);
                console.log("Download progress saved!");
            }
        }
    }
}