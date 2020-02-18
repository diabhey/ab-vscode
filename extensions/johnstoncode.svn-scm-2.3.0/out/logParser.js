"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js = require("xml2js");
const constants_1 = require("./common/constants");
async function parseSvnLog(content) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(content, constants_1.xml2jsParseSettings, (err, result) => {
            if (err) {
                reject();
            }
            let transformed = [];
            if (Array.isArray(result.logentry)) {
                transformed = result.logentry;
            }
            else if (typeof result.logentry === "object") {
                transformed = [result.logentry];
            }
            for (const logentry of transformed) {
                if (logentry.paths === undefined) {
                    logentry.paths = [];
                }
                else if (Array.isArray(logentry.paths.path)) {
                    logentry.paths = logentry.paths.path;
                }
                else {
                    logentry.paths = [logentry.paths.path];
                }
            }
            resolve(transformed);
        });
    });
}
exports.parseSvnLog = parseSvnLog;
//# sourceMappingURL=logParser.js.map