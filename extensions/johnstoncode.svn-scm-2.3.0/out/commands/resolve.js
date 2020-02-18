"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const conflictItems_1 = require("../conflictItems");
const command_1 = require("./command");
class Resolve extends command_1.Command {
    constructor() {
        super("svn.resolve");
    }
    async execute(...resourceStates) {
        const selection = await this.getResourceStates(resourceStates);
        if (selection.length === 0) {
            return;
        }
        const picks = conflictItems_1.getConflictPickOptions();
        const choice = await vscode_1.window.showQuickPick(picks, {
            placeHolder: "Select conflict option"
        });
        if (!choice) {
            return;
        }
        const uris = selection.map(resource => resource.resourceUri);
        await this.runByRepository(uris, async (repository, resources) => {
            if (!repository) {
                return;
            }
            const files = resources.map(resource => resource.fsPath);
            await repository.resolve(files, choice.label);
        });
    }
}
exports.Resolve = Resolve;
//# sourceMappingURL=resolve.js.map