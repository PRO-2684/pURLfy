const Purlfy = require('../src/purlfy.js');
const rules = require('./test-rules.json');
const tests = require('./test-cases.json');
const purifier = new Purlfy({
    fetchEnabled: true,
    lambdaEnabled: true,
    log: () => {}, // Disable logging
});
purifier.importRules(rules);

const promises = [];
for (const test of tests) {
    promises.push(purifier.purify(test.input).then((result) => {
        const expected = test.output.replace(/\/$/, '');
        const actual = result.url.replace(/\/$/, '');
        const match = expected === actual;
        if (match) {
            console.log(`* Mode: ${test.mode}, Match: ✅`);
            return true;
        } else {
            console.log(`* Mode: ${test.mode}, Match: ❌, Input: "${test.input}", Expected: "${test.output}", Output: "${result.url}"`);
            return false;
        }
    }));
}

Promise.all(promises).then((results) => {
    const failed = results.filter((result) => !result);
    const icon = failed.length === 0 ? '🎉' : '😢';
    console.log(`* Tests: ${results.length}, Failed: ${failed.length} ${icon}`);
});
