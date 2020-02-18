"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const changelistItems_1 = require("../changelistItems");
const resource_1 = require("../resource");
const util_1 = require("../util");
const command_1 = require("./command");
class ChangeList extends command_1.Command {
    constructor() {
        super("svn.changelist");
    }
    async execute(...args) {
        let uris;
        if (args[0] instanceof resource_1.Resource) {
            uris = args.map(resource => resource.resourceUri);
        }
        else if (args[0] instanceof vscode_1.Uri) {
            uris = args[1];
        }
        else if (vscode_1.window.activeTextEditor) {
            uris = [vscode_1.window.activeTextEditor.document.uri];
        }
        else {
            console.error("Unhandled type for changelist command");
            return;
        }
        const sourceControlManager = (await vscode_1.commands.executeCommand("svn.getSourceControlManager", ""));
        const promiseArray = uris.map(async (uri) => sourceControlManager.getRepositoryFromUri(uri));
        let repositories = await Promise.all(promiseArray);
        repositories = repositories.filter(repository => repository);
        if (repositories.length === 0) {
            vscode_1.window.showErrorMessage("Files are not under version control and cannot be added to a change list");
            return;
        }
        const uniqueRepositories = Array.from(new Set(repositories));
        if (uniqueRepositories.length !== 1) {
            vscode_1.window.showErrorMessage("Unable to add files from different repositories to change list");
            return;
        }
        if (repositories.length !== uris.length) {
            vscode_1.window.showErrorMessage("Some Files are not under version control and cannot be added to a change list");
            return;
        }
        const repository = repositories[0];
        if (!repository) {
            return;
        }
        const paths = uris.map(uri => uri.fsPath);
        let canRemove = false;
        repository.changelists.forEach((group, _changelist) => {
            if (group.resourceStates.some(state => {
                return paths.some(path => {
                    return (util_1.normalizePath(path) === util_1.normalizePath(state.resourceUri.path));
                });
            })) {
                canRemove = true;
                return false;
            }
            return;
        });
        const changelistName = await changelistItems_1.inputSwitchChangelist(repository, canRemove);
        if (!changelistName && changelistName !== false) {
            return;
        }
        if (changelistName === false) {
            try {
                await repository.removeChangelist(paths);
            }
            catch (error) {
                console.log(error);
                vscode_1.window.showErrorMessage(`Unable to remove file "${paths.join(",")}" from changelist`);
            }
        }
        else {
            try {
                await repository.addChangelist(paths, changelistName);
                vscode_1.window.showInformationMessage(`Added files "${paths.join(",")}" to changelist "${changelistName}"`);
            }
            catch (error) {
                console.log(error);
                vscode_1.window.showErrorMessage(`Unable to add file "${paths.join(",")}" to changelist "${changelistName}"`);
            }
        }
    }
}
exports.ChangeList = ChangeList;
//# sourceMappingURL=changeList.js.map