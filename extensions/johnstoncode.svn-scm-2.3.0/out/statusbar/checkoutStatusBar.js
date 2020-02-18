"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const types_1 = require("../common/types");
class CheckoutStatusBar {
    constructor(repository) {
        this.repository = repository;
        this._onDidChange = new vscode_1.EventEmitter();
        this.disposables = [];
        repository.onDidChangeStatus(this._onDidChange.fire, this._onDidChange, this.disposables);
        repository.onDidChangeOperations(this._onDidChange.fire, this._onDidChange, this.disposables);
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    get command() {
        if (!this.repository.currentBranch) {
            return;
        }
        const isSwitchRunning = this.repository.operations.isRunning(types_1.Operation.SwitchBranch) ||
            this.repository.operations.isRunning(types_1.Operation.NewBranch);
        const title = `$(git-branch) ${this.repository.currentBranch}${isSwitchRunning ? ` (Switching)` : ""}`;
        return {
            command: "svn.switchBranch",
            tooltip: "Switch Branch...",
            title,
            arguments: [this.repository.sourceControl]
        };
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
exports.CheckoutStatusBar = CheckoutStatusBar;
//# sourceMappingURL=checkoutStatusBar.js.map