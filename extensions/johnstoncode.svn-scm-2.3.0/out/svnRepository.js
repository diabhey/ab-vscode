"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const tmp = require("tmp");
const vscode_1 = require("vscode");
const types_1 = require("./common/types");
const decorators_1 = require("./decorators");
const encodeUtil = require("./encoding");
const fs_1 = require("./fs");
const branch_1 = require("./helpers/branch");
const configuration_1 = require("./helpers/configuration");
const infoParser_1 = require("./infoParser");
const listParser_1 = require("./listParser");
const logParser_1 = require("./logParser");
const statusParser_1 = require("./statusParser");
const util_1 = require("./util");
const diffParser_1 = require("./diffParser");
class Repository {
    constructor(svn, root, workspaceRoot, policy) {
        this.svn = svn;
        this.root = root;
        this.workspaceRoot = workspaceRoot;
        this._infoCache = {};
        if (policy === types_1.ConstructorPolicy.LateInit) {
            return (async () => {
                return this;
            })();
        }
        return (async () => {
            await this.updateInfo();
            return this;
        })();
    }
    async updateInfo() {
        const result = await this.exec([
            "info",
            "--xml",
            util_1.fixPegRevision(this.workspaceRoot ? this.workspaceRoot : this.root)
        ]);
        this._info = await infoParser_1.parseInfoXml(result.stdout);
    }
    async exec(args, options = {}) {
        options.username = this.username;
        options.password = this.password;
        return this.svn.exec(this.workspaceRoot, args, options);
    }
    removeAbsolutePath(file) {
        file = util_1.fixPathSeparator(file);
        file = path.relative(this.workspaceRoot, file);
        if (file === "") {
            file = ".";
        }
        return util_1.fixPegRevision(file);
    }
    async getStatus(params) {
        params = Object.assign({}, {
            includeIgnored: false,
            includeExternals: true,
            checkRemoteChanges: false
        }, params);
        const args = ["stat", "--xml"];
        if (params.includeIgnored) {
            args.push("--no-ignore");
        }
        if (!params.includeExternals) {
            args.push("--ignore-externals");
        }
        if (params.checkRemoteChanges) {
            args.push("--show-updates");
        }
        const result = await this.exec(args);
        const status = await statusParser_1.parseStatusXml(result.stdout);
        for (const s of status) {
            if (s.status === types_1.Status.EXTERNAL) {
                try {
                    const info = await this.getInfo(s.path);
                    s.repositoryUuid = info.repository.uuid;
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        return status;
    }
    get info() {
        return util_1.unwrap(this._info);
    }
    resetInfoCache(file = "") {
        delete this._infoCache[file];
    }
    async getInfo(file = "", revision, skipCache = false, isUrl = false) {
        if (!skipCache && this._infoCache[file]) {
            return this._infoCache[file];
        }
        const args = ["info", "--xml"];
        if (revision) {
            args.push("-r", revision);
        }
        if (file) {
            if (!isUrl) {
                file = util_1.fixPathSeparator(file);
            }
            args.push(file);
        }
        const result = await this.exec(args);
        this._infoCache[file] = await infoParser_1.parseInfoXml(result.stdout);
        // Cache for 2 minutes
        setTimeout(() => {
            this.resetInfoCache(file);
        }, 2 * 60 * 1000);
        return this._infoCache[file];
    }
    async getChanges() {
        // First, check to see if this branch was copied from somewhere.
        let args = [
            "log",
            "-r1:HEAD",
            "--stop-on-copy",
            "--xml",
            "--with-all-revprops",
            "--verbose"
        ];
        let result = await this.exec(args);
        const entries = await logParser_1.parseSvnLog(result.stdout);
        if (entries.length === 0 || entries[0].paths.length === 0) {
            return [];
        }
        const copyCommitPath = entries[0].paths[0];
        if (typeof copyCommitPath.copyfromRev === "undefined" ||
            typeof copyCommitPath.copyfromPath === "undefined" ||
            typeof copyCommitPath._ === "undefined" ||
            copyCommitPath.copyfromRev.trim().length === 0 ||
            copyCommitPath.copyfromPath.trim().length === 0 ||
            copyCommitPath._.trim().length === 0) {
            return [];
        }
        const copyFromPath = copyCommitPath.copyfromPath;
        const copyFromRev = copyCommitPath.copyfromRev;
        const copyToPath = copyCommitPath._;
        const copyFromUrl = this.info.repository.root + copyFromPath;
        const copyToUrl = this.info.repository.root + copyToPath;
        // Get last merge revision from path that this branch was copied from.
        args = ["mergeinfo", "--show-revs=merged", copyFromUrl, copyToUrl];
        result = await this.exec(args);
        const revisions = result.stdout.trim().split("\n");
        let latestMergedRevision = "";
        if (revisions.length) {
            latestMergedRevision = revisions[revisions.length - 1];
        }
        if (latestMergedRevision.trim().length === 0) {
            latestMergedRevision = copyFromRev;
        }
        // Now, diff the source branch at the latest merged revision with the current branch's revision
        const info = await this.getInfo(copyToUrl, undefined, true, true);
        args = [
            "diff",
            `${copyFromUrl}@${latestMergedRevision}`,
            copyToUrl,
            "--ignore-properties",
            "--xml",
            "--summarize"
        ];
        result = await this.exec(args);
        let paths;
        try {
            paths = await diffParser_1.parseDiffXml(result.stdout);
        }
        catch (err) {
            return [];
        }
        const changes = [];
        // Now, we have all the files that this branch changed.
        for (const path of paths) {
            changes.push({
                oldPath: vscode_1.Uri.parse(path._),
                newPath: vscode_1.Uri.parse(path._.replace(copyFromUrl, copyToUrl)),
                oldRevision: latestMergedRevision.replace("r", ""),
                newRevision: info.revision,
                item: path.item,
                props: path.props,
                kind: path.kind,
                repo: vscode_1.Uri.parse(this.info.repository.root)
            });
        }
        return changes;
    }
    async show(file, revision) {
        const args = ["cat"];
        let uri;
        let filePath;
        if (file instanceof vscode_1.Uri) {
            uri = file;
            filePath = file.toString(true);
        }
        else {
            uri = vscode_1.Uri.file(file);
            filePath = file;
        }
        const isChild = uri.scheme === "file" && util_1.isDescendant(this.workspaceRoot, uri.fsPath);
        let target = filePath;
        if (isChild) {
            target = this.removeAbsolutePath(target);
        }
        if (revision) {
            args.push("-r", revision);
            if (isChild &&
                !["BASE", "COMMITTED", "PREV"].includes(revision.toUpperCase())) {
                const info = await this.getInfo();
                target = info.url + "/" + target.replace(/\\/g, "/");
                // TODO move to SvnRI
            }
        }
        args.push(target);
        /**
         * ENCODE DETECTION
         * if TextDocuments exists and autoGuessEncoding is true,
         * try detect current encoding of content
         */
        const configs = vscode_1.workspace.getConfiguration("files", uri);
        let encoding = configs.get("encoding");
        let autoGuessEncoding = configs.get("autoGuessEncoding", false);
        const textDocument = vscode_1.workspace.textDocuments.find(doc => util_1.normalizePath(doc.uri.fsPath) === util_1.normalizePath(filePath));
        if (textDocument) {
            // Load encoding by languageId
            const languageConfigs = vscode_1.workspace.getConfiguration(`[${textDocument.languageId}]`, uri);
            if (languageConfigs["files.encoding"] !== undefined) {
                encoding = languageConfigs["files.encoding"];
            }
            if (languageConfigs["files.autoGuessEncoding"] !== undefined) {
                autoGuessEncoding = languageConfigs["files.autoGuessEncoding"];
            }
            if (autoGuessEncoding) {
                // The `getText` return a `utf-8` string
                const buffer = Buffer.from(textDocument.getText(), "utf-8");
                const detectedEncoding = encodeUtil.detectEncoding(buffer);
                if (detectedEncoding) {
                    encoding = detectedEncoding;
                }
            }
        }
        const result = await this.exec(args, { encoding });
        return result.stdout;
    }
    async commitFiles(message, files) {
        files = files.map(file => this.removeAbsolutePath(file));
        const args = ["commit", ...files];
        if (await fs_1.exists(path.join(this.workspaceRoot, message))) {
            args.push("--force-log");
        }
        let tmpFile;
        /**
         * For message with line break or non:
         * \x00-\x7F -> ASCII
         * \x80-\xFF -> Latin
         * Use a file for commit message
         */
        if (/\n|[^\x00-\x7F\x80-\xFF]/.test(message)) {
            tmp.setGracefulCleanup();
            tmpFile = tmp.fileSync({
                prefix: "svn-commit-message-"
            });
            await fs_1.writeFile(tmpFile.name, message, "UTF-8");
            args.push("-F", tmpFile.name);
            args.push("--encoding", "UTF-8");
        }
        else {
            args.push("-m", message);
        }
        // Prevents commit the files inside the folder
        args.push("--depth", "empty");
        const result = await this.exec(args);
        // Remove temporary file if exists
        if (tmpFile) {
            tmpFile.removeCallback();
        }
        const matches = result.stdout.match(/Committed revision (.*)\./i);
        if (matches && matches[0]) {
            const sendedFiles = (result.stdout.match(/(Sending|Adding|Deleting)\s+/g) || []).length;
            const filesMessage = `${sendedFiles} ${sendedFiles === 1 ? "file" : "files"} commited`;
            return `${filesMessage}: revision ${matches[1]}.`;
        }
        return result.stdout;
    }
    addFiles(files) {
        files = files.map(file => this.removeAbsolutePath(file));
        return this.exec(["add", ...files]);
    }
    addChangelist(files, changelist) {
        files = files.map(file => this.removeAbsolutePath(file));
        return this.exec(["changelist", changelist, ...files]);
    }
    removeChangelist(files) {
        files = files.map(file => this.removeAbsolutePath(file));
        return this.exec(["changelist", "--remove", ...files]);
    }
    async getCurrentBranch() {
        const info = await this.getInfo();
        const branch = branch_1.getBranchName(info.url);
        if (branch) {
            const showFullName = configuration_1.configuration.get("layout.showFullName");
            if (showFullName) {
                return branch.path;
            }
            else {
                return branch.name;
            }
        }
        return "";
    }
    async getRepositoryUuid() {
        const info = await this.getInfo();
        return info.repository.uuid;
    }
    async getRepoUrl() {
        const info = await this.getInfo();
        const branch = branch_1.getBranchName(info.url);
        if (!branch) {
            return info.repository.root;
        }
        const regex = new RegExp(branch.path + "$");
        return info.url.replace(regex, "").replace(/\/$/, "");
    }
    async getBranches() {
        const trunkLayout = configuration_1.configuration.get("layout.trunk");
        const branchesLayout = configuration_1.configuration.get("layout.branches");
        const tagsLayout = configuration_1.configuration.get("layout.tags");
        const repoUrl = await this.getRepoUrl();
        const branches = [];
        const promises = [];
        if (trunkLayout) {
            promises.push(new Promise(async (resolve) => {
                try {
                    await this.exec([
                        "ls",
                        repoUrl + "/" + trunkLayout,
                        "--depth",
                        "empty"
                    ]);
                    resolve([trunkLayout]);
                }
                catch (error) {
                    resolve([]);
                }
            }));
        }
        const trees = [];
        if (branchesLayout) {
            trees.push(branchesLayout);
        }
        if (tagsLayout) {
            trees.push(tagsLayout);
        }
        for (const tree of trees) {
            promises.push(new Promise(async (resolve) => {
                const branchUrl = repoUrl + "/" + tree;
                try {
                    const result = await this.exec(["ls", branchUrl]);
                    const list = result.stdout
                        .trim()
                        .replace(/\/|\\/g, "")
                        .split(/[\r\n]+/)
                        .filter((x) => !!x)
                        .map((i) => tree + "/" + i);
                    resolve(list);
                }
                catch (error) {
                    resolve([]);
                }
            }));
        }
        const all = await Promise.all(promises);
        all.forEach(list => {
            branches.push(...list);
        });
        return branches;
    }
    async newBranch(name, commitMessage = "Created new branch") {
        const repoUrl = await this.getRepoUrl();
        const newBranch = repoUrl + "/" + name;
        const info = await this.getInfo();
        const currentBranch = info.url;
        await this.exec(["copy", currentBranch, newBranch, "-m", commitMessage]);
        await this.switchBranch(name);
        return true;
    }
    async switchBranch(ref, force = false) {
        const repoUrl = await this.getRepoUrl();
        const branchUrl = repoUrl + "/" + ref;
        await this.exec(["switch", branchUrl].concat(force ? ["--ignore-ancestry"] : []));
        this.resetInfoCache();
        return true;
    }
    async revert(files, depth) {
        files = files.map(file => this.removeAbsolutePath(file));
        const result = await this.exec(["revert", "--depth", depth, ...files]);
        return result.stdout;
    }
    async update(ignoreExternals = true) {
        const args = ["update"];
        if (ignoreExternals) {
            args.push("--ignore-externals");
        }
        const result = await this.exec(args);
        this.resetInfoCache();
        const message = result.stdout
            .trim()
            .split(/\r?\n/)
            .pop();
        if (message) {
            return message;
        }
        return result.stdout;
    }
    async pullIncomingChange(path) {
        const args = ["update", path];
        const result = await this.exec(args);
        this.resetInfoCache();
        const message = result.stdout
            .trim()
            .split(/\r?\n/)
            .pop();
        if (message) {
            return message;
        }
        return result.stdout;
    }
    async patch(files) {
        files = files.map(file => this.removeAbsolutePath(file));
        const result = await this.exec(["diff", "--internal-diff", ...files]);
        const message = result.stdout;
        return message;
    }
    async patchChangelist(changelistName) {
        const result = await this.exec([
            "diff",
            "--internal-diff",
            "--changelist",
            changelistName
        ]);
        const message = result.stdout;
        return message;
    }
    async removeFiles(files, keepLocal) {
        files = files.map(file => this.removeAbsolutePath(file));
        const args = ["remove"];
        if (keepLocal) {
            args.push("--keep-local");
        }
        args.push(...files);
        const result = await this.exec(args);
        return result.stdout;
    }
    async resolve(files, action) {
        files = files.map(file => this.removeAbsolutePath(file));
        const result = await this.exec(["resolve", "--accept", action, ...files]);
        return result.stdout;
    }
    async plainLog() {
        const logLength = configuration_1.configuration.get("log.length") || "50";
        const result = await this.exec([
            "log",
            "-r",
            "HEAD:1",
            "--limit",
            logLength
        ]);
        return result.stdout;
    }
    async log(rfrom, rto, limit, target) {
        const args = [
            "log",
            "-r",
            `${rfrom}:${rto}`,
            `--limit=${limit}`,
            "--xml",
            "-v"
        ];
        if (target !== undefined) {
            args.push(util_1.fixPegRevision(target instanceof vscode_1.Uri ? target.toString(true) : target));
        }
        const result = await this.exec(args);
        return logParser_1.parseSvnLog(result.stdout);
    }
    async countNewCommit(revision = "BASE:HEAD") {
        const result = await this.exec(["log", "-r", revision, "-q", "--xml"]);
        const matches = result.stdout.match(/<logentry/g);
        if (matches && matches.length > 0) {
            // Every return current commit
            return matches.length - 1;
        }
        return 0;
    }
    async cleanup() {
        const result = await this.exec(["cleanup"]);
        return result.stdout;
    }
    async finishCheckout() {
        const info = await this.getInfo();
        const result = await this.exec(["switch", info.url]);
        return result.stdout;
    }
    async list(folder) {
        let url = await this.getRepoUrl();
        if (folder) {
            url += "/" + folder;
        }
        const result = await this.exec(["list", url, "--xml"]);
        return listParser_1.parseSvnList(result.stdout);
    }
    async getCurrentIgnore(directory) {
        directory = this.removeAbsolutePath(directory);
        let currentIgnore = "";
        try {
            const args = ["propget", "svn:ignore"];
            if (directory) {
                args.push(directory);
            }
            const currentIgnoreResult = await this.exec(args);
            currentIgnore = currentIgnoreResult.stdout.trim();
        }
        catch (error) {
            console.error(error);
        }
        const ignores = currentIgnore.split(/[\r\n]+/);
        return ignores;
    }
    async addToIgnore(expressions, directory, recursive = false) {
        const ignores = await this.getCurrentIgnore(directory);
        directory = this.removeAbsolutePath(directory);
        ignores.push(...expressions);
        const newIgnore = [...new Set(ignores)]
            .filter(v => !!v)
            .sort()
            .join("\n");
        const args = ["propset", "svn:ignore", newIgnore];
        if (directory) {
            args.push(directory);
        }
        else {
            args.push(".");
        }
        if (recursive) {
            args.push("--recursive");
        }
        const result = await this.exec(args);
        return result.stdout;
    }
    async rename(oldName, newName) {
        oldName = this.removeAbsolutePath(oldName);
        newName = this.removeAbsolutePath(newName);
        const args = ["rename", oldName, newName];
        const result = await this.exec(args);
        return result.stdout;
    }
}
__decorate([
    decorators_1.sequentialize
], Repository.prototype, "getInfo", null);
exports.Repository = Repository;
//# sourceMappingURL=svnRepository.js.map