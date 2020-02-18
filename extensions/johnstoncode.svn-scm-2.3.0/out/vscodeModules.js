"use strict";
// Only this file is allowed to import VSCode modules
// tslint:disable: import-blacklist
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const appRoot = vscode.env.appRoot;
function loadVSCodeModule(id) {
    try {
        return require(`${appRoot}/node_modules.asar/${id}`);
    }
    catch (ea) {
        // Ignore
    }
    const baseDir = path.dirname(process.execPath);
    try {
        module.paths.unshift(`${baseDir}/node_modules`);
        return require(id);
    }
    catch (eb) {
        vscode.window.showErrorMessage(`Missing dependency, go to "${baseDir}" and run: npm install ${id}`);
    }
}
exports.iconv = loadVSCodeModule("iconv-lite");
exports.jschardet = loadVSCodeModule("jschardet");
//# sourceMappingURL=vscodeModules.js.map