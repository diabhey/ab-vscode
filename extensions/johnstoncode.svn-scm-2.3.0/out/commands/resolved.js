"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const configuration_1 = require("../helpers/configuration");
const command_1 = require("./command");
class Resolved extends command_1.Command {
    constructor() {
        super("svn.resolved");
    }
    async execute(uri) {
        if (!uri) {
            return;
        }
        const autoResolve = configuration_1.configuration.get("conflict.autoResolve");
        if (!autoResolve) {
            const basename = path.basename(uri.fsPath);
            const pick = await vscode_1.window.showWarningMessage(`Mark the conflict as resolved for "${basename}"?`, { modal: true }, "Yes", "No");
            if (pick !== "Yes") {
                return;
            }
        }
        const uris = [uri];
        await this.runByRepository(uris, async (repository, resources) => {
            if (!repository) {
                return;
            }
            const files = resources.map(resource => resource.fsPath);
            await repository.resolve(files, "working");
        });
    }
}
exports.Resolved = Resolved;
//# sourceMappingURL=resolved.js.map