"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class OpenChangePrev extends command_1.Command {
    constructor() {
        super("svn.openChangePrev", {});
    }
    async execute(arg, ...resourceStates) {
        return this.openChange(arg, "PREV", resourceStates);
    }
}
exports.OpenChangePrev = OpenChangePrev;
//# sourceMappingURL=openChangePrev.js.map