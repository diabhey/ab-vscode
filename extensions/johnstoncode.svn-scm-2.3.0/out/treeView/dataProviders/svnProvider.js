"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const repositoryNode_1 = require("../nodes/repositoryNode");
class SvnProvider {
    constructor(sourceControlManager) {
        this.sourceControlManager = sourceControlManager;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this
            ._onDidChangeTreeData.event;
        vscode_1.commands.registerCommand("svn.treeview.refreshProvider", () => this.refresh());
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element.getTreeItem();
    }
    async getChildren(element) {
        if (!this.sourceControlManager || this.sourceControlManager.openRepositories.length === 0) {
            return Promise.resolve([]);
        }
        if (element) {
            return element.getChildren();
        }
        const repositories = this.sourceControlManager.openRepositories.map(repository => {
            return new repositoryNode_1.default(repository.repository, this);
        });
        return repositories;
    }
    update(node) {
        this._onDidChangeTreeData.fire(node);
    }
}
exports.default = SvnProvider;
//# sourceMappingURL=svnProvider.js.map