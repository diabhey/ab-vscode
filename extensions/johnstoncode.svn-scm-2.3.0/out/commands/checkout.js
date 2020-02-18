"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const path = require("path");
const vscode_1 = require("vscode");
const branch_1 = require("../helpers/branch");
const configuration_1 = require("../helpers/configuration");
const svn_1 = require("../svn");
const command_1 = require("./command");
class Checkout extends command_1.Command {
    constructor() {
        super("svn.checkout");
    }
    async execute(url) {
        if (!url) {
            url = await vscode_1.window.showInputBox({
                prompt: "Repository URL",
                ignoreFocusOut: true
            });
        }
        if (!url) {
            return;
        }
        let defaultCheckoutDirectory = configuration_1.configuration.get("defaultCheckoutDirectory") || os.homedir();
        defaultCheckoutDirectory = defaultCheckoutDirectory.replace(/^~/, os.homedir());
        const uris = await vscode_1.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: vscode_1.Uri.file(defaultCheckoutDirectory),
            openLabel: "Select Repository Location"
        });
        if (!uris || uris.length === 0) {
            return;
        }
        const uri = uris[0];
        const parentPath = uri.fsPath;
        let folderName;
        // Get folder name from branch
        const branch = branch_1.getBranchName(url);
        if (branch) {
            const baseUrl = url.replace(/\//g, "/").replace(branch.path, "");
            folderName = path.basename(baseUrl);
        }
        folderName = await vscode_1.window.showInputBox({
            prompt: "Folder name",
            value: folderName,
            ignoreFocusOut: true
        });
        if (!folderName) {
            return;
        }
        const repositoryPath = path.join(parentPath, folderName);
        // Use Notification location if supported
        let location = vscode_1.ProgressLocation.Window;
        if (vscode_1.ProgressLocation.Notification) {
            location = vscode_1.ProgressLocation.Notification;
        }
        const progressOptions = {
            location,
            title: `Checkout svn repository '${url}'...`,
            cancellable: true
        };
        let attempt = 0;
        const opt = {};
        while (true) {
            attempt++;
            try {
                await vscode_1.window.withProgress(progressOptions, async () => {
                    const sourceControlManager = (await vscode_1.commands.executeCommand("svn.getSourceControlManager", ""));
                    const args = ["checkout", url, repositoryPath];
                    await sourceControlManager.svn.exec(parentPath, args, opt);
                });
                break;
            }
            catch (err) {
                if (err.svnErrorCode === svn_1.svnErrorCodes.AuthorizationFailed &&
                    attempt <= 3) {
                    const auth = (await vscode_1.commands.executeCommand("svn.promptAuth", opt.username));
                    if (auth) {
                        opt.username = auth.username;
                        opt.password = auth.password;
                        continue;
                    }
                }
                throw err;
            }
        }
        const choices = [];
        let message = "Would you like to open the checked out repository?";
        const open = "Open Repository";
        choices.push(open);
        const addToWorkspace = "Add to Workspace";
        if (vscode_1.workspace.workspaceFolders &&
            vscode_1.workspace.updateWorkspaceFolders // For VSCode >= 1.21
        ) {
            message =
                "Would you like to open the checked out repository, or add it to the current workspace?";
            choices.push(addToWorkspace);
        }
        const result = await vscode_1.window.showInformationMessage(message, ...choices);
        const openFolder = result === open;
        if (openFolder) {
            vscode_1.commands.executeCommand("vscode.openFolder", vscode_1.Uri.file(repositoryPath));
        }
        else if (result === addToWorkspace) {
            // For VSCode >= 1.21
            vscode_1.workspace.updateWorkspaceFolders(vscode_1.workspace.workspaceFolders.length, 0, {
                uri: vscode_1.Uri.file(repositoryPath)
            });
        }
    }
}
exports.Checkout = Checkout;
//# sourceMappingURL=checkout.js.map