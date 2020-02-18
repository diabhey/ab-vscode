"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class GetSourceControlManager extends command_1.Command {
    constructor(sourceControlManager) {
        super("svn.getSourceControlManager");
        this.sourceControlManager = sourceControlManager;
    }
    async execute() {
        return this.sourceControlManager;
    }
}
exports.GetSourceControlManager = GetSourceControlManager;
//# sourceMappingURL=get_source_control_manager.js.map