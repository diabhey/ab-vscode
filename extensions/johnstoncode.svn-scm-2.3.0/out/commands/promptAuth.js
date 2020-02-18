"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const command_1 = require("./command");
class PromptAuth extends command_1.Command {
    constructor() {
        super("svn.promptAuth");
    }
    async execute(prevUsername, prevPassword) {
        const username = await vscode_1.window.showInputBox({
            placeHolder: "Svn repository username",
            prompt: "Please enter your username",
            value: prevUsername
        });
        if (username === undefined) {
            return;
        }
        const password = await vscode_1.window.showInputBox({
            placeHolder: "Svn repository password",
            prompt: "Please enter your password",
            value: prevPassword,
            password: true
        });
        if (password === undefined) {
            return;
        }
        const auth = {
            username,
            password
        };
        return auth;
    }
}
exports.PromptAuth = PromptAuth;
//# sourceMappingURL=promptAuth.js.map