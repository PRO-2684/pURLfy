class Purlfy extends EventTarget {
    // TODO: Static-ify some properties and methods
    static version = "0.3.1-dev";
    fetchEnabled = false;
    lambdaEnabled = false;
    maxIterations = 5;
    #log = console.log.bind(console, "\x1b[38;2;220;20;60m[pURLfy]\x1b[0m");
    #fetch = fetch;
    #acts = {
        "url": decodeURIComponent,
        "base64": s => decodeURIComponent(escape(atob(s.replaceAll('_', '/').replaceAll('-', '+')))),
        "slice": (s, start, end) => s.slice(parseInt(start), end ? parseInt(end) : undefined),
        "regex": (s, regex) => {
            const r = new RegExp(regex);
            const m = s.match(r);
            return m ? m[0] : "";
        },
        "dom": (s) => new DOMParser().parseFromString(s, "text/html"),
        "sel": (s, selector) => s.querySelector(selector),
        "attr": (e, attr) => e.getAttribute(attr),
        "text": (e) => e.textContent,
    };
    #zeroStatistics = {
        url: 0,
        param: 0,
        decoded: 0,
        redirected: 0,
        visited: 0,
        char: 0
    };
    #statistics = { ...this.#zeroStatistics };
    #rules = {};
    #AsyncFunction = async function () { }.constructor;

    constructor(options) {
        super();
        this.fetchEnabled = options?.fetchEnabled ?? this.fetchEnabled;
        this.lambdaEnabled = options?.lambdaEnabled ?? this.lambdaEnabled;
        this.maxIterations = options?.maxIterations ?? this.maxIterations;
        Object.assign(this.#statistics, options?.statistics);
        this.#log = options?.log ?? this.#log;
        this.#fetch = options?.fetch ?? this.#fetch;
    }

    clearStatistics() {
        const increment = {};
        for (const [key, value] of Object.entries(this.#statistics)) {
            increment[key] = -value;
        }
        this.#incrementStatistics(increment);
    }

    clearRules() {
        this.#rules = {};
    }

    getStatistics() {
        return { ...this.#statistics };
    }

    importRules(rules) {
        Object.assign(this.#rules, rules);
    }

    #udfOrType(value, type) { // If the given value is of the given type or undefined
        return value === undefined || typeof value === type;
    }

    #validRule(rule) { // Check if the given rule is valid
        if (!rule || !rule.mode || !rule.description || !rule.author) return false;
        switch (rule.mode) {
            case "white":
            case "black":
                return Array.isArray(rule.params) && this.#udfOrType(rule.std, "boolean");
            case "param":
                return Array.isArray(rule.params) && (rule.acts === undefined || Array.isArray(rule.acts)) && this.#udfOrType(rule.continue, "boolean");
            case "regex":
                return Array.isArray(rule.regex) && Array.isArray(rule.replace) && this.#udfOrType(rule.continue, "boolean") && rule.regex.length === rule.replace.length;
            case "redirect":
                return this.fetchEnabled && this.#udfOrType(rule.ua, "string") && this.#udfOrType(rule.continue, "boolean");
            case "visit":
                return this.fetchEnabled && this.#udfOrType(rule.ua, "string") && (rule.acts === undefined || Array.isArray(rule.acts)) && this.#udfOrType(rule.continue, "boolean");
            case "lambda":
                return this.lambdaEnabled && (typeof rule.lambda === "string" || rule.lambda instanceof this.#AsyncFunction) && this.#udfOrType(rule.continue, "boolean");
            default:
                return false;
        }
    }

    #matchRule(parts) { // Iteratively match the longest rule for the given URL parts
        let fallbackRule = null; // Most precise fallback rule
        let currentRules = this.#rules;
        for (const part of parts) {
            if (currentRules.hasOwnProperty("")) {
                fallbackRule = currentRules[""];
            }
            if (currentRules.hasOwnProperty(part + "/")) {
                currentRules = currentRules[part + "/"]; // Exact match - continue to the next level
            } else if (currentRules.hasOwnProperty(part)) {
                const rule = currentRules[part];
                if (this.#validRule(rule)) {
                    return rule; // Exact match found
                }
            } else { // No exact match found, try to match with regex
                let found = false;
                // Iterate through current rules to match RegExp
                for (const [key, val] of Object.entries(currentRules)) {
                    if (!key.startsWith("/")) continue; // Skip non-RegExp keys
                    try {
                        const sub = key.endsWith("/"); // Has sub-rules
                        const regex = new RegExp(sub ? key.slice(1, -1) : key.slice(1));
                        if (regex.test(part)) { // Regex matches
                            if (!sub && this.#validRule(val)) {
                                return val; // Regex match found
                            } else if (sub) {
                                currentRules = val; // Continue to the next level
                                found = true;
                                break;
                            }
                        }
                    } catch (e) {
                        this.#log("Invalid regex:", key.slice(1));
                    }
                }
                if (!found) break; // No matching rule found
            }
        }
        if (currentRules.hasOwnProperty("")) { // Fallback rule
            fallbackRule = currentRules[""];
        }
        if (this.#validRule(fallbackRule)) {
            return fallbackRule;
        }
        return null;
    }

    #isStandard(urlObj) { // Check if the given urlObj's search string follows the standard format
        return urlObj.searchParams.toString() === urlObj.search.slice(1);
    }

    #applyActs(input, acts, logFunc) { // Apply the given acts to the given input
        let dest = input;
        for (const cmd of (acts)) {
            const args = cmd.split(":");
            const name = args[0];
            const act = this.#acts[name];
            if (!act) {
                logFunc("Invalid act:", cmd);
                dest = null;
                break;
            }
            try {
                dest = act(dest, ...args.slice(1));
            } catch (e) {
                logFunc(`Error processing input with act "${name}":`, e);
                dest = null;
                break;
            }
        }
        return dest;
    }

    async #applyRule(urlObj, rule, logFunc) { // Apply the given rule to the given URL object, returning the new URL object, whether to continue and the mode-specific incremental statistics
        const mode = rule.mode;
        const increment = { ...this.#zeroStatistics }; // Incremental statistics
        const lengthBefore = urlObj.href.length;
        const paramsCntBefore = urlObj.searchParams.size;
        let shallContinue = false;
        switch (mode) { // Purifies `urlObj` based on the rule
            case "white": { // Whitelist mode
                if (!rule.std && !this.#isStandard(urlObj)) {
                    logFunc("Non-standard URL search string:", urlObj.search);
                    break;
                }
                const newParams = new URLSearchParams();
                for (const param of rule.params) {
                    if (urlObj.searchParams.has(param)) {
                        newParams.set(param, urlObj.searchParams.get(param));
                    }
                }
                urlObj.search = newParams.toString();
                break;
            }
            case "black": { // Blacklist mode
                if (!rule.std && !this.#isStandard(urlObj)) {
                    logFunc("Non-standard URL search string:", urlObj.search);
                    break;
                }
                for (const param of rule.params) {
                    urlObj.searchParams.delete(param);
                }
                urlObj.search = urlObj.searchParams.toString();
                break;
            }
            case "param": { // Specific param mode
                // Process given parameter to be used as a new URL
                let paramValue = null;
                for (const param of rule.params) { // Find the first available parameter value
                    if (urlObj.searchParams.has(param)) {
                        paramValue = urlObj.searchParams.get(param);
                        break;
                    }
                }
                if (!paramValue) {
                    logFunc("Parameter(s) not found:", rule.params.join(", "));
                    break;
                }
                const dest = this.#applyActs(paramValue, rule.acts ?? ["url"], logFunc);
                if (dest && URL.canParse(dest, urlObj.href)) { // Valid URL
                    urlObj = new URL(dest, urlObj.href);
                } else { // Invalid URL
                    logFunc("Invalid URL:", dest);
                    break;
                }
                shallContinue = rule.continue ?? true;
                increment.decoded++;
                break;
            }
            case "regex": { // Regex mode
                let newUrl = urlObj.href;
                for (let i = 0; i < rule.regex.length; i++) {
                    const regex = new RegExp(rule.regex[i], "g");
                    const replace = rule.replace[i];
                    newUrl = newUrl.replaceAll(regex, replace);
                }
                if (URL.canParse(newUrl, urlObj.href)) { // Valid URL
                    urlObj = new URL(newUrl);
                } else { // Invalid URL
                    logFunc("Invalid URL:", newUrl);
                    break;
                }
                break;
            }
            case "redirect": { // Redirect mode
                if (!this.fetchEnabled) {
                    logFunc("Redirect mode is disabled.");
                    break;
                }
                const options = {
                    method: "HEAD",
                    redirect: "manual"
                };
                if (rule.ua) {
                    options.headers = {
                        "User-Agent": rule.ua
                    };
                }
                let dest = null;
                try {
                    const r = await this.#fetch(urlObj.href, options);
                    if (r.status >= 300 && r.status < 400 && r.headers.has("location")) {
                        dest = r.headers.get("location");
                    } else if (r.url !== urlObj.href) {
                        dest = r.url; // In case `redirect: manual` doesn't work
                    }
                } catch (e) {
                    logFunc("Error following redirect:", e);
                    break;
                }
                if (dest && URL.canParse(dest, urlObj.href)) {
                    const prevUrl = urlObj.href;
                    urlObj = new URL(dest, urlObj.href);
                    if (urlObj.href === prevUrl) { // No redirection
                        logFunc("No redirection made.");
                        break;
                    }
                    shallContinue = rule.continue ?? true;
                    increment.redirected++;
                } else {
                    logFunc("Invalid redirect destination:", dest);
                }
                break;
            }
            case "visit": { // Visit mode
                if (!this.fetchEnabled) {
                    logFunc("Visit mode is disabled.");
                    break;
                }
                const options = {
                    method: "GET",
                    redirect: "follow" // TODO: "manual"
                };
                if (rule.ua) {
                    options.headers = {
                        "User-Agent": rule.ua
                    };
                }
                let r, html = null;
                try {
                    r = await this.#fetch(urlObj.href, options);
                    html = await r.text();
                } catch (e) {
                    logFunc("Error visiting URL:", e);
                    break;
                }
                const redirected = r.url !== urlObj.href;
                if (redirected) {
                    logFunc("Visit mode, but got redirected to:", r.url);
                    urlObj = new URL(r.url, urlObj.href);
                } else {
                    const dest = this.#applyActs(html, rule.acts ?? ["regex:https?:\/\/.(?:www\.)?[-a-zA-Z0-9@%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?!&\/\/=]*)"], logFunc);
                    if (dest && URL.canParse(dest, urlObj.href)) { // Valid URL
                        urlObj = new URL(dest, urlObj.href);
                    } else { // Invalid URL
                        logFunc("Invalid URL:", dest);
                        break;
                    }
                }
                shallContinue = rule.continue ?? true;
                increment.visited++;
                break;
            }
            case "lambda": {
                if (!this.lambdaEnabled) {
                    logFunc("Lambda mode is disabled.");
                    break;
                }
                try {
                    const lambda = typeof rule.lambda === "string" ? new this.#AsyncFunction("url", rule.lambda) : rule.lambda;
                    rule.lambda = lambda; // "Cache" the compiled lambda function
                    urlObj = await lambda(urlObj);
                    shallContinue = rule.continue ?? true;
                } catch (e) {
                    logFunc("Error executing lambda:", e);
                }
                break;
            }
            default: {
                logFunc("Invalid mode:", mode);
                break;
            }
        }
        const paramsCntAfter = urlObj.searchParams.size;
        increment.param += (["white", "black"].includes(mode)) ? (paramsCntBefore - paramsCntAfter) : 0;
        increment.char += Math.max(lengthBefore - urlObj.href.length, 0); // Prevent negative char count
        return [urlObj, shallContinue, increment];
    }

    #incrementStatistics(increment) {
        for (const [key, value] of Object.entries(increment)) {
            this.#statistics[key] += value;
        }
        if (typeof CustomEvent === "function") {
            this.dispatchEvent(new CustomEvent("statisticschange", {
                detail: increment
            }));
        } else {
            this.dispatchEvent(new Event("statisticschange"));
        }
    }

    async purify(originalUrl) { // Purify the given URL based on `rules`
        let increment = { ...this.#zeroStatistics }; // Incremental statistics of a single purification
        let shallContinue = true;
        let firstRule = null;
        let iteration = 0;
        let urlObj;
        this.#log("Purifying URL:", originalUrl);
        const optionalLocation = typeof location !== 'undefined' ? location.href : undefined;
        if (URL.canParse(originalUrl, optionalLocation)) {
            urlObj = new URL(originalUrl, optionalLocation);
        } else {
            this.#log(`Cannot parse URL ${originalUrl}`);
            return {
                url: originalUrl,
                rule: "N/A"
            }
        }
        while (shallContinue && iteration++ < this.maxIterations) {
            const logi = (...args) => this.#log(`[#${iteration}]`, ...args);
            const protocol = urlObj.protocol;
            if (protocol !== "http:" && protocol !== "https:") { // Not a valid HTTP URL
                logi(`Not a HTTP URL: ${urlObj.href}`);
                break;
            }
            const hostAndPath = urlObj.host + urlObj.pathname;
            const parts = hostAndPath.split("/").filter(part => part !== "");
            const rule = this.#matchRule(parts);
            if (!rule) { // No matching rule found
                logi(`No matching rule found for ${urlObj.href}.`);
                break;
            }
            firstRule ??= rule;
            logi(`Matching rule: ${rule.description} by ${rule.author}`);
            let singleIncrement; // Incremental statistics for the current iteration
            [urlObj, shallContinue, singleIncrement] = await this.#applyRule(urlObj, rule, logi);
            for (const [key, value] of Object.entries(singleIncrement)) {
                increment[key] += value;
            }
            logi("Purified URL:", urlObj.href);
        }
        if (firstRule && originalUrl !== urlObj.href) { // Increment statistics only if a rule was applied and URL has been changed
            increment.url++;
            this.#incrementStatistics(increment);
        }
        return {
            url: urlObj.href,
            rule: firstRule ? `${firstRule.description} by ${firstRule.author}` : "N/A"
        };
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = Purlfy; // Export for Node.js
} else {
    this.Purlfy = Purlfy; // Export for browser
}
