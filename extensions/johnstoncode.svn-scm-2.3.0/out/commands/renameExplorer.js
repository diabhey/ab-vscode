"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const util_1 = require("../util");
const command_1 = require("./command");
class RenameExplorer extends command_1.Command {
    constructor() {
        super("svn.renameExplorer", { repository: true });
    }
    async execute(repository, mainUri, _allUris) {
        if (!mainUri) {
            return;
        }
        const oldName = mainUri.fsPath;
        return this.rename(repository, oldName);
    }
    async rename(repository, oldFile, newName) {
        oldFile = util_1.fixPathSeparator(oldFile);
        if (!newName) {
            const root = util_1.fixPathSeparator(repository.workspaceRoot);
            const oldName = path.relative(root, oldFile);
            newName = await vscode_1.window.showInputBox({
                value: path.basename(oldFile),
                prompt: `New name name for ${oldName}`
            });
        }
        if (!newName) {
            return;
        }
        const basepath = path.dirname(oldFile);
        newName = path.join(basepath, newName);
        await repository.rename(oldFile, newName);
    }
}
exports.RenameExplorer = RenameExplorer;
//# sourceMappingURL=renameExplorer.js.map