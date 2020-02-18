"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js = require("xml2js");
const constants_1 = require("./common/constants");
function processEntry(entry, changelist) {
    if (Array.isArray(entry)) {
        const list = [];
        entry.forEach((e) => {
            const r = processEntry(e, changelist);
            if (r) {
                list.push(...r);
            }
        });
        return list;
    }
    const wcStatus = {
        locked: !!entry.wcStatus.wcLocked && entry.wcStatus.wcLocked === "true" || !!(entry.reposStatus && entry.reposStatus.lock),
        switched: !!entry.wcStatus.switched && entry.wcStatus.switched === "true"
    };
    const r = {
        changelist,
        path: entry.path,
        status: entry.wcStatus.item,
        props: entry.wcStatus.props,
        wcStatus,
        reposStatus: entry.reposStatus
    };
    if (entry.wcStatus.movedTo && r.status === "deleted") {
        return [];
    }
    if (entry.wcStatus.movedFrom && r.status === "added") {
        r.rename = entry.wcStatus.movedFrom;
    }
    if (entry.wcStatus.commit) {
        r.commit = {
            revision: entry.wcStatus.commit.revision,
            author: entry.wcStatus.commit.author,
            date: entry.wcStatus.commit.date
        };
    }
    return [r];
}
function xmlToStatus(xml) {
    const statusList = [];
    if (xml.target && xml.target.entry) {
        statusList.push(...processEntry(xml.target.entry));
    }
    if (xml.changelist) {
        if (!Array.isArray(xml.changelist)) {
            xml.changelist = [xml.changelist];
        }
        xml.changelist.forEach((change) => {
            statusList.push(...processEntry(change.entry, change.name));
        });
    }
    return statusList;
}
async function parseStatusXml(content) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(content, constants_1.xml2jsParseSettings, (err, result) => {
            if (err) {
                reject();
            }
            const statusList = xmlToStatus(result);
            resolve(statusList);
        });
    });
}
exports.parseStatusXml = parseStatusXml;
//# sourceMappingURL=statusParser.js.map