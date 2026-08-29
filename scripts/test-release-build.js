import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = fileURLToPath(new URL("../dist", import.meta.url));
const result = spawnSync(process.execPath, ["scripts/build-release.js"], {
    cwd: root,
    encoding: "utf8",
});

assert.equal(result.status, 0, result.stderr);

const esm = ["purlfy.js", "purlfy.min.js"];
const userscript = ["purlfy.user.js", "purlfy.user.min.js"];

for (const name of esm) {
    const { default: Purlfy } = await import(
        pathToFileURL(`${dist}/${name}`).href + `?test=${Date.now()}`,
    );
    assert.equal(typeof Purlfy, "function");
    assert.equal(new Purlfy({ log: () => {} }).constructor, Purlfy);
}

for (const name of userscript) {
    const context = {
        EventTarget,
        TextDecoder,
        URL,
        URLSearchParams,
        atob,
        console,
        fetch,
    };
    vm.runInNewContext(fs.readFileSync(`${dist}/${name}`, "utf8"), context);
    assert.equal(typeof context.Purlfy, "function");
    assert.equal(
        new context.Purlfy({ log: () => {} }).constructor,
        context.Purlfy,
    );
}

assert.ok(
    fs.statSync(`${dist}/purlfy.min.js`).size <
        fs.statSync(`${dist}/purlfy.js`).size,
);
assert.ok(
    fs.statSync(`${dist}/purlfy.user.min.js`).size <
        fs.statSync(`${dist}/purlfy.user.js`).size,
);
console.log("* Release build: ✅");
