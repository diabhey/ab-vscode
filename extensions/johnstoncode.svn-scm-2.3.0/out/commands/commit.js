"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const types_1 = require("../common/types");
const messages_1 = require("../messages");
const resource_1 = require("../resource");
const command_1 = require("./command");
class Commit extends command_1.Command {
    constructor() {
        super("svn.commit");
    }
    async execute(...resources) {
        if (resources.length === 0 || !(resources[0].resourceUri instanceof vscode_1.Uri)) {
            const resource = await this.getSCMResource();
            if (!resource) {
                return;
            }
            resources = [resource];
        }
        const selection = resources.filter(s => s instanceof resource_1.Resource);
        const uris = selection.map(resource => resource.resourceUri);
        selection.forEach(resource => {
            if (resource.type === types_1.Status.ADDED && resource.renameResourceUri) {
                uris.push(resource.renameResourceUri);
            }
        });
        await this.runByRepository(uris, async (repository, resources) => {
            if (!repository) {
                return;
            }
            const paths = resources.map(resource => resource.fsPath);
            for (const resource of resources) {
                let dir = path.dirname(resource.fsPath);
                let parent = repository.getResourceFromFile(dir);
                while (parent) {
                    if (parent.type === types_1.Status.ADDED) {
                        paths.push(dir);
                    }
                    dir = path.dirname(dir);
                    parent = repository.getResourceFromFile(dir);
                }
            }
            try {
                const message = await messages_1.inputCommitMessage(repository.inputBox.value, true, paths);
                if (message === undefined) {
                    return;
                }
                repository.inputBox.value = message;
                const result = await repository.commitFiles(message, paths);
                vscode_1.window.showInformationMessage(result);
                repository.inputBox.value = "";
            }
            catch (error) {
                console.error(error);
                vscode_1.window.showErrorMessage(error.stderrFormated);
            }
        });
    }
}
exports.Commit = Commit;
//# sourceMappingURL=commit.js.map