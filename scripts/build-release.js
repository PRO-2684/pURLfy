import fs from "node:fs";
import { minify } from "terser";

const source = fs.readFileSync(
    new URL("../src/purlfy.js", import.meta.url),
    "utf8",
);
const exportStatement = "export default Purlfy;";

if (!source.includes(exportStatement)) {
    throw new Error(`Missing expected source export: ${exportStatement}`);
}

const userscript = `(() => {\n${source.replace(
    exportStatement,
    "globalThis.Purlfy = Purlfy;",
)}})();\n`;
const banner = "/*! pURLfy | GPL-3.0-or-later */";
const esmMin = await minify(source, {
    module: true,
    format: { preamble: banner },
});
const userscriptMin = await minify(userscript, {
    format: { preamble: banner },
});
const dist = new URL("../dist/", import.meta.url);

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(new URL("purlfy.js", dist), source);
fs.writeFileSync(new URL("purlfy.min.js", dist), `${esmMin.code}\n`);
fs.writeFileSync(new URL("purlfy.user.js", dist), userscript);
fs.writeFileSync(
    new URL("purlfy.user.min.js", dist),
    `${userscriptMin.code}\n`,
);
