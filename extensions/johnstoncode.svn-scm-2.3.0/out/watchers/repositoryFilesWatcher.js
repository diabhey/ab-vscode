"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const fs_1 = require("fs");
const fs_2 = require("../fs");
const path_1 = require("path");
const decorators_1 = require("../decorators");
const util_1 = require("../util");
class RepositoryFilesWatcher {
    constructor(root) {
        this.root = root;
        this.disposables = [];
        const fsWatcher = vscode_1.workspace.createFileSystemWatcher("**");
        this._onRepoChange = new vscode_1.EventEmitter();
        this._onRepoCreate = new vscode_1.EventEmitter();
        this._onRepoDelete = new vscode_1.EventEmitter();
        let onRepoChange;
        let onRepoCreate;
        let onRepoDelete;
        if (typeof vscode_1.workspace.workspaceFolders !== "undefined" &&
            !vscode_1.workspace.workspaceFolders.filter(w => util_1.isDescendant(w.uri.fsPath, root))
                .length) {
            const repoWatcher = fs_1.watch(path_1.join(root, ".svn"), this.repoWatch);
            repoWatcher.on("error", error => {
                throw error;
            });
            onRepoChange = this._onRepoChange.event;
            onRepoCreate = this._onRepoCreate.event;
            onRepoDelete = this._onRepoDelete.event;
        }
        this.disposables.push(fsWatcher);
        const isTmp = (uri) => /[\\\/]\.svn[\\\/]tmp/.test(uri.path);
        const isRelevant = (uri) => !isTmp(uri) && util_1.isDescendant(this.root, uri.fsPath);
        this.onDidChange = util_1.filterEvent(fsWatcher.onDidChange, isRelevant);
        this.onDidCreate = util_1.filterEvent(fsWatcher.onDidCreate, isRelevant);
        this.onDidDelete = util_1.filterEvent(fsWatcher.onDidDelete, isRelevant);
        this.onDidAny = util_1.anyEvent(this.onDidChange, this.onDidCreate, this.onDidDelete);
        const svnPattern = /[\\\/]\.svn[\\\/]/;
        const ignoreSvn = (uri) => !svnPattern.test(uri.path);
        this.onDidWorkspaceChange = util_1.filterEvent(this.onDidChange, ignoreSvn);
        this.onDidWorkspaceCreate = util_1.filterEvent(this.onDidCreate, ignoreSvn);
        this.onDidWorkspaceDelete = util_1.filterEvent(this.onDidDelete, ignoreSvn);
        this.onDidWorkspaceAny = util_1.anyEvent(this.onDidWorkspaceChange, this.onDidWorkspaceCreate, this.onDidWorkspaceDelete);
        const ignoreWorkspace = (uri) => svnPattern.test(uri.path);
        this.onDidSvnChange = util_1.filterEvent(this.onDidChange, ignoreWorkspace);
        this.onDidSvnCreate = util_1.filterEvent(this.onDidCreate, ignoreWorkspace);
        this.onDidSvnDelete = util_1.filterEvent(this.onDidDelete, ignoreWorkspace);
        if (onRepoChange && onRepoCreate && onRepoDelete) {
            this.onDidSvnChange = onRepoChange;
            this.onDidSvnCreate = onRepoCreate;
            this.onDidSvnDelete = onRepoDelete;
        }
        this.onDidSvnAny = util_1.anyEvent(this.onDidSvnChange, this.onDidSvnCreate, this.onDidSvnDelete);
    }
    repoWatch(event, filename) {
        if (event === "change") {
            this._onRepoChange.fire(vscode_1.Uri.parse(filename));
        }
        else if (event === "rename") {
            fs_2.exists(filename).then(doesExist => {
                if (doesExist) {
                    this._onRepoCreate.fire(vscode_1.Uri.parse(filename));
                }
                else {
                    this._onRepoDelete.fire(vscode_1.Uri.parse(filename));
                }
            });
        }
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
__decorate([
    decorators_1.debounce(1000)
], RepositoryFilesWatcher.prototype, "repoWatch", null);
exports.RepositoryFilesWatcher = RepositoryFilesWatcher;
//# sourceMappingURL=repositoryFilesWatcher.js.map