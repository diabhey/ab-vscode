"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const changelistItems_1 = require("../changelistItems");
const types_1 = require("../common/types");
const messages_1 = require("../messages");
const resource_1 = require("../resource");
const command_1 = require("./command");
class CommitWithMessage extends command_1.Command {
    constructor() {
        super("svn.commitWithMessage", { repository: true });
    }
    async execute(repository) {
        const choice = await changelistItems_1.inputCommitChangelist(repository);
        if (!choice) {
            return;
        }
        const filePaths = choice.resourceGroup.resourceStates.map(state => {
            return state.resourceUri.fsPath;
        });
        const message = await messages_1.inputCommitMessage(repository.inputBox.value, false, filePaths);
        if (message === undefined) {
            return;
        }
        // If files is renamed, the commit need previous file
        choice.resourceGroup.resourceStates.forEach(state => {
            if (state instanceof resource_1.Resource) {
                if (state.type === types_1.Status.ADDED && state.renameResourceUri) {
                    filePaths.push(state.renameResourceUri.fsPath);
                }
                let dir = path.dirname(state.resourceUri.fsPath);
                let parent = repository.getResourceFromFile(dir);
                while (parent) {
                    if (parent.type === types_1.Status.ADDED) {
                        filePaths.push(dir);
                    }
                    dir = path.dirname(dir);
                    parent = repository.getResourceFromFile(dir);
                }
            }
        });
        try {
            const result = await repository.commitFiles(message, filePaths);
            vscode_1.window.showInformationMessage(result);
            repository.inputBox.value = "";
        }
        catch (error) {
            console.error(error);
            vscode_1.window.showErrorMessage(error.stderrFormated);
        }
    }
}
exports.CommitWithMessage = CommitWithMessage;
//# sourceMappingURL=commitWithMessage.js.map