"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class Cleanup extends command_1.Command {
    constructor() {
        super("svn.cleanup", { repository: true });
    }
    async execute(repository) {
        await repository.cleanup();
    }
}
exports.Cleanup = Cleanup;
//# sourceMappingURL=cleanup.js.map