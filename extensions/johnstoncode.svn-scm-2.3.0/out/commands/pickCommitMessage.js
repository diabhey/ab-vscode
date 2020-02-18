"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const command_1 = require("./command");
class PickCommitMessage extends command_1.Command {
    constructor() {
        super("svn.pickCommitMessage", { repository: true });
    }
    async execute(repository) {
        const logs = await repository.log("HEAD", "0", 20);
        if (!logs.length) {
            return;
        }
        const picks = logs.map(l => {
            return {
                label: l.msg,
                description: `r${l.revision} | ${l.author} | ${new Date(l.date).toLocaleString()}`
            };
        });
        const selected = await vscode_1.window.showQuickPick(picks);
        if (selected === undefined) {
            return;
        }
        const msg = selected.label;
        repository.inputBox.value = msg;
        return msg;
    }
}
exports.PickCommitMessage = PickCommitMessage;
//# sourceMappingURL=pickCommitMessage.js.map