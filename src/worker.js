const Purlfy = require("./purlfy");

let purifier = null;

async function init() {
    const base = "https://raw.githubusercontent.com/PRO-2684/pURLfy-rules/refs/heads/core-0.3.x/";
    const rulesList = await (await fetch(base + "list.json")).json();
    const rules = await Promise.all(rulesList.map(async (rule) => {
        const ruleData = await (await fetch(base + rule + ".min.json")).json();
        return ruleData;
    }));
    const purifier = new Purlfy({
        fetchEnabled: true,
        lambdaEnabled: true,
    });
    purifier.importRules(...rules);
    return purifier;
}

export default {
    async fetch(request) {
        if (!purifier) {
            purifier = await init();
        }
        const url = new URL(request.url);
        switch (url.pathnam) {
            case "/purify": {
                const targetUrl = url.searchParams.get("url");
                if (!targetUrl) {
                    return new Response("Missing 'url' query parameter", { status: 400 });
                }
                try {
                    const purified = await purifier.purify(targetUrl);
                    return new Response(JSON.stringify(purified), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    });
                } catch (error) {
                    return new Response("Error purifying URL: " + error.message, { status: 500 });
                }
            }
            default:
                return new Response("Not Found", { status: 404 });
        }
    }
}
