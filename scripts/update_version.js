// Modify the version number at `purlfy.js` file:
// `return "0.3.5";`
// to the new version number.
// And then add the file to git, commit with message "Bump version to x.y.z", and tag the commit with "vX.Y.Z" where X.Y.Z is the new version number.

import fs from "fs";
import { exec } from "child_process";
import packageJson from "../package.json" with { type: "json" };
const purlfyPath = "./src/purlfy.js";

const version = packageJson.version;
const data = fs.readFileSync(purlfyPath, "utf8");
const result = data.replace(/return "\d+\.\d+\.\d+";/, `return "${version}";`);
fs.writeFileSync(purlfyPath, result, "utf8");
console.log(`Updated version to ${version}`);

console.log(`Adding ${purlfyPath} to git...`);
exec(`git add ${purlfyPath}`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
console.log("Committing changes...");
exec(`git commit -m "Bump version to ${version}"`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
console.log("Tagging version...");
exec(`git tag v${version} -m "Version ${version}"`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
