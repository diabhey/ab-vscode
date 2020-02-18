"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class AddToIgnoreExplorer extends command_1.Command {
    constructor() {
        super("svn.addToIgnoreExplorer");
    }
    async execute(_mainUri, allUris) {
        if (!allUris || allUris.length === 0) {
            return;
        }
        return this.addToIgnore(allUris);
    }
}
exports.AddToIgnoreExplorer = AddToIgnoreExplorer;
//# sourceMappingURL=addToIgnoreExplorer.js.map