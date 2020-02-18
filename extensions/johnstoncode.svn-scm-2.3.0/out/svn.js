"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const events_1 = require("events");
const proc = require("process");
const types_1 = require("./common/types");
const encodeUtil = require("./encoding");
const configuration_1 = require("./helpers/configuration");
const infoParser_1 = require("./infoParser");
const svnError_1 = require("./svnError");
const svnRepository_1 = require("./svnRepository");
const util_1 = require("./util");
const vscodeModules_1 = require("./vscodeModules");
exports.svnErrorCodes = {
    AuthorizationFailed: "E170001",
    RepositoryIsLocked: "E155004",
    NotASvnRepository: "E155007",
    NotShareCommonAncestry: "E195012",
    WorkingCopyIsTooOld: "E155036"
};
function getSvnErrorCode(stderr) {
    for (const name in exports.svnErrorCodes) {
        if (exports.svnErrorCodes.hasOwnProperty(name)) {
            const code = exports.svnErrorCodes[name];
            const regex = new RegExp(`svn: ${code}`);
            if (regex.test(stderr)) {
                return code;
            }
        }
    }
    if (/No more credentials or we tried too many times/.test(stderr)) {
        return exports.svnErrorCodes.AuthorizationFailed;
    }
    return void 0;
}
function cpErrorHandler(cb) {
    return err => {
        if (/ENOENT/.test(err.message)) {
            err = new svnError_1.default({
                error: err,
                message: "Failed to execute svn (ENOENT)",
                svnErrorCode: "NotASvnRepository"
            });
        }
        cb(err);
    };
}
exports.cpErrorHandler = cpErrorHandler;
class Svn {
    constructor(options) {
        this.lastCwd = "";
        this._onOutput = new events_1.EventEmitter();
        this.svnPath = options.svnPath;
    }
    get onOutput() {
        return this._onOutput;
    }
    logOutput(output) {
        this._onOutput.emit("log", output);
    }
    async exec(cwd, args, options = {}) {
        if (cwd) {
            this.lastCwd = cwd;
            options.cwd = cwd;
        }
        if (options.log !== false) {
            const argsOut = args.map(arg => (/ |^$/.test(arg) ? `'${arg}'` : arg));
            this.logOutput(`[${this.lastCwd.split(/[\\\/]+/).pop()}]$ svn ${argsOut.join(" ")}\n`);
        }
        if (options.username) {
            args.push("--username", options.username);
        }
        if (options.password) {
            args.push("--password", options.password);
        }
        if (options.username || options.password) {
            // Configuration format: FILE:SECTION:OPTION=[VALUE]
            // Disable password store
            args.push("--config-option", "config:auth:password-stores=");
            // Disable store auth credentials
            args.push("--config-option", "servers:global:store-auth-creds=no");
        }
        // Force non interactive environment
        args.push("--non-interactive");
        let encoding = options.encoding;
        delete options.encoding;
        // SVN with '--xml' always return 'UTF-8', and jschardet detects this encoding: 'TIS-620'
        if (args.includes("--xml")) {
            encoding = "utf8";
        }
        const defaults = {
            env: proc.env
        };
        if (cwd) {
            defaults.cwd = cwd;
        }
        defaults.env = Object.assign({}, proc.env, options.env || {}, {
            LC_ALL: "en_US.UTF-8",
            LANG: "en_US.UTF-8"
        });
        const process = cp.spawn(this.svnPath, args, defaults);
        const disposables = [];
        const once = (ee, name, fn) => {
            ee.once(name, fn);
            disposables.push(util_1.toDisposable(() => ee.removeListener(name, fn)));
        };
        const on = (ee, name, fn) => {
            ee.on(name, fn);
            disposables.push(util_1.toDisposable(() => ee.removeListener(name, fn)));
        };
        const [exitCode, stdout, stderr] = await Promise.all([
            new Promise((resolve, reject) => {
                once(process, "error", reject);
                once(process, "exit", resolve);
            }),
            new Promise(resolve => {
                const buffers = [];
                on(process.stdout, "data", (b) => buffers.push(b));
                once(process.stdout, "close", () => resolve(Buffer.concat(buffers)));
            }),
            new Promise(resolve => {
                const buffers = [];
                on(process.stderr, "data", (b) => buffers.push(b));
                once(process.stderr, "close", () => resolve(Buffer.concat(buffers).toString()));
            })
        ]);
        util_1.dispose(disposables);
        if (!encoding) {
            encoding = encodeUtil.detectEncoding(stdout);
        }
        // if not detected
        if (!encoding) {
            encoding = configuration_1.configuration.get("default.encoding");
        }
        if (!vscodeModules_1.iconv.encodingExists(encoding)) {
            if (encoding) {
                console.warn(`SVN: The encoding "${encoding}" is invalid`);
            }
            encoding = "utf8";
        }
        const decodedStdout = vscodeModules_1.iconv.decode(stdout, encoding);
        if (options.log !== false && stderr.length > 0) {
            const name = this.lastCwd.split(/[\\\/]+/).pop();
            const err = stderr
                .split("\n")
                .filter((line) => line)
                .map((line) => `[${name}]$ ${line}`)
                .join("\n");
            this.logOutput(err);
        }
        if (exitCode) {
            return Promise.reject(new svnError_1.default({
                message: "Failed to execute svn",
                stdout: decodedStdout,
                stderr,
                stderrFormated: stderr.replace(/^svn: E\d+: +/gm, ""),
                exitCode,
                svnErrorCode: getSvnErrorCode(stderr),
                svnCommand: args[0]
            }));
        }
        return { exitCode, stdout: decodedStdout, stderr };
    }
    async getRepositoryRoot(path) {
        try {
            const result = await this.exec(path, ["info", "--xml"]);
            const info = await infoParser_1.parseInfoXml(result.stdout);
            if (info && info.wcInfo && info.wcInfo.wcrootAbspath) {
                return info.wcInfo.wcrootAbspath;
            }
            // SVN 1.6 not has "wcroot-abspath"
            return path;
        }
        catch (error) {
            if (error instanceof svnError_1.default) {
                throw error;
            }
            console.error(error);
            throw new Error("Unable to find repository root path");
        }
    }
    async open(repositoryRoot, workspaceRoot) {
        return new svnRepository_1.Repository(this, repositoryRoot, workspaceRoot, types_1.ConstructorPolicy.Async);
    }
}
exports.Svn = Svn;
//# sourceMappingURL=svn.js.map