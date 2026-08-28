import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "purlfy-version-"));
const run = (command, args) =>
    spawnSync(command, args, { cwd: workspace, encoding: "utf8" });

try {
    fs.mkdirSync(path.join(workspace, "src"));
    fs.writeFileSync(
        path.join(workspace, "package.json"),
        '{"version":"0.0.0"}\n',
    );
    fs.writeFileSync(
        path.join(workspace, "src", "purlfy.global.js"),
        'static get version() { return "0.0.0"; }\n',
    );
    run("git", ["init"]);
    run("git", ["config", "user.email", "test@example.com"]);
    run("git", ["config", "user.name", "Test"]);
    run("git", ["add", "."]);
    run("git", ["commit", "-m", "Initial"]);

    const missingVersion = run(process.execPath, [
        fileURLToPath(new URL("./update-version.js", import.meta.url)),
    ]);
    assert.notEqual(missingVersion.status, 0);

    const result = run(process.execPath, [
        fileURLToPath(new URL("./update-version.js", import.meta.url)),
        "1.2.3",
    ]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
        JSON.parse(fs.readFileSync(path.join(workspace, "package.json")))
            .version,
        "1.2.3",
    );
    assert.match(
        fs.readFileSync(
            path.join(workspace, "src", "purlfy.global.js"),
            "utf8",
        ),
        /return "1\.2\.3";/,
    );
    assert.equal(
        run("git", ["log", "-1", "--pretty=%s"]).stdout.trim(),
        "Bump version to 1.2.3",
    );
    assert.equal(run("git", ["tag", "--list"]).stdout.trim(), "v1.2.3");
    console.log("* Version updater: ✅");
} finally {
    fs.rmSync(workspace, { recursive: true, force: true });
}
