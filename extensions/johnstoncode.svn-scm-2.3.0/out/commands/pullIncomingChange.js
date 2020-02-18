"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const configuration_1 = require("../helpers/configuration");
const incomingChangeNode_1 = require("../treeView/nodes/incomingChangeNode");
const command_1 = require("./command");
class PullIncommingChange extends command_1.Command {
    constructor() {
        super("svn.treeview.pullIncomingChange");
    }
    // TODO: clean this up
    async execute(...changes) {
        const showUpdateMessage = configuration_1.configuration.get("showUpdateMessage", true);
        if (changes[0] instanceof incomingChangeNode_1.default) {
            try {
                const incomingChange = changes[0];
                const result = await incomingChange.repository.pullIncomingChange(incomingChange.uri.fsPath);
                if (showUpdateMessage) {
                    vscode_1.window.showInformationMessage(result);
                }
            }
            catch (error) {
                console.error(error);
                vscode_1.window.showErrorMessage("Unable to update");
            }
            return;
        }
        const uris = changes.map(change => change.resourceUri);
        await this.runByRepository(uris, async (repository, resources) => {
            if (!repository) {
                return;
            }
            const files = resources.map(resource => resource.fsPath);
            files.forEach(async (path) => {
                const result = await repository.pullIncomingChange(path);
                if (showUpdateMessage) {
                    vscode_1.window.showInformationMessage(result);
                }
            });
        });
    }
}
exports.PullIncommingChange = PullIncommingChange;
//# sourceMappingURL=pullIncomingChange.js.map