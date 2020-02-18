"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const types_1 = require("../common/types");
const fs_1 = require("../fs");
async function confirmRevert() {
    const yes = "Yes I'm sure";
    const answer = await vscode_1.window.showWarningMessage("Are you sure? This will wipe all local changes.", { modal: true }, yes);
    if (answer !== yes) {
        return false;
    }
    return true;
}
exports.confirmRevert = confirmRevert;
async function promptDepth() {
    const picks = [];
    for (const depth in types_1.SvnDepth) {
        if (types_1.SvnDepth.hasOwnProperty(depth)) {
            picks.push({ label: depth, description: types_1.SvnDepth[depth] });
        }
    }
    const placeHolder = "Select revert depth";
    const pick = await vscode_1.window.showQuickPick(picks, { placeHolder });
    if (!pick) {
        return undefined;
    }
    return pick.label;
}
exports.promptDepth = promptDepth;
async function checkAndPromptDepth(uris, defaultDepth = "empty") {
    // Without uris, force prompt
    let hasDirectory = uris.length === 0;
    for (const uri of uris) {
        if (uri.scheme !== "file") {
            continue;
        }
        try {
            const stat = await fs_1.lstat(uri.fsPath);
            if (stat.isDirectory()) {
                hasDirectory = true;
                break;
            }
        }
        catch (error) {
            // ignore
        }
    }
    if (hasDirectory) {
        return promptDepth();
    }
    return defaultDepth;
}
exports.checkAndPromptDepth = checkAndPromptDepth;
//# sourceMappingURL=revert.js.map