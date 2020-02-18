"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class Patch extends command_1.Command {
    constructor() {
        super("svn.patch");
    }
    async execute(...resourceStates) {
        const selection = await this.getResourceStates(resourceStates);
        if (selection.length === 0) {
            return;
        }
        const uris = selection.map(resource => resource.resourceUri);
        await this.runByRepository(uris, async (repository, resources) => {
            if (!repository) {
                return;
            }
            const files = resources.map(resource => resource.fsPath);
            const content = await repository.patch(files);
            await this.showDiffPath(repository, content);
        });
    }
}
exports.Patch = Patch;
//# sourceMappingURL=patch.js.map