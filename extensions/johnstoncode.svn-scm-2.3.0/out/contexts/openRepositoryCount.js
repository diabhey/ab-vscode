"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const decorators_1 = require("../decorators");
class OpenRepositoryCount {
    constructor(sourceControlManager) {
        this.sourceControlManager = sourceControlManager;
        this.disposables = [];
        // When repository Opened or closed
        sourceControlManager.onDidOpenRepository(this.checkOpened, this, this.disposables);
        sourceControlManager.onDidCloseRepository(this.checkOpened, this, this.disposables);
        this.checkOpened();
    }
    checkOpened() {
        vscode_1.commands.executeCommand("setContext", "svnOpenRepositoryCount", `${this.sourceControlManager.repositories.length}`);
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
__decorate([
    decorators_1.debounce(100)
], OpenRepositoryCount.prototype, "checkOpened", null);
exports.OpenRepositoryCount = OpenRepositoryCount;
//# sourceMappingURL=openRepositoryCount.js.map