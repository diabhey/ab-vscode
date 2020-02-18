"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const types_1 = require("../common/types");
const fs_1 = require("../fs");
const ignoreitems_1 = require("../ignoreitems");
const lineChanges_1 = require("../lineChanges");
const resource_1 = require("../resource");
const incomingChangeNode_1 = require("../treeView/nodes/incomingChangeNode");
const uri_1 = require("../uri");
class Command {
    constructor(commandName, options = {}) {
        if (options.repository) {
            const command = this.createRepositoryCommand(this.execute);
            this._disposable = vscode_1.commands.registerCommand(commandName, command);
            return;
        }
        if (!options.repository) {
            this._disposable = vscode_1.commands.registerCommand(commandName, (...args) => this.execute(...args));
            return;
        }
    }
    dispose() {
        this._disposable && this._disposable.dispose(); // tslint:disable-line
    }
    createRepositoryCommand(method) {
        const result = async (...args) => {
            const sourceControlManager = (await vscode_1.commands.executeCommand("svn.getSourceControlManager", ""));
            const repository = sourceControlManager.getRepository(args[0]);
            let repositoryPromise;
            if (repository) {
                repositoryPromise = Promise.resolve(repository);
            }
            else if (sourceControlManager.repositories.length === 1) {
                repositoryPromise = Promise.resolve(sourceControlManager.repositories[0]);
            }
            else {
                repositoryPromise = sourceControlManager.pickRepository();
            }
            const result = repositoryPromise.then(repository => {
                if (!repository) {
                    return Promise.resolve();
                }
                return Promise.resolve(method.apply(this, [repository, ...args]));
            });
            return result.catch(err => {
                console.error(err);
            });
        };
        return result;
    }
    async getResourceStates(resourceStates) {
        if (resourceStates.length === 0 ||
            !(resourceStates[0].resourceUri instanceof vscode_1.Uri)) {
            const resource = await this.getSCMResource();
            if (!resource) {
                return [];
            }
            resourceStates = [resource];
        }
        return resourceStates.filter(s => s instanceof resource_1.Resource);
    }
    async runByRepository(arg, fn) {
        const resources = arg instanceof vscode_1.Uri ? [arg] : arg;
        const isSingleResource = arg instanceof vscode_1.Uri;
        const sourceControlManager = (await vscode_1.commands.executeCommand("svn.getSourceControlManager", ""));
        const groups = [];
        for (const resource of resources) {
            const repository = sourceControlManager.getRepository(resource);
            if (!repository) {
                console.warn("Could not find Svn repository for ", resource);
                continue;
            }
            const tuple = groups.filter(p => p.repository === repository)[0];
            if (tuple) {
                tuple.resources.push(resource);
            }
            else {
                groups.push({ repository, resources: [resource] });
            }
        }
        const promises = groups.map(({ repository, resources }) => fn(repository, isSingleResource ? resources[0] : resources));
        return Promise.all(promises);
    }
    async getSCMResource(uri) {
        uri = uri
            ? uri
            : vscode_1.window.activeTextEditor && vscode_1.window.activeTextEditor.document.uri;
        if (!uri) {
            return undefined;
        }
        if (uri.scheme === "svn") {
            const { fsPath } = uri_1.fromSvnUri(uri);
            uri = vscode_1.Uri.file(fsPath);
        }
        if (uri.scheme === "file") {
            const sourceControlManager = (await vscode_1.commands.executeCommand("svn.getSourceControlManager", ""));
            const repository = sourceControlManager.getRepository(uri);
            if (!repository) {
                return undefined;
            }
            return repository.getResourceFromFile(uri);
        }
        return;
    }
    async _openResource(resource, against, preview, preserveFocus, preserveSelection) {
        let left = await this.getLeftResource(resource, against);
        let right = this.getRightResource(resource, against);
        const title = this.getTitle(resource, against);
        if (resource.remote && left) {
            [left, right] = [right, left];
        }
        if (!right) {
            // TODO
            console.error("oh no");
            return;
        }
        if ((await fs_1.exists(right.fsPath)) &&
            (await fs_1.stat(right.fsPath)).isDirectory()) {
            return;
        }
        const opts = {
            preserveFocus,
            preview,
            viewColumn: vscode_1.ViewColumn.Active
        };
        const activeTextEditor = vscode_1.window.activeTextEditor;
        if (preserveSelection &&
            activeTextEditor &&
            activeTextEditor.document.uri.toString() === right.toString()) {
            opts.selection = activeTextEditor.selection;
        }
        if (!left) {
            return vscode_1.commands.executeCommand("vscode.open", right, opts);
        }
        return vscode_1.commands.executeCommand("vscode.diff", left, right, title, opts);
    }
    async getLeftResource(resource, against = "") {
        if (resource.remote) {
            if (resource.type !== types_1.Status.DELETED) {
                return uri_1.toSvnUri(resource.resourceUri, types_1.SvnUriAction.SHOW, {
                    ref: against
                });
            }
            return;
        }
        if (resource.type === types_1.Status.ADDED && resource.renameResourceUri) {
            return uri_1.toSvnUri(resource.renameResourceUri, types_1.SvnUriAction.SHOW, {
                ref: against
            });
        }
        // Show file if has conflicts marks
        if (resource.type === types_1.Status.CONFLICTED &&
            (await fs_1.exists(resource.resourceUri.fsPath))) {
            const text = (await fs_1.readFile(resource.resourceUri.fsPath, {
                encoding: "utf8"
            }));
            // Check for lines begin with "<<<<<<", "=======", ">>>>>>>"
            if (/^<{7}[^]+^={7}[^]+^>{7}/m.test(text)) {
                return undefined;
            }
        }
        switch (resource.type) {
            case types_1.Status.CONFLICTED:
            case types_1.Status.MODIFIED:
            case types_1.Status.REPLACED:
                return uri_1.toSvnUri(resource.resourceUri, types_1.SvnUriAction.SHOW, {
                    ref: against
                });
        }
        return;
    }
    getRightResource(resource, against = "") {
        if (resource.remote) {
            if (resource.type !== types_1.Status.ADDED) {
                return resource.resourceUri;
            }
            return;
        }
        switch (resource.type) {
            case types_1.Status.ADDED:
            case types_1.Status.CONFLICTED:
            case types_1.Status.IGNORED:
            case types_1.Status.MODIFIED:
            case types_1.Status.UNVERSIONED:
            case types_1.Status.REPLACED:
                return resource.resourceUri;
            case types_1.Status.DELETED:
            case types_1.Status.MISSING:
                return uri_1.toSvnUri(resource.resourceUri, types_1.SvnUriAction.SHOW, {
                    ref: against
                });
        }
        return;
    }
    getTitle(resource, against) {
        if (resource.type === types_1.Status.ADDED && resource.renameResourceUri) {
            const basename = path.basename(resource.renameResourceUri.fsPath);
            const newname = path.relative(path.dirname(resource.renameResourceUri.fsPath), resource.resourceUri.fsPath);
            if (against) {
                return `${basename} -> ${newname} (${against})`;
            }
            return `${basename} -> ${newname}`;
        }
        const basename = path.basename(resource.resourceUri.fsPath);
        if (against) {
            return `${basename} (${against})`;
        }
        return "";
    }
    async openChange(arg, against, resourceStates) {
        const preserveFocus = arg instanceof resource_1.Resource;
        const preserveSelection = arg instanceof vscode_1.Uri || !arg;
        let resources;
        if (arg instanceof vscode_1.Uri) {
            const resource = await this.getSCMResource(arg);
            if (resource !== undefined) {
                resources = [resource];
            }
        }
        else if (arg instanceof incomingChangeNode_1.default) {
            const resource = new resource_1.Resource(arg.uri, arg.type, undefined, arg.props, true);
            resources = [resource];
        }
        else {
            let resource;
            if (arg instanceof resource_1.Resource) {
                resource = arg;
            }
            else {
                resource = await this.getSCMResource();
            }
            if (resource) {
                resources = [...resourceStates, resource];
            }
        }
        if (!resources) {
            return;
        }
        const preview = resources.length === 1 ? undefined : false;
        for (const resource of resources) {
            await this._openResource(resource, against, preview, preserveFocus, preserveSelection);
        }
    }
    async showDiffPath(repository, content) {
        try {
            const tempFile = path.join(repository.root, ".svn", "tmp", "svn.patch");
            if (await fs_1.exists(tempFile)) {
                try {
                    await fs_1.unlink(tempFile);
                }
                catch (err) {
                    // TODO(cjohnston)//log error
                }
            }
            const uri = vscode_1.Uri.file(tempFile).with({
                scheme: "untitled"
            });
            const document = await vscode_1.workspace.openTextDocument(uri);
            const textEditor = await vscode_1.window.showTextDocument(document);
            await textEditor.edit(e => {
                // if is opened, clear content
                e.delete(new vscode_1.Range(new vscode_1.Position(0, 0), new vscode_1.Position(Number.MAX_SAFE_INTEGER, 0)));
                e.insert(new vscode_1.Position(0, 0), content);
            });
        }
        catch (error) {
            console.error(error);
            vscode_1.window.showErrorMessage("Unable to patch");
        }
    }
    async _revertChanges(textEditor, changes) {
        const modifiedDocument = textEditor.document;
        const modifiedUri = modifiedDocument.uri;
        if (modifiedUri.scheme !== "file") {
            return;
        }
        const originalUri = uri_1.toSvnUri(modifiedUri, types_1.SvnUriAction.SHOW, {
            ref: "BASE"
        });
        const originalDocument = await vscode_1.workspace.openTextDocument(originalUri);
        const result = lineChanges_1.applyLineChanges(originalDocument, modifiedDocument, changes);
        const edit = new vscode_1.WorkspaceEdit();
        edit.replace(modifiedUri, new vscode_1.Range(new vscode_1.Position(0, 0), modifiedDocument.lineAt(modifiedDocument.lineCount - 1).range.end), result);
        vscode_1.workspace.applyEdit(edit);
        await modifiedDocument.save();
    }
    async addToIgnore(uris) {
        await this.runByRepository(uris, async (repository, resources) => {
            if (!repository) {
                return;
            }
            try {
                const ignored = await ignoreitems_1.inputIgnoreList(repository, resources);
                if (ignored) {
                    vscode_1.window.showInformationMessage(`File(s) is now being ignored`);
                }
            }
            catch (error) {
                console.log(error);
                vscode_1.window.showErrorMessage("Unable to set property ignore");
            }
        });
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map