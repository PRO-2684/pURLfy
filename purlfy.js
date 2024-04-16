class Purlfy extends EventTarget {
    redirectEnabled = false;
    lambdaEnabled = false;
    maxIterations = 5;
    #log = console.log.bind(console, "\x1b[38;2;220;20;60m[pURLfy]\x1b[0m");
    #paramDecoders = {
        "url": decodeURIComponent,
        "base64": s => decodeURIComponent(escape(atob(s.replaceAll('_', '/').replaceAll('-', '+')))),
        "slice": (s, start, end) => s.slice(parseInt(start), end ? parseInt(end) : undefined),
    };
    #zeroStatistics = {
        url: 0,
        param: 0,
        decoded: 0,
        redirected: 0,
        char: 0
    };
    #statistics = { ...this.#zeroStatistics };
    #rules = {};
    #AsyncFunction = async function() {}.constructor;

    constructor(options) {
        super();
        this.redirectEnabled = options?.redirectEnabled ?? this.redirectEnabled;
        this.lambdaEnabled = options?.lambdaEnabled ?? this.lambdaEnabled;
        this.maxIterations = options?.maxIterations ?? this.maxIterations;
        Object.assign(this.#statistics, options?.statistics);
        this.#log = options?.log ?? this.#log;
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
                return Array.isArray(rule.params);
            case "param":
                return Array.isArray(rule.params) && (rule.decode === undefined || Array.isArray(rule.decode)) && this.#udfOrType(rule.continue, "boolean");
            case "regex":
                return false; // Not implemented yet
            case "redirect":
                return this.redirectEnabled && this.#udfOrType(rule.continue, "boolean");
            case "lambda":
                return this.lambdaEnabled && typeof rule.lambda === "string" && this.#udfOrType(rule.continue, "boolean");
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

    async #applyRule(urlObj, rule, logFunc) { // Apply the given rule to the given URL object, returning the new URL object, whether to continue and the mode-specific incremental statistics
        const mode = rule.mode;
        const increment = { ...this.#zeroStatistics }; // Incremental statistics
        const lengthBefore = urlObj.href.length;
        const paramsCntBefore = urlObj.searchParams.size;
        let shallContinue = false;
        switch (mode) { // Purifies `urlObj` based on the rule
            case "white": { // Whitelist mode
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
                for (const param of rule.params) {
                    urlObj.searchParams.delete(param);
                }
                break;
            }
            case "param": { // Specific param mode
                // Decode given parameter to be used as a new URL
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
                let dest = paramValue;
                let success = true;
                for (const cmd of (rule.decode ?? ["url"])) {
                    const args = cmd.split(":");
                    const name = args[0];
                    const decoder = this.#paramDecoders[name];
                    if (!decoder) {
                        logFunc("Invalid decoder:", cmd);
                        success = false;
                        break;
                    }
                    try {
                        dest = decoder(dest, ...args.slice(1));
                    } catch (e) {
                        logFunc(`Error decoding parameter with decoder "${name}":`, e);
                        break;
                    }
                }
                if (!success) break;
                if (URL.canParse(dest, urlObj.href)) { // Valid URL
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
                logFunc("Regex mode not implemented yet");
                break;
            }
            case "redirect": { // Redirect mode
                if (!this.redirectEnabled) {
                    logFunc("Redirect mode is disabled.");
                    break;
                }
                let r = null;
                try {
                    r = await fetch(urlObj.href, {
                        method: "HEAD",
                        redirect: "manual"
                    });
                } catch (e) {
                    logFunc("Error fetching URL:", e);
                    break;
                }
                if ((r.status === 301 || r.status === 302) && r.headers.has("location")) {
                    let dest = r.headers.get("location");
                    urlObj = new URL(dest);
                    shallContinue = rule.continue ?? true;
                    increment.redirected++;
                }
                break;
            }
            case "lambda": {
                if (!this.lambdaEnabled) {
                    logFunc("Lambda mode is disabled.");
                    break;
                }
                try {
                    const lambda = new this.#AsyncFunction("url", rule.lambda);
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
        if (URL.canParse(originalUrl)) {
            urlObj = new URL(originalUrl);
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
