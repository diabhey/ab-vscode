"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const types_1 = require("../common/types");
const decorators_1 = require("../decorators");
class CheckActiveEditor {
    constructor(sourceControlManager) {
        this.sourceControlManager = sourceControlManager;
        this.disposables = [];
        // When repository update, like update
        sourceControlManager.onDidChangeStatusRepository(this.checkHasChangesOnActiveEditor, this, this.disposables);
        vscode_1.window.onDidChangeActiveTextEditor(() => this.checkHasChangesOnActiveEditor(), this, this.disposables);
    }
    checkHasChangesOnActiveEditor() {
        vscode_1.commands.executeCommand("setContext", "svnActiveEditorHasChanges", this.hasChangesOnActiveEditor());
    }
    hasChangesOnActiveEditor() {
        if (!vscode_1.window.activeTextEditor) {
            return false;
        }
        const uri = vscode_1.window.activeTextEditor.document.uri;
        const repository = this.sourceControlManager.getRepository(uri);
        if (!repository) {
            return false;
        }
        const resource = repository.getResourceFromFile(uri);
        if (!resource) {
            return false;
        }
        switch (resource.type) {
            case types_1.Status.ADDED:
            case types_1.Status.DELETED:
            case types_1.Status.EXTERNAL:
            case types_1.Status.IGNORED:
            case types_1.Status.NONE:
            case types_1.Status.NORMAL:
            case types_1.Status.UNVERSIONED:
                return false;
            case types_1.Status.CONFLICTED:
            case types_1.Status.INCOMPLETE:
            case types_1.Status.MERGED:
            case types_1.Status.MISSING:
            case types_1.Status.MODIFIED:
            case types_1.Status.OBSTRUCTED:
            case types_1.Status.REPLACED:
                return true;
        }
        // Show if not match
        return true;
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
__decorate([
    decorators_1.debounce(100)
], CheckActiveEditor.prototype, "checkHasChangesOnActiveEditor", null);
exports.CheckActiveEditor = CheckActiveEditor;
//# sourceMappingURL=checkActiveEditor.js.map