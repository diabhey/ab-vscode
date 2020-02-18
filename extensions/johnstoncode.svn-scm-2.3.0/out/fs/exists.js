"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const original_fs_1 = require("original-fs");
function exists(path) {
    return new Promise((resolve, _reject) => {
        original_fs_1.access(path, err => (err ? resolve(false) : resolve(true)));
    });
}
exports.exists = exists;
//# sourceMappingURL=exists.js.map