"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js = require("xml2js");
const util_1 = require("./util");
async function parseDiffXml(content) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(content, {
            mergeAttrs: true,
            explicitRoot: false,
            explicitArray: false,
            attrNameProcessors: [util_1.camelcase],
            tagNameProcessors: [util_1.camelcase]
        }, (err, result) => {
            if (err ||
                !result.paths ||
                !result.paths.path) {
                reject();
            }
            if (!Array.isArray(result.paths.path)) {
                result.paths.path = [result.paths.path];
            }
            resolve(result.paths.path);
        });
    });
}
exports.parseDiffXml = parseDiffXml;
//# sourceMappingURL=diffParser.js.map