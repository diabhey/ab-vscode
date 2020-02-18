"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const types_1 = require("../common/types");
class SyncStatusBar {
    constructor(repository) {
        this.repository = repository;
        this._onDidChange = new vscode_1.EventEmitter();
        this.disposables = [];
        this._state = SyncStatusBar.startState;
        repository.onDidChangeStatus(this.onModelChange, this, this.disposables);
        repository.onDidChangeOperations(this.onOperationsChange, this, this.disposables);
        this._onDidChange.fire();
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    get state() {
        return this._state;
    }
    set state(state) {
        this._state = state;
        this._onDidChange.fire();
    }
    onOperationsChange() {
        const isSyncRunning = this.repository.operations.isRunning(types_1.Operation.SwitchBranch) ||
            this.repository.operations.isRunning(types_1.Operation.NewBranch) ||
            this.repository.operations.isRunning(types_1.Operation.Update);
        const isStatusRemoteRunning = this.repository.operations.isRunning(types_1.Operation.StatusRemote);
        const isOperationRunning = !this.repository.operations.isIdle();
        this.state = {
            ...this.state,
            isStatusRemoteRunning,
            isOperationRunning,
            isSyncRunning
        };
    }
    onModelChange() {
        this.state = {
            ...this.state,
            remoteChangedFiles: this.repository.remoteChangedFiles
        };
    }
    get command() {
        let icon = "$(sync)";
        let text = "";
        let command = "";
        let tooltip = "";
        if (this.state.isSyncRunning) {
            command = "";
            icon = "$(sync~spin)";
            text = "";
            tooltip = "Updating Revision...";
        }
        else if (this.state.isStatusRemoteRunning) {
            command = "";
            icon = "$(sync~spin)";
            text = "";
            tooltip = "Checking remote updates...";
        }
        else if (this.state.isOperationRunning) {
            command = "";
            icon = "$(sync~spin)";
            text = "Running";
            tooltip = "Running...";
        }
        else if (this.state.needCleanUp) {
            command = "svn.cleanup";
            icon = "$(alert)";
            text = "Need cleanup";
            tooltip = "Run cleanup command";
        }
        else if (this.state.isIncomplete) {
            command = "svn.finishCheckout";
            icon = "$(issue-reopened)";
            text = "Incomplete (Need finish checkout)";
            tooltip = "Run update to complete";
        }
        else if (this.state.remoteChangedFiles > 0) {
            icon = "$(cloud-download)";
            command = "svn.update";
            tooltip = "Update Revision";
            text = `${this.state.remoteChangedFiles}↓`;
        }
        else {
            command = "svn.update";
            tooltip = "Update Revision";
        }
        return {
            command,
            title: [icon, text].join(" ").trim(),
            tooltip,
            arguments: [this.repository]
        };
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
exports.SyncStatusBar = SyncStatusBar;
SyncStatusBar.startState = {
    isIncomplete: false,
    isOperationRunning: false,
    isStatusRemoteRunning: false,
    isSyncRunning: false,
    needCleanUp: false,
    remoteChangedFiles: 0
};
//# sourceMappingURL=syncStatusBar.js.map