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
const Facebook = require("facebook-chat-api");
const fse = require("fs-extra");
const readline = require("readline");
const Config_1 = require("./Config");
const Singletons_1 = require("./Singletons");
class Core {
    constructor() { }
    get pathsManager() {
        return Singletons_1.Singletons.pathsManager;
    }
    setup(appState) {
        return __awaiter(this, void 0, void 0, function* () {
            if (appState != null) {
                this.facebookApi = yield this.logFacebook(appState);
            }
            if (this.facebookApi == null) {
                if (appState != null) {
                    Config_1.Config.logError("Failed to log with the appState. Retrying with credentials");
                }
                this.facebookApi = yield this.logFacebookWithCredentials();
            }
            if (this.facebookApi == null) {
                throw Error("Failed to log in");
            }
            return this.facebookApi;
        });
    }
    logFacebookWithCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            function ReadText(question) {
                return new Promise(resolve => {
                    rl.question(question, resolve);
                });
            }
            let login = yield ReadText("Enter facebook login: ");
            let password = yield ReadText("Enter facebook password: ");
            rl.close();
            return yield this.logFacebook(null, login, password);
        });
    }
    logFacebook(appState, login = null, password = null) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let facebookApi = yield new Promise((resolve, reject) => {
                    const loginCallback = (err, api) => {
                        if (err) {
                            Config_1.Config.logError(err);
                            reject(Error(err));
                            return;
                        }
                        fse.outputJsonSync(this.pathsManager.getAppStatePath(), api.getAppState());
                        resolve(api);
                    };
                    // Log in
                    if (appState != null) {
                        Facebook({ appState: appState }, loginCallback);
                    }
                    else {
                        Facebook({ email: login, password: password }, loginCallback);
                    }
                });
                return facebookApi;
            }
            catch (error) {
                Config_1.Config.logError(error);
            }
        });
    }
}
exports.Core = Core;
//# sourceMappingURL=Core.js.map