"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const changelistItems_1 = require("../changelistItems");
const command_1 = require("./command");
class PatchChangeList extends command_1.Command {
    constructor() {
        super("svn.patchChangeList", { repository: true });
    }
    async execute(repository) {
        const changelistName = await changelistItems_1.getPatchChangelist(repository);
        if (!changelistName) {
            return;
        }
        const content = await repository.patchChangelist(changelistName);
        await this.showDiffPath(repository, content);
    }
}
exports.PatchChangeList = PatchChangeList;
//# sourceMappingURL=patchChangeList.js.map