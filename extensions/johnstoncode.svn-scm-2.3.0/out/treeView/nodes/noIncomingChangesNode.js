"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class NoIncomingChangesNode {
    getTreeItem() {
        const item = new vscode_1.TreeItem("No Incoming Changes", vscode_1.TreeItemCollapsibleState.None);
        return item;
    }
    async getChildren() {
        return [];
    }
}
exports.default = NoIncomingChangesNode;
//# sourceMappingURL=noIncomingChangesNode.js.map