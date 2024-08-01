// Modify the version number at `purlfy.js` file:
// `return "0.3.5";`
// to the new version number.
// And then `git add purlfy.js`.

const fs = require('fs');
const { exec } = require('child_process');
const package = require('../package.json');
const purlfyPath = "./purlfy.js";

const version = package.version;
const data = fs.readFileSync(purlfyPath, 'utf8');
const result = data.replace(/return "\d+\.\d+\.\d+";/, `return "${version}";`);
fs.writeFileSync(purlfyPath, result, 'utf8');
console.log(`Updated version to ${version}`);

console.log('Adding purlfy.js to git...');
exec('git add purlfy.js', (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
