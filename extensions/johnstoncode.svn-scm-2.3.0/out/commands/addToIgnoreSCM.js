"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class AddToIgnoreSCM extends command_1.Command {
    constructor() {
        super("svn.addToIgnoreSCM");
    }
    async execute(...resourceStates) {
        const selection = await this.getResourceStates(resourceStates);
        if (selection.length === 0) {
            return;
        }
        const uris = selection.map(resource => resource.resourceUri);
        return this.addToIgnore(uris);
    }
}
exports.AddToIgnoreSCM = AddToIgnoreSCM;
//# sourceMappingURL=addToIgnoreSCM.js.map