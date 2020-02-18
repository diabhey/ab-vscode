"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const original_fs_1 = require("original-fs");
const util_1 = require("util");
exports.readdir = util_1.promisify(original_fs_1.readdir);
//# sourceMappingURL=readdir.js.map