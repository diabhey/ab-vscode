"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const command_1 = require("./command");
class Remove extends command_1.Command {
    constructor() {
        super("svn.remove");
    }
    async execute(...resourceStates) {
        const selection = await this.getResourceStates(resourceStates);
        if (selection.length === 0) {
            return;
        }
        let keepLocal;
        const answer = await vscode_1.window.showWarningMessage("Would you like to keep a local copy of the files?.", { modal: true }, "Yes", "No");
        if (!answer) {
            return;
        }
        if (answer === "Yes") {
            keepLocal = true;
        }
        else {
            keepLocal = false;
        }
        const uris = selection.map(resource => resource.resourceUri);
        await this.runByRepository(uris, async (repository, resources) => {
            if (!repository) {
                return;
            }
            const paths = resources.map(resource => resource.fsPath);
            try {
                await repository.removeFiles(paths, keepLocal);
            }
            catch (error) {
                console.log(error);
                vscode_1.window.showErrorMessage("Unable to remove files");
            }
        });
    }
}
exports.Remove = Remove;
//# sourceMappingURL=remove.js.map