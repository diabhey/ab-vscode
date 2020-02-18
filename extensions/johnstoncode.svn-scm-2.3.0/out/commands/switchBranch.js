"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const branch_1 = require("../helpers/branch");
const command_1 = require("./command");
class SwitchBranch extends command_1.Command {
    constructor() {
        super("svn.switchBranch", { repository: true });
    }
    async execute(repository) {
        const branch = await branch_1.selectBranch(repository, true);
        if (!branch) {
            return;
        }
        try {
            if (branch.isNew) {
                const commitMessage = await vscode_1.window.showInputBox({
                    value: `Created new branch ${branch.name}`,
                    prompt: `Commit message for create branch ${branch.name}`
                });
                // If press ESC on commit message
                if (commitMessage === undefined) {
                    return;
                }
                await repository.newBranch(branch.path, commitMessage);
            }
            else {
                try {
                    await repository.switchBranch(branch.path);
                }
                catch (error) {
                    if (typeof error === "object" &&
                        error.hasOwnProperty("stderrFormated") &&
                        error.stderrFormated.includes("ignore-ancestry")) {
                        const answer = await vscode_1.window.showErrorMessage("Seems like these branches don't have a common ancestor. " +
                            " Do you want to retry with '--ignore-ancestry' option?", "Yes", "No");
                        if (answer === "Yes") {
                            await repository.switchBranch(branch.path, true);
                        }
                    }
                    else {
                        throw error;
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
            if (branch.isNew) {
                vscode_1.window.showErrorMessage("Unable to create new branch");
            }
            else {
                vscode_1.window.showErrorMessage("Unable to switch branch");
            }
        }
    }
}
exports.SwitchBranch = SwitchBranch;
//# sourceMappingURL=switchBranch.js.map