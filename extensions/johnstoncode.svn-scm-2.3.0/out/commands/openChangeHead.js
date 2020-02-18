"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class OpenChangeHead extends command_1.Command {
    constructor() {
        super("svn.openChangeHead");
    }
    async execute(arg, ...resourceStates) {
        return this.openChange(arg, "HEAD", resourceStates);
    }
}
exports.OpenChangeHead = OpenChangeHead;
//# sourceMappingURL=openChangeHead.js.map