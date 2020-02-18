"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const configuration_1 = require("../helpers/configuration");
const util_1 = require("../util");
const command_1 = require("./command");
class Upgrade extends command_1.Command {
    constructor() {
        super("svn.upgrade");
    }
    async execute(folderPath) {
        if (!folderPath) {
            return;
        }
        if (configuration_1.configuration.get("ignoreWorkingCopyIsTooOld", false)) {
            return;
        }
        folderPath = util_1.fixPathSeparator(folderPath);
        const yes = "Yes";
        const no = "No";
        const neverShowAgain = "Don't Show Again";
        const choice = await vscode_1.window.showWarningMessage("You want upgrade the working copy (svn upgrade)?", yes, no, neverShowAgain);
        const sourceControlManager = (await vscode_1.commands.executeCommand("svn.getSourceControlManager", ""));
        if (choice === yes) {
            const upgraded = await sourceControlManager.upgradeWorkingCopy(folderPath);
            if (upgraded) {
                vscode_1.window.showInformationMessage(`Working copy "${folderPath}" upgraded`);
                sourceControlManager.tryOpenRepository(folderPath);
            }
            else {
                vscode_1.window.showErrorMessage(`Error on upgrading working copy "${folderPath}". See log for more detail`);
            }
        }
        else if (choice === neverShowAgain) {
            return configuration_1.configuration.update("ignoreWorkingCopyIsTooOld", true);
        }
        return;
    }
}
exports.Upgrade = Upgrade;
//# sourceMappingURL=upgrade.js.map