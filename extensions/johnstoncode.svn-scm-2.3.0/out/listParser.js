"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js = require("xml2js");
const constants_1 = require("./common/constants");
async function parseSvnList(content) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(content, constants_1.xml2jsParseSettings, (err, result) => {
            if (err) {
                reject();
            }
            if (result.list && result.list.entry) {
                if (!Array.isArray(result.list.entry)) {
                    result.list.entry = [result.list.entry];
                }
                resolve(result.list.entry);
            }
            else {
                resolve([]);
            }
        });
    });
}
exports.parseSvnList = parseSvnList;
//# sourceMappingURL=listParser.js.map