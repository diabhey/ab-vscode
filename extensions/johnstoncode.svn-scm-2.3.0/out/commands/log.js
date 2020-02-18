"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const types_1 = require("../common/types");
const uri_1 = require("../uri");
const command_1 = require("./command");
class Log extends command_1.Command {
    constructor() {
        super("svn.log", { repository: true });
    }
    async execute(repository) {
        try {
            const resource = uri_1.toSvnUri(vscode_1.Uri.file(repository.workspaceRoot), types_1.SvnUriAction.LOG);
            const uri = resource.with({
                path: path.join(resource.path, "svn.log") // change document title
            });
            await vscode_1.commands.executeCommand("vscode.open", uri);
        }
        catch (error) {
            console.error(error);
            vscode_1.window.showErrorMessage("Unable to log");
        }
    }
}
exports.Log = Log;
//# sourceMappingURL=log.js.map