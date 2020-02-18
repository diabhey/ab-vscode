"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const command_1 = require("./command");
class RevertChange extends command_1.Command {
    constructor() {
        super("svn.revertChange");
    }
    async execute(uri, changes, index) {
        const textEditor = vscode_1.window.visibleTextEditors.filter(e => e.document.uri.toString() === uri.toString())[0];
        if (!textEditor) {
            return;
        }
        await this._revertChanges(textEditor, [
            ...changes.slice(0, index),
            ...changes.slice(index + 1)
        ]);
    }
}
exports.RevertChange = RevertChange;
//# sourceMappingURL=revertChange.js.map