import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
    new URL("../src/purlfy.js", import.meta.url),
    "utf8",
);
const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { default: Purlfy } = await import(url);

assert.equal(typeof Purlfy, "function");
assert.equal(new Purlfy({ log: () => {} }).constructor, Purlfy);
console.log("* Resource import: ✅");
