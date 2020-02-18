"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const command_1 = require("./command");
class Add extends command_1.Command {
    constructor() {
        super("svn.add");
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
            const paths = resources.map(resource => resource.fsPath);
            try {
                await repository.addFiles(paths);
            }
            catch (error) {
                console.log(error);
                vscode_1.window.showErrorMessage("Unable to add file");
            }
        });
    }
}
exports.Add = Add;
//# sourceMappingURL=add.js.map