"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const checkoutStatusBar_1 = require("./checkoutStatusBar");
const syncStatusBar_1 = require("./syncStatusBar");
class StatusBarCommands {
    constructor(repository) {
        this.disposables = [];
        this.checkoutStatusBar = new checkoutStatusBar_1.CheckoutStatusBar(repository);
        this.syncStatusBar = new syncStatusBar_1.SyncStatusBar(repository);
        this.disposables.push(this.checkoutStatusBar, this.syncStatusBar);
    }
    get onDidChange() {
        return util_1.anyEvent(this.syncStatusBar.onDidChange, this.checkoutStatusBar.onDidChange);
    }
    get commands() {
        const result = [];
        const checkout = this.checkoutStatusBar.command;
        if (checkout) {
            result.push(checkout);
        }
        const sync = this.syncStatusBar.command;
        if (sync) {
            result.push(sync);
        }
        return result;
    }
    dispose() {
        this.disposables.forEach(disposable => disposable.dispose());
    }
}
exports.StatusBarCommands = StatusBarCommands;
//# sourceMappingURL=statusBarCommands.js.map