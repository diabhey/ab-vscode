"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const fs_1 = require("../fs");
const util_1 = require("../util");
const command_1 = require("./command");
class DeleteUnversioned extends command_1.Command {
    constructor() {
        super("svn.deleteUnversioned");
    }
    async execute(...resourceStates) {
        const selection = await this.getResourceStates(resourceStates);
        if (selection.length === 0) {
            return;
        }
        const uris = selection.map(resource => resource.resourceUri);
        const answer = await vscode_1.window.showWarningMessage("Would you like to delete selected files?", { modal: true }, "Yes", "No");
        if (answer === "Yes") {
            for (const uri of uris) {
                const fsPath = uri.fsPath;
                try {
                    if (!(await fs_1.exists(fsPath))) {
                        continue;
                    }
                    const stat = await fs_1.lstat(fsPath);
                    if (stat.isDirectory()) {
                        util_1.deleteDirectory(fsPath);
                    }
                    else {
                        await fs_1.unlink(fsPath);
                    }
                }
                catch (err) {
                    // TODO(cjohnston) Show meaningful error to user
                }
            }
        }
    }
}
exports.DeleteUnversioned = DeleteUnversioned;
//# sourceMappingURL=deleteUnversioned.js.map