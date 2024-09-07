// `node cli.js <url[]> [<options>]`
// `url` is the URL to purify. You can pass multiple URLs to purify them all.
// `options` can contain:
// - `--rules <enabled-rules>`, where `enabled-rules` is a comma-separated list of rules to enable. Default is all rules. Short-hand `-r`.

const Purlfy = require("./purlfy");
const { parseArgs } = require("node:util");

const options = {
    rules: {
        type: "string",
        short: "r",
        default: ""
    }
};
const args = process.argv.slice(2);
const {
    values,
    positionals: urls,
} = parseArgs({ args, options, allowPositionals: true });
const { rules: rulesStr } = values;
const enabledRules = rulesStr.trim().length ? rulesStr.split(",").map((rule) => rule.trim()).filter(Boolean) : require("./rules/list.json");
console.log("Enabled rules:", enabledRules);
console.log("---");

const purifier = new Purlfy({
    fetchEnabled: true,
    lambdaEnabled: true,
});
const rules = enabledRules.map((rule) => require(`./rules/${rule}.json`));
purifier.importRules(...rules);
for (const url of urls) {
    purifier.purify(url).then((purified) => {
        console.log(url, "=>", purified.url);
    });
}
