"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration_1 = require("../helpers/configuration");
const command_1 = require("./command");
class Refresh extends command_1.Command {
    constructor() {
        super("svn.refresh", { repository: true });
    }
    async execute(repository) {
        const refreshRemoteChanges = configuration_1.configuration.get("refresh.remoteChanges", false);
        await repository.status();
        if (refreshRemoteChanges) {
            await repository.updateRemoteChangedFiles();
        }
    }
}
exports.Refresh = Refresh;
//# sourceMappingURL=refresh.js.map