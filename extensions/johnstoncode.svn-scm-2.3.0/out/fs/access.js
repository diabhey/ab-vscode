"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const original_fs_1 = require("original-fs");
function access(path, mode) {
    return new Promise((resolve, _reject) => {
        original_fs_1.access(path, mode, err => (err ? resolve(false) : resolve(true)));
    });
}
exports.access = access;
//# sourceMappingURL=access.js.map