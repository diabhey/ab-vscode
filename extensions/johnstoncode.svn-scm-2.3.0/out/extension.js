"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const commands_1 = require("./commands");
const types_1 = require("./common/types");
const checkActiveEditor_1 = require("./contexts/checkActiveEditor");
const openRepositoryCount_1 = require("./contexts/openRepositoryCount");
const configuration_1 = require("./helpers/configuration");
const itemLogProvider_1 = require("./historyView/itemLogProvider");
const repoLogProvider_1 = require("./historyView/repoLogProvider");
const messages = require("./messages");
const source_control_manager_1 = require("./source_control_manager");
const svn_1 = require("./svn");
const svnContentProvider_1 = require("./svnContentProvider");
const svnFinder_1 = require("./svnFinder");
const svnProvider_1 = require("./treeView/dataProviders/svnProvider");
const util_1 = require("./util");
const branchChangesProvider_1 = require("./historyView/branchChangesProvider");
async function init(_context, outputChannel, disposables) {
    const pathHint = configuration_1.configuration.get("path");
    const svnFinder = new svnFinder_1.SvnFinder();
    const info = await svnFinder.findSvn(pathHint);
    const svn = new svn_1.Svn({ svnPath: info.path, version: info.version });
    const sourceControlManager = await new source_control_manager_1.SourceControlManager(svn, types_1.ConstructorPolicy.Async);
    const contentProvider = new svnContentProvider_1.SvnContentProvider(sourceControlManager);
    commands_1.registerCommands(sourceControlManager, disposables);
    disposables.push(sourceControlManager, contentProvider);
    const svnProvider = new svnProvider_1.default(sourceControlManager);
    vscode_1.window.registerTreeDataProvider("svn", svnProvider);
    const repoLogProvider = new repoLogProvider_1.RepoLogProvider(sourceControlManager);
    disposables.push(repoLogProvider);
    vscode_1.window.registerTreeDataProvider("repolog", repoLogProvider);
    const itemLogProvider = new itemLogProvider_1.ItemLogProvider(sourceControlManager);
    disposables.push(itemLogProvider);
    vscode_1.window.registerTreeDataProvider("itemlog", itemLogProvider);
    const branchChangesProvider = new branchChangesProvider_1.BranchChangesProvider(sourceControlManager);
    disposables.push(branchChangesProvider);
    vscode_1.window.registerTreeDataProvider("branchchanges", branchChangesProvider);
    disposables.push(new checkActiveEditor_1.CheckActiveEditor(sourceControlManager));
    disposables.push(new openRepositoryCount_1.OpenRepositoryCount(sourceControlManager));
    outputChannel.appendLine(`Using svn "${info.version}" from "${info.path}"`);
    const onOutput = (str) => outputChannel.append(str);
    svn.onOutput.addListener("log", onOutput);
    disposables.push(util_1.toDisposable(() => svn.onOutput.removeListener("log", onOutput)));
    disposables.push(util_1.toDisposable(messages.dispose));
}
async function _activate(context, disposables) {
    const outputChannel = vscode_1.window.createOutputChannel("Svn");
    vscode_1.commands.registerCommand("svn.showOutput", () => outputChannel.show());
    disposables.push(outputChannel);
    const showOutput = configuration_1.configuration.get("showOutput");
    if (showOutput) {
        outputChannel.show();
    }
    const tryInit = async () => {
        try {
            await init(context, outputChannel, disposables);
        }
        catch (err) {
            if (!/Svn installation not found/.test(err.message || "")) {
                throw err;
            }
            const shouldIgnore = configuration_1.configuration.get("ignoreMissingSvnWarning") === true;
            if (shouldIgnore) {
                return;
            }
            console.warn(err.message);
            outputChannel.appendLine(err.message);
            outputChannel.show();
            const findSvnExecutable = "Find SVN executable";
            const download = "Download SVN";
            const neverShowAgain = "Don't Show Again";
            const choice = await vscode_1.window.showWarningMessage("SVN not found. Install it or configure it using the 'svn.path' setting.", findSvnExecutable, download, neverShowAgain);
            if (choice === findSvnExecutable) {
                let filters;
                // For windows, limit to executable files
                if (path.sep === "\\") {
                    filters = {
                        svn: ["exe", "bat"]
                    };
                }
                const executable = await vscode_1.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters
                });
                if (executable && executable[0]) {
                    const file = executable[0].fsPath;
                    outputChannel.appendLine(`Updated "svn.path" with "${file}"`);
                    await configuration_1.configuration.update("path", file);
                    // Try Re-init after select the executable
                    await tryInit();
                }
            }
            else if (choice === download) {
                vscode_1.commands.executeCommand("vscode.open", vscode_1.Uri.parse("https://subversion.apache.org/packages.html"));
            }
            else if (choice === neverShowAgain) {
                await configuration_1.configuration.update("ignoreMissingSvnWarning", true);
            }
        }
    };
    await tryInit();
}
async function activate(context) {
    const disposables = [];
    context.subscriptions.push(new vscode_1.Disposable(() => vscode_1.Disposable.from(...disposables).dispose()));
    await _activate(context, disposables).catch(err => console.error(err));
}
exports.activate = activate;
// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map