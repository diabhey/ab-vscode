"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const conflictItems_1 = require("../conflictItems");
const command_1 = require("./command");
class ResolveAll extends command_1.Command {
    constructor() {
        super("svn.resolveAll", { repository: true });
    }
    async execute(repository) {
        const conflicts = repository.conflicts.resourceStates;
        if (!conflicts.length) {
            vscode_1.window.showInformationMessage("No Conflicts");
        }
        for (const conflict of conflicts) {
            const placeHolder = `Select conflict option for ${conflict.resourceUri.path}`;
            const picks = conflictItems_1.getConflictPickOptions();
            const choice = await vscode_1.window.showQuickPick(picks, { placeHolder });
            if (!choice) {
                return;
            }
            try {
                const response = await repository.resolve([conflict.resourceUri.path], choice.label);
                vscode_1.window.showInformationMessage(response);
            }
            catch (error) {
                vscode_1.window.showErrorMessage(error.stderr);
            }
        }
    }
}
exports.ResolveAll = ResolveAll;
//# sourceMappingURL=resolveAll.js.map