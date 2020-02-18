"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscodeModules_1 = require("./vscodeModules");
if (vscodeModules_1.jschardet.Constants) {
    vscodeModules_1.jschardet.Constants.MINIMUM_THRESHOLD = 0.2;
    vscodeModules_1.jschardet.MacCyrillicModel.mTypicalPositiveRatio += 0.001;
}
function detectEncodingByBOM(buffer) {
    if (!buffer || buffer.length < 2) {
        return null;
    }
    const b0 = buffer.readUInt8(0);
    const b1 = buffer.readUInt8(1);
    // UTF-16 BE
    if (b0 === 0xfe && b1 === 0xff) {
        return "utf16be";
    }
    // UTF-16 LE
    if (b0 === 0xff && b1 === 0xfe) {
        return "utf16le";
    }
    if (buffer.length < 3) {
        return null;
    }
    const b2 = buffer.readUInt8(2);
    // UTF-8
    if (b0 === 0xef && b1 === 0xbb && b2 === 0xbf) {
        return "utf8";
    }
    return null;
}
const IGNORE_ENCODINGS = ["ascii", "utf-8", "utf-16", "utf-32"];
const JSCHARDET_TO_ICONV_ENCODINGS = {
    ibm866: "cp866",
    big5: "cp950"
};
function detectEncoding(buffer) {
    const result = detectEncodingByBOM(buffer);
    if (result) {
        return result;
    }
    const detected = vscodeModules_1.jschardet.detect(buffer);
    if (!detected || !detected.encoding || detected.confidence < 0.8) {
        return null;
    }
    const encoding = detected.encoding;
    // Ignore encodings that cannot guess correctly
    // (http://chardet.readthedocs.io/en/latest/supported-encodings.html)
    if (0 <= IGNORE_ENCODINGS.indexOf(encoding.toLowerCase())) {
        return null;
    }
    const normalizedEncodingName = encoding
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
    const mapped = JSCHARDET_TO_ICONV_ENCODINGS[normalizedEncodingName];
    return mapped || normalizedEncodingName;
}
exports.detectEncoding = detectEncoding;
//# sourceMappingURL=encoding.js.map