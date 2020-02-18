"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const resource_1 = require("../resource");
const incomingChangeNode_1 = require("../treeView/nodes/incomingChangeNode");
const command_1 = require("./command");
class OpenHeadFile extends command_1.Command {
    constructor() {
        super("svn.openHEADFile");
    }
    async execute(arg) {
        let resource;
        if (arg instanceof resource_1.Resource) {
            resource = arg;
        }
        else if (arg instanceof vscode_1.Uri) {
            resource = await this.getSCMResource(arg);
        }
        else if (arg instanceof incomingChangeNode_1.default) {
            resource = new resource_1.Resource(arg.uri, arg.type, undefined, arg.props, true);
        }
        else {
            resource = await this.getSCMResource();
        }
        if (!resource) {
            return;
        }
        const HEAD = await this.getLeftResource(resource, "HEAD");
        const basename = path.basename(resource.resourceUri.fsPath);
        if (!HEAD) {
            vscode_1.window.showWarningMessage(`"HEAD version of '${basename}' is not available."`);
            return;
        }
        const basedir = path.dirname(resource.resourceUri.fsPath);
        const uri = HEAD.with({
            path: path.join(basedir, `(HEAD) ${basename}`) // change document title
        });
        return vscode_1.commands.executeCommand("vscode.open", uri, {
            preview: true
        });
    }
}
exports.OpenHeadFile = OpenHeadFile;
//# sourceMappingURL=openHeadFile.js.map