"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const fs_1 = require("../fs");
const resource_1 = require("../resource");
const incomingChangeNode_1 = require("../treeView/nodes/incomingChangeNode");
const uri_1 = require("../uri");
const command_1 = require("./command");
class OpenFile extends command_1.Command {
    constructor() {
        super("svn.openFile");
    }
    async execute(arg, ...resourceStates) {
        const preserveFocus = arg instanceof resource_1.Resource;
        let uris;
        if (arg instanceof vscode_1.Uri) {
            if (arg.scheme === "svn") {
                uris = [vscode_1.Uri.file(uri_1.fromSvnUri(arg).fsPath)];
            }
            else if (arg.scheme === "file") {
                uris = [arg];
            }
        }
        else if (arg instanceof incomingChangeNode_1.default) {
            const resource = new resource_1.Resource(arg.uri, arg.type, undefined, arg.props, true);
            uris = [resource.resourceUri];
        }
        else {
            const resource = arg;
            if (!(resource instanceof resource_1.Resource)) {
                // can happen when called from a keybinding
                // TODO(@JohnstonCode) fix this
                // resource = this.getSCMResource();
            }
            if (resource) {
                uris = [
                    ...resourceStates.map(r => r.resourceUri),
                    resource.resourceUri
                ];
            }
        }
        if (!uris) {
            return;
        }
        const preview = uris.length === 1 ? true : false;
        const activeTextEditor = vscode_1.window.activeTextEditor;
        for (const uri of uris) {
            if ((await fs_1.exists(uri.fsPath)) &&
                (await fs_1.stat(uri.fsPath)).isDirectory()) {
                continue;
            }
            const opts = {
                preserveFocus,
                preview,
                viewColumn: vscode_1.ViewColumn.Active
            };
            if (activeTextEditor &&
                activeTextEditor.document.uri.toString() === uri.toString()) {
                opts.selection = activeTextEditor.selection;
            }
            const document = await vscode_1.workspace.openTextDocument(uri);
            await vscode_1.window.showTextDocument(document, opts);
        }
    }
}
exports.OpenFile = OpenFile;
//# sourceMappingURL=openFile.js.map