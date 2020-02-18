"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const types_1 = require("./common/types");
const fs_1 = require("./fs");
function done(promise) {
    return promise.then(() => void 0);
}
exports.done = done;
function dispose(disposables) {
    disposables.forEach(disposable => disposable.dispose());
    return [];
}
exports.dispose = dispose;
function toDisposable(dispose) {
    return { dispose };
}
exports.toDisposable = toDisposable;
function combinedDisposable(disposables) {
    return toDisposable(() => dispose(disposables));
}
exports.combinedDisposable = combinedDisposable;
function anyEvent(...events) {
    return (listener, thisArgs = null, disposables) => {
        const result = combinedDisposable(events.map(event => event((i) => listener.call(thisArgs, i))));
        if (disposables) {
            disposables.push(result);
        }
        return result;
    };
}
exports.anyEvent = anyEvent;
function filterEvent(event, filter) {
    return (listener, thisArgs = null, disposables) => event((e) => filter(e) && listener.call(thisArgs, e), null, disposables);
}
exports.filterEvent = filterEvent;
function onceEvent(event) {
    return (listener, thisArgs = null, disposables) => {
        const result = event((e) => {
            result.dispose();
            return listener.call(thisArgs, e);
        }, null, disposables);
        return result;
    };
}
exports.onceEvent = onceEvent;
function eventToPromise(event) {
    return new Promise(c => onceEvent(event)(c));
}
exports.eventToPromise = eventToPromise;
const regexNormalizePath = new RegExp(path.sep === "/" ? "\\\\" : "/", "g");
const regexNormalizeWindows = new RegExp("^\\\\(\\w:)", "g");
function fixPathSeparator(file) {
    file = file.replace(regexNormalizePath, path.sep);
    file = file.replace(regexNormalizeWindows, "$1"); // "\t:\test" => "t:\test"
    return file;
}
exports.fixPathSeparator = fixPathSeparator;
function normalizePath(file) {
    file = fixPathSeparator(file);
    // IF Windows
    if (path.sep === "\\") {
        file = file.toLowerCase();
    }
    return file;
}
exports.normalizePath = normalizePath;
function isDescendant(parent, descendant) {
    if (parent.trim() === "" || descendant.trim() === "") {
        return false;
    }
    parent = parent.replace(/[\\\/]/g, path.sep);
    descendant = descendant.replace(/[\\\/]/g, path.sep);
    // IF Windows
    if (path.sep === "\\") {
        parent = parent.replace(/^\\/, "").toLowerCase();
        descendant = descendant.replace(/^\\/, "").toLowerCase();
    }
    if (parent === descendant) {
        return true;
    }
    if (parent.charAt(parent.length - 1) !== path.sep) {
        parent += path.sep;
    }
    return descendant.startsWith(parent);
}
exports.isDescendant = isDescendant;
function camelcase(name) {
    return name
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
        return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
        .replace(/[\s\-]+/g, "");
}
exports.camelcase = camelcase;
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.timeout = timeout;
function isReadOnly(operation) {
    switch (operation) {
        case types_1.Operation.CurrentBranch:
        case types_1.Operation.Log:
        case types_1.Operation.Show:
        case types_1.Operation.Info:
        case types_1.Operation.Changes:
            return true;
        default:
            return false;
    }
}
exports.isReadOnly = isReadOnly;
/**
 * Remove directory recursively
 * @param {string} dirPath
 * @see https://stackoverflow.com/a/42505874/3027390
 */
async function deleteDirectory(dirPath) {
    if ((await fs_1.exists(dirPath)) && (await fs_1.lstat(dirPath)).isDirectory()) {
        await Promise.all((await fs_1.readdir(dirPath)).map(async (entry) => {
            const entryPath = path.join(dirPath, entry);
            if ((await fs_1.lstat(entryPath)).isDirectory()) {
                await deleteDirectory(entryPath);
            }
            else {
                await fs_1.unlink(entryPath);
            }
        }));
        await fs_1.rmdir(dirPath);
    }
}
exports.deleteDirectory = deleteDirectory;
function unwrap(maybeT) {
    if (maybeT === undefined) {
        throw new Error("undefined unwrap");
    }
    return maybeT;
}
exports.unwrap = unwrap;
function fixPegRevision(file) {
    // Fix Peg Revision Algorithm (http://svnbook.red-bean.com/en/1.8/svn.advanced.pegrevs.html)
    if (/@/.test(file)) {
        file += "@";
    }
    return file;
}
exports.fixPegRevision = fixPegRevision;
async function isSvnFolder(dir, checkParent = true) {
    const result = await fs_1.exists(`${dir}/.svn`);
    if (result || !checkParent) {
        return result;
    }
    const parent = path.dirname(dir);
    // For windows: the `path.dirname("c:")` return `c:`
    // For empty or doted dir, return "."
    if (parent === dir || parent === ".") {
        return false;
    }
    return isSvnFolder(parent, true);
}
exports.isSvnFolder = isSvnFolder;
//# sourceMappingURL=util.js.map