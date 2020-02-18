"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const uri_1 = require("../../uri");
const incomingChangesNode_1 = require("./incomingChangesNode");
class RepositoryNode {
    constructor(repository, svnProvider) {
        this.repository = repository;
        this.svnProvider = svnProvider;
        repository.onDidChangeStatus(() => {
            this.svnProvider.update(this);
        });
    }
    get label() {
        return path.basename(this.repository.workspaceRoot);
    }
    getTreeItem() {
        const item = new vscode_1.TreeItem(this.label, vscode_1.TreeItemCollapsibleState.Collapsed);
        item.iconPath = {
            dark: uri_1.getIconUri("repo", "dark"),
            light: uri_1.getIconUri("repo", "light")
        };
        return item;
    }
    async getChildren() {
        return [new incomingChangesNode_1.default(this.repository)];
    }
}
exports.default = RepositoryNode;
//# sourceMappingURL=repositoryNode.js.map