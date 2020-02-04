"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PathsManager_1 = require("./PathsManager");
const SavedThreadManager_1 = require("./SavedThreadManager");
var Singletons;
(function (Singletons) {
    Singletons.pathsManager = new PathsManager_1.PathsManager();
    Singletons.savedThreadsManager = new SavedThreadManager_1.SavedThreadManager(Singletons.pathsManager);
})(Singletons = exports.Singletons || (exports.Singletons = {}));
//# sourceMappingURL=Singletons.js.map