"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const configuration_1 = require("../helpers/configuration");
const command_1 = require("./command");
class Update extends command_1.Command {
    constructor() {
        super("svn.update", { repository: true });
    }
    async execute(repository) {
        try {
            const ignoreExternals = configuration_1.configuration.get("update.ignoreExternals", false);
            const showUpdateMessage = configuration_1.configuration.get("showUpdateMessage", true);
            const result = await repository.updateRevision(ignoreExternals);
            if (showUpdateMessage) {
                vscode_1.window.showInformationMessage(result);
            }
        }
        catch (error) {
            console.error(error);
            vscode_1.window.showErrorMessage("Unable to update");
        }
    }
}
exports.Update = Update;
//# sourceMappingURL=update.js.map