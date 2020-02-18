"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const pathNormalizer_1 = require("./pathNormalizer");
class RemoteRepository {
    constructor(repo) {
        this.repo = repo;
        this.info = repo.info;
    }
    static async open(svn, uri) {
        const repo = await svn.open(uri.toString(true), "");
        return new RemoteRepository(repo);
    }
    getPathNormalizer() {
        return new pathNormalizer_1.PathNormalizer(this.info);
    }
    get branchRoot() {
        return vscode_1.Uri.parse(this.info.url);
    }
    async log(rfrom, rto, limit, target) {
        return this.repo.log(rfrom, rto, limit, target);
    }
    async show(filePath, revision) {
        return this.repo.show(filePath, revision);
    }
}
exports.RemoteRepository = RemoteRepository;
//# sourceMappingURL=remoteRepository.js.map