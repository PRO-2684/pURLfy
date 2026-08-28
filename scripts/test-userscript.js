import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
    new URL("../src/purlfy.global.js", import.meta.url),
    "utf8",
);
const context = {
    EventTarget,
    TextDecoder,
    URL,
    URLSearchParams,
    atob,
    console,
    fetch,
};

vm.createContext(context);
vm.runInContext(source, context);
vm.runInContext(source, context);

assert.equal(typeof context.Purlfy, "function");
assert.equal(new context.Purlfy({ log: () => {} }).constructor, context.Purlfy);
console.log("* UserScript entry: ✅");
