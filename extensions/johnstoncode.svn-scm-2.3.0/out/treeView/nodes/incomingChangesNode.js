"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const uri_1 = require("../../uri");
const incomingChangeNode_1 = require("./incomingChangeNode");
const noIncomingChangesNode_1 = require("./noIncomingChangesNode");
class IncomingChangesNode {
    constructor(repository) {
        this.repository = repository;
    }
    getTreeItem() {
        const item = new vscode_1.TreeItem("Incoming Changes", vscode_1.TreeItemCollapsibleState.Collapsed);
        item.iconPath = {
            dark: uri_1.getIconUri("download", "dark"),
            light: uri_1.getIconUri("download", "light")
        };
        return item;
    }
    async getChildren() {
        if (!this.repository.remoteChanges) {
            return [];
        }
        const changes = this.repository.remoteChanges.resourceStates.map(remoteChange => {
            return new incomingChangeNode_1.default(remoteChange.resourceUri, remoteChange.type, this.repository);
        });
        if (changes.length === 0) {
            return [new noIncomingChangesNode_1.default()];
        }
        return changes;
    }
}
exports.default = IncomingChangesNode;
//# sourceMappingURL=incomingChangesNode.js.map