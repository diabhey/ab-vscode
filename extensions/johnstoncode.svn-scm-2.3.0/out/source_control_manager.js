"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const types_1 = require("./common/types");
const decorators_1 = require("./decorators");
const fs_1 = require("./fs");
const configuration_1 = require("./helpers/configuration");
const remoteRepository_1 = require("./remoteRepository");
const repository_1 = require("./repository");
const svn_1 = require("./svn");
const svnError_1 = require("./svnError");
const util_1 = require("./util");
const globMatch_1 = require("./util/globMatch");
class SourceControlManager {
    constructor(_svn, policy) {
        this._svn = _svn;
        this._onDidOpenRepository = new vscode_1.EventEmitter();
        this.onDidOpenRepository = this
            ._onDidOpenRepository.event;
        this._onDidCloseRepository = new vscode_1.EventEmitter();
        this.onDidCloseRepository = this
            ._onDidCloseRepository.event;
        this._onDidChangeRepository = new vscode_1.EventEmitter();
        this.onDidChangeRepository = this
            ._onDidChangeRepository.event;
        this._onDidChangeStatusRepository = new vscode_1.EventEmitter();
        this.onDidChangeStatusRepository = this
            ._onDidChangeStatusRepository.event;
        this.openRepositories = [];
        this.disposables = [];
        this.enabled = false;
        this.possibleSvnRepositoryPaths = new Set();
        this.ignoreList = [];
        this.maxDepth = 0;
        if (policy !== types_1.ConstructorPolicy.Async) {
            throw new Error("Unsopported policy");
        }
        this.enabled = configuration_1.configuration.get("enabled") === true;
        this.configurationChangeDisposable = vscode_1.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration, this);
        return (async () => {
            if (this.enabled) {
                await this.enable();
            }
            return this;
        })();
    }
    get repositories() {
        return this.openRepositories.map(r => r.repository);
    }
    get svn() {
        return this._svn;
    }
    openRepositoriesSorted() {
        // Sort by path length (First external and ignored over root)
        return this.openRepositories.sort((a, b) => b.repository.workspaceRoot.length - a.repository.workspaceRoot.length);
    }
    onDidChangeConfiguration() {
        const enabled = configuration_1.configuration.get("enabled") === true;
        this.maxDepth = configuration_1.configuration.get("multipleFolders.depth", 0);
        if (enabled === this.enabled) {
            return;
        }
        this.enabled = enabled;
        if (enabled) {
            this.enable();
        }
        else {
            this.disable();
        }
    }
    async enable() {
        const multipleFolders = configuration_1.configuration.get("multipleFolders.enabled", false);
        if (multipleFolders) {
            this.maxDepth = configuration_1.configuration.get("multipleFolders.depth", 0);
            this.ignoreList = configuration_1.configuration.get("multipleFolders.ignore", []);
        }
        vscode_1.workspace.onDidChangeWorkspaceFolders(this.onDidChangeWorkspaceFolders, this, this.disposables);
        const fsWatcher = vscode_1.workspace.createFileSystemWatcher("**");
        this.disposables.push(fsWatcher);
        const onWorkspaceChange = util_1.anyEvent(fsWatcher.onDidChange, fsWatcher.onDidCreate, fsWatcher.onDidDelete);
        const onPossibleSvnRepositoryChange = util_1.filterEvent(onWorkspaceChange, uri => !this.getRepository(uri));
        onPossibleSvnRepositoryChange(this.onPossibleSvnRepositoryChange, this, this.disposables);
        await this.scanWorkspaceFolders();
    }
    onPossibleSvnRepositoryChange(uri) {
        const possibleSvnRepositoryPath = uri.fsPath.replace(/\.svn.*$/, "");
        this.eventuallyScanPossibleSvnRepository(possibleSvnRepositoryPath);
    }
    eventuallyScanPossibleSvnRepository(path) {
        this.possibleSvnRepositoryPaths.add(path);
        this.eventuallyScanPossibleSvnRepositories();
    }
    eventuallyScanPossibleSvnRepositories() {
        for (const path of this.possibleSvnRepositoryPaths) {
            this.tryOpenRepository(path, 1);
        }
        this.possibleSvnRepositoryPaths.clear();
    }
    scanExternals(repository) {
        const shouldScanExternals = configuration_1.configuration.get("detectExternals") === true;
        if (!shouldScanExternals) {
            return;
        }
        repository.statusExternal
            .map(r => path.join(repository.workspaceRoot, r.path))
            .forEach(p => this.eventuallyScanPossibleSvnRepository(p));
    }
    scanIgnored(repository) {
        const shouldScan = configuration_1.configuration.get("detectIgnored") === true;
        if (!shouldScan) {
            return;
        }
        repository.statusIgnored
            .map(r => path.join(repository.workspaceRoot, r.path))
            .forEach(p => this.eventuallyScanPossibleSvnRepository(p));
    }
    disable() {
        this.repositories.forEach(repository => repository.dispose());
        this.openRepositories = [];
        this.possibleSvnRepositoryPaths.clear();
        this.disposables = util_1.dispose(this.disposables);
    }
    async onDidChangeWorkspaceFolders({ added, removed }) {
        const possibleRepositoryFolders = added.filter(folder => !this.getOpenRepository(folder.uri));
        const openRepositoriesToDispose = removed
            .map(folder => this.getOpenRepository(folder.uri.fsPath))
            .filter(repository => !!repository)
            .filter(repository => !(vscode_1.workspace.workspaceFolders || []).some(f => repository.repository.workspaceRoot.startsWith(f.uri.fsPath)));
        possibleRepositoryFolders.forEach(p => this.tryOpenRepository(p.uri.fsPath));
        openRepositoriesToDispose.forEach(r => r.repository.dispose());
    }
    async scanWorkspaceFolders() {
        for (const folder of vscode_1.workspace.workspaceFolders || []) {
            const root = folder.uri.fsPath;
            await this.tryOpenRepository(root);
        }
    }
    async tryOpenRepository(path, level = 0) {
        if (this.getRepository(path)) {
            return;
        }
        const checkParent = level === 0;
        if (await util_1.isSvnFolder(path, checkParent)) {
            // Config based on folder path
            const resourceConfig = vscode_1.workspace.getConfiguration("svn", vscode_1.Uri.file(path));
            const ignoredRepos = new Set((resourceConfig.get("ignoreRepositories") || []).map(p => util_1.normalizePath(p)));
            if (ignoredRepos.has(util_1.normalizePath(path))) {
                return;
            }
            try {
                const repositoryRoot = await this.svn.getRepositoryRoot(path);
                const repository = new repository_1.Repository(await this.svn.open(repositoryRoot, path));
                this.open(repository);
            }
            catch (err) {
                if (err instanceof svnError_1.default) {
                    if (err.svnErrorCode === svn_1.svnErrorCodes.WorkingCopyIsTooOld) {
                        await vscode_1.commands.executeCommand("svn.upgrade", path);
                        return;
                    }
                }
                console.error(err);
            }
            return;
        }
        const newLevel = level + 1;
        if (newLevel <= this.maxDepth) {
            let files = [];
            try {
                files = await fs_1.readdir(path);
            }
            catch (error) {
                return;
            }
            for (const file of files) {
                const dir = path + "/" + file;
                let stats;
                try {
                    stats = await fs_1.stat(dir);
                }
                catch (error) {
                    continue;
                }
                if (stats.isDirectory() &&
                    !globMatch_1.matchAll(dir, this.ignoreList, { dot: true })) {
                    await this.tryOpenRepository(dir, newLevel);
                }
            }
        }
    }
    async getRemoteRepository(uri) {
        return remoteRepository_1.RemoteRepository.open(this.svn, uri);
    }
    getRepository(hint) {
        const liveRepository = this.getOpenRepository(hint);
        if (liveRepository && liveRepository.repository) {
            return liveRepository.repository;
        }
        return null;
    }
    getOpenRepository(hint) {
        if (!hint) {
            return undefined;
        }
        if (hint instanceof repository_1.Repository) {
            return this.openRepositories.find(r => r.repository === hint);
        }
        if (hint.repository instanceof repository_1.Repository) {
            return this.openRepositories.find(r => r.repository === hint.repository);
        }
        if (typeof hint === "string") {
            hint = vscode_1.Uri.file(hint);
        }
        if (hint instanceof vscode_1.Uri) {
            return this.openRepositoriesSorted().find(liveRepository => {
                if (!util_1.isDescendant(liveRepository.repository.workspaceRoot, hint.fsPath)) {
                    return false;
                }
                for (const external of liveRepository.repository.statusExternal) {
                    const externalPath = path.join(liveRepository.repository.workspaceRoot, external.path);
                    if (util_1.isDescendant(externalPath, hint.fsPath)) {
                        return false;
                    }
                }
                for (const ignored of liveRepository.repository.statusIgnored) {
                    const ignoredPath = path.join(liveRepository.repository.workspaceRoot, ignored.path);
                    if (util_1.isDescendant(ignoredPath, hint.fsPath)) {
                        return false;
                    }
                }
                return true;
            });
        }
        for (const liveRepository of this.openRepositories) {
            const repository = liveRepository.repository;
            if (hint === repository.sourceControl) {
                return liveRepository;
            }
            if (hint === repository.changes) {
                return liveRepository;
            }
        }
        return undefined;
    }
    async getRepositoryFromUri(uri) {
        for (const liveRepository of this.openRepositoriesSorted()) {
            const repository = liveRepository.repository;
            // Ignore path is not child (fix for multiple externals)
            if (!util_1.isDescendant(repository.workspaceRoot, uri.fsPath)) {
                continue;
            }
            try {
                const path = util_1.normalizePath(uri.fsPath);
                await repository.info(path);
                return repository;
            }
            catch (error) {
                // Ignore
            }
        }
        return null;
    }
    open(repository) {
        const onDidDisappearRepository = util_1.filterEvent(repository.onDidChangeState, state => state === types_1.RepositoryState.Disposed);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const disappearListener = onDidDisappearRepository(() => dispose());
        const changeListener = repository.onDidChangeRepository(uri => this._onDidChangeRepository.fire({ repository, uri }));
        const changeStatus = repository.onDidChangeStatus(() => {
            this._onDidChangeStatusRepository.fire(repository);
        });
        const statusListener = repository.onDidChangeStatus(() => {
            this.scanExternals(repository);
            this.scanIgnored(repository);
        });
        this.scanExternals(repository);
        this.scanIgnored(repository);
        const dispose = () => {
            disappearListener.dispose();
            changeListener.dispose();
            changeStatus.dispose();
            statusListener.dispose();
            repository.dispose();
            this.openRepositories = this.openRepositories.filter(
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            e => e !== openRepository);
            this._onDidCloseRepository.fire(repository);
        };
        const openRepository = { repository, dispose };
        this.openRepositories.push(openRepository);
        this._onDidOpenRepository.fire(repository);
    }
    close(repository) {
        const openRepository = this.getOpenRepository(repository);
        if (!openRepository) {
            return;
        }
        openRepository.dispose();
    }
    async pickRepository() {
        if (this.openRepositories.length === 0) {
            throw new Error("There are no available repositories");
        }
        const picks = this.repositories.map(repository => {
            return {
                label: path.basename(repository.root),
                repository
            };
        });
        const placeHolder = "Choose a repository";
        const pick = await vscode_1.window.showQuickPick(picks, { placeHolder });
        return pick && pick.repository;
    }
    async upgradeWorkingCopy(folderPath) {
        try {
            const result = await this.svn.exec(folderPath, ["upgrade"]);
            return result.exitCode === 0;
        }
        catch (e) {
            console.log(e);
        }
        return false;
    }
    dispose() {
        this.disable();
        this.configurationChangeDisposable.dispose();
    }
}
__decorate([
    decorators_1.debounce(500)
], SourceControlManager.prototype, "eventuallyScanPossibleSvnRepositories", null);
exports.SourceControlManager = SourceControlManager;
//# sourceMappingURL=source_control_manager.js.map