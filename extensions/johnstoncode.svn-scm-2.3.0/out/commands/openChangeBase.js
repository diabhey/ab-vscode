"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class OpenChangeBase extends command_1.Command {
    constructor() {
        super("svn.openChangeBase", {});
    }
    async execute(arg, ...resourceStates) {
        return this.openChange(arg, "BASE", resourceStates);
    }
}
exports.OpenChangeBase = OpenChangeBase;
//# sourceMappingURL=openChangeBase.js.map