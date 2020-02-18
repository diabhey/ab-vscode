"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js = require("xml2js");
const util_1 = require("./util");
async function parseInfoXml(content) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(content, {
            mergeAttrs: true,
            explicitRoot: false,
            explicitArray: false,
            attrNameProcessors: [util_1.camelcase],
            tagNameProcessors: [util_1.camelcase]
        }, (err, result) => {
            if (err || typeof result.entry === "undefined") {
                reject();
            }
            resolve(result.entry);
        });
    });
}
exports.parseInfoXml = parseInfoXml;
//# sourceMappingURL=infoParser.js.map