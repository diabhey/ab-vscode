"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const types_1 = require("../common/types");
const common_1 = require("./common");
const util_1 = require("../util");
class BranchChangesProvider {
    constructor(model) {
        this.model = model;
        this._dispose = [];
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._dispose.push(vscode_1.commands.registerCommand("svn.branchchanges.openDiff", this.openDiffCmd, this));
        this._dispose.push(vscode_1.commands.registerCommand("svn.branchchanges.refresh", () => this._onDidChangeTreeData.fire(), this));
        this.model.onDidChangeRepository(() => this._onDidChangeTreeData.fire());
    }
    dispose() {
        util_1.dispose(this._dispose);
    }
    getTreeItem(element) {
        let iconName = "";
        if (element.item === types_1.Status.ADDED) {
            iconName = "status-added";
        }
        else if (element.item === types_1.Status.DELETED) {
            iconName = "status-deleted";
        }
        else if (element.item === types_1.Status.MODIFIED) {
            iconName = "status-modified";
        }
        const iconPath = common_1.getIconObject(iconName);
        return {
            label: element.newPath.toString(),
            command: {
                command: "svn.branchchanges.openDiff",
                title: "Open diff",
                arguments: [element]
            },
            iconPath,
            tooltip: `${element.oldPath}@r${element.oldRevision} → ${element.newPath}@r${element.newRevision}`
        };
    }
    getChildren(element) {
        if (element !== undefined) {
            return Promise.resolve([]);
        }
        const changes = [];
        for (const repo of this.model.repositories) {
            changes.push(repo.getChanges());
        }
        return Promise.all(changes).then(value => value.reduce((prev, curr) => prev.concat(curr), []));
    }
    async openDiffCmd(element) {
        const repo = await this.model.getRemoteRepository(element.repo);
        if (element.item === types_1.Status.MODIFIED) {
            return common_1.openDiff(repo, element.oldPath, element.oldRevision, element.newRevision, element.newPath);
        }
        if (element.item === types_1.Status.ADDED) {
            return common_1.openFileRemote(repo, element.newPath, element.newRevision);
        }
    }
}
exports.BranchChangesProvider = BranchChangesProvider;
//# sourceMappingURL=branchChangesProvider.js.map