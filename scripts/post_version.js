// Modify the version number at `purlfy.js` file:
// `return "0.3.5";`
// to the new version number.

const fs = require('fs');
const package = require('../package.json');
const purlfyPath = "./purlfy.js";
const version = package.version;

fs.readFile(purlfyPath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const result = data.replace(/return "\d+\.\d+\.\d+";/, `return "${version}";`);

    fs.writeFile(purlfyPath, result, 'utf8', (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Updated version to ${version}`);
    });
});
