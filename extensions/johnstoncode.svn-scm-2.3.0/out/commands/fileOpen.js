"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const command_1 = require("./command");
class FileOpen extends command_1.Command {
    constructor() {
        super("svn.fileOpen");
    }
    async execute(resourceUri) {
        await vscode_1.commands.executeCommand("vscode.open", resourceUri);
    }
}
exports.FileOpen = FileOpen;
//# sourceMappingURL=fileOpen.js.map