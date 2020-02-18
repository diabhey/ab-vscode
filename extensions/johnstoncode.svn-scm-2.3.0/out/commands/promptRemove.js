"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const configuration_1 = require("../helpers/configuration");
const command_1 = require("./command");
class PromptRemove extends command_1.Command {
    constructor() {
        super("svn.promptRemove", { repository: true });
    }
    async execute(repository, ...uris) {
        const files = uris.map(uri => uri.fsPath);
        const relativeList = files
            .map(file => repository.repository.removeAbsolutePath(file))
            .sort();
        const ignoreText = "Add to ignored list";
        const resp = await vscode_1.window.showInformationMessage(`The file(s) "${relativeList.join(", ")}" are removed from disk.\nWould you like remove from SVN?`, { modal: false }, "Yes", ignoreText, "No");
        if (resp === "Yes") {
            await repository.removeFiles(files, false);
        }
        else if (resp === ignoreText) {
            let ignoreList = configuration_1.configuration.get("delete.ignoredRulesForDeletedFiles", []);
            ignoreList.push(...relativeList);
            ignoreList = [...new Set(ignoreList)]; // Remove duplicates
            configuration_1.configuration.update("delete.ignoredRulesForDeletedFiles", ignoreList);
        }
    }
}
exports.PromptRemove = PromptRemove;
//# sourceMappingURL=promptRemove.js.map