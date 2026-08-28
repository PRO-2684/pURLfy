import fs from "node:fs";
import { execFileSync } from "node:child_process";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    console.error("Usage: node scripts/update-version <version>");
    process.exit(1);
}

const packagePath = "./package.json";
const purlfyPath = "./src/purlfy.js";
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const purlfy = fs.readFileSync(purlfyPath, "utf8");
const updatedPurlfy = purlfy.replace(
    /return "\d+\.\d+\.\d+";/,
    `return "${version}";`,
);

if (updatedPurlfy === purlfy) {
    throw new Error(`Version not found in ${purlfyPath}`);
}

packageJson.version = version;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 4) + "\n");
fs.writeFileSync(purlfyPath, updatedPurlfy);

execFileSync("git", ["add", packagePath, purlfyPath], { stdio: "inherit" });
execFileSync("git", ["commit", "-m", `Bump version to ${version}`], {
    stdio: "inherit",
});
execFileSync("git", ["tag", `v${version}`, "-m", `Version ${version}`], {
    stdio: "inherit",
});
