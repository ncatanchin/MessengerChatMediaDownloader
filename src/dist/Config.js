"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Config;
(function (Config) {
    Config.showErrorMessageOnly = true;
    function logError(error) {
        if (error instanceof Error && Config.showErrorMessageOnly) {
            console.error(error.name + ": " + error.message);
        }
        else {
            console.error(error);
        }
    }
    Config.logError = logError;
})(Config = exports.Config || (exports.Config = {}));
//# sourceMappingURL=Config.js.map