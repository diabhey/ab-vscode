"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const configuration_1 = require("./helpers/configuration");
const changeListItem_1 = require("./quickPickItems/changeListItem");
const ignoredChangeListItem_1 = require("./quickPickItems/ignoredChangeListItem");
const newChangeListItem_1 = require("./quickPickItems/newChangeListItem");
const removeChangeListItem_1 = require("./quickPickItems/removeChangeListItem");
function getChangelistPickOptions(repository, canRemove = false) {
    const picks = [];
    picks.push(new newChangeListItem_1.default());
    repository.changelists.forEach((group, _changelist) => {
        if (group.resourceStates.length) {
            picks.push(new changeListItem_1.default(group));
        }
    });
    const ignoreOnCommitList = configuration_1.configuration.get("sourceControl.ignoreOnCommit");
    for (const ignoreOnCommit of ignoreOnCommitList) {
        if (!picks.some(p => p.label === ignoreOnCommit)) {
            picks.push(new ignoredChangeListItem_1.default(ignoreOnCommit));
        }
    }
    if (canRemove) {
        picks.push(new removeChangeListItem_1.default());
    }
    return picks;
}
exports.getChangelistPickOptions = getChangelistPickOptions;
function getCommitChangelistPickOptions(repository) {
    const picks = [];
    if (repository.changes.resourceStates.length) {
        picks.push(new changeListItem_1.default(repository.changes));
    }
    const ignoreOnCommitList = configuration_1.configuration.get("sourceControl.ignoreOnCommit");
    repository.changelists.forEach((group, changelist) => {
        if (group.resourceStates.length &&
            !ignoreOnCommitList.includes(changelist)) {
            picks.push(new changeListItem_1.default(group));
        }
    });
    return picks;
}
exports.getCommitChangelistPickOptions = getCommitChangelistPickOptions;
async function inputSwitchChangelist(repository, canRemove = false) {
    const picks = getChangelistPickOptions(repository, canRemove);
    const selectedChoice = await vscode_1.window.showQuickPick(picks, {
        placeHolder: "Select an existing changelist or create a new"
    });
    if (!selectedChoice) {
        return;
    }
    let changelistName;
    if (selectedChoice instanceof removeChangeListItem_1.default) {
        return false;
    }
    else if (selectedChoice instanceof newChangeListItem_1.default) {
        const newChangelistName = await vscode_1.window.showInputBox({
            placeHolder: "Changelist name",
            prompt: "Please enter a changelist name"
        });
        if (!newChangelistName) {
            return;
        }
        changelistName = newChangelistName;
    }
    else {
        changelistName = selectedChoice.label;
    }
    return changelistName;
}
exports.inputSwitchChangelist = inputSwitchChangelist;
async function inputCommitChangelist(repository) {
    const picks = getCommitChangelistPickOptions(repository);
    if (picks.length === 0) {
        vscode_1.window.showInformationMessage("There are no changes to commit.");
        return;
    }
    let choice;
    // If has only changes, not prompt to select changelist
    if (picks.length === 1 && repository.changes.resourceStates.length) {
        choice = picks[0];
    }
    else {
        choice = await vscode_1.window.showQuickPick(picks, {
            placeHolder: "Select a changelist to commit"
        });
    }
    return choice;
}
exports.inputCommitChangelist = inputCommitChangelist;
function patchChangelistOptions(repository) {
    const picks = [];
    repository.changelists.forEach((group, _changelist) => {
        if (group.resourceStates.length) {
            picks.push(new changeListItem_1.default(group));
        }
    });
    return picks;
}
exports.patchChangelistOptions = patchChangelistOptions;
async function getPatchChangelist(repository) {
    const picks = patchChangelistOptions(repository);
    if (!picks.length) {
        vscode_1.window.showErrorMessage("No changelists to pick from");
        return;
    }
    const selectedChoice = await vscode_1.window.showQuickPick(picks, {
        placeHolder: "Select a changelist"
    });
    if (!selectedChoice) {
        return;
    }
    return selectedChoice.label;
}
exports.getPatchChangelist = getPatchChangelist;
//# sourceMappingURL=changelistItems.js.map