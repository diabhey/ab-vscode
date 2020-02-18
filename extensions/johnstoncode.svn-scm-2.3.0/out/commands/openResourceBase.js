"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class OpenResourceBase extends command_1.Command {
    constructor() {
        super("svn.openResourceBase");
    }
    async execute(resource) {
        await this._openResource(resource, "BASE", undefined, true, false);
    }
}
exports.OpenResourceBase = OpenResourceBase;
//# sourceMappingURL=openResourceBase.js.map