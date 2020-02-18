"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class PatchAll extends command_1.Command {
    constructor() {
        super("svn.patchAll", { repository: true });
    }
    async execute(repository) {
        const content = await repository.patch([]);
        await this.showDiffPath(repository, content);
    }
}
exports.PatchAll = PatchAll;
//# sourceMappingURL=patchAll.js.map