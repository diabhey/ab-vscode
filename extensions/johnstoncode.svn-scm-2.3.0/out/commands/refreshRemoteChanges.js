"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class RefreshRemoteChanges extends command_1.Command {
    constructor() {
        super("svn.refreshRemoteChanges", { repository: true });
    }
    async execute(repository) {
        await repository.updateRemoteChangedFiles();
    }
}
exports.RefreshRemoteChanges = RefreshRemoteChanges;
//# sourceMappingURL=refreshRemoteChanges.js.map