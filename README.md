<img src="./images/logo.svg" align="right" style="width: 6em; height: 6em;"></img>

# pURLfy

English | [简体中文](./README_zh.md)

The ultimate URL purifier.

> [!NOTE]
> Do you know that the name "pURLfy" is a combination of "purify" and "URL"? It can be pronounced as `pjuɑrelfaɪ`.

## 🪄 Functionalities

Purify URL: Remove redundant tracking parameters, skip redirecting pages, and extract the link that really matters.

- ⚡ Fast: Purify URLs quickly and efficiently.
- 🪶 Lightweight: Zero-dependency; Minified script less than 4kb.
- 📃 Rule-based: Perform purification based on rules, making it more flexible.
- 🔄️ Async: Calling `purify` won't block your thread.
- 🔁 Iterative purification: If the URL still contains tracking parameters after a single purification (e.g. URLs returned by `redirect` rules), it will continue to be purified.
- 📊 Statistics: You can track statistics of the purification process, including the number of links purified, the number of parameters removed, the number of URLs decoded, the number of URLs redirected, and the number of characters deleted, etc.

## 🤔 Usage

### 🚀 Quick Start

Visit our [demo page](https://pro-2684.github.io/?page=purlfy), or try it out with our Telegram bot [@purlfy_bot](https://t.me/purlfy_bot)!

```js
// Somewhat import `Purlfy` class from https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy@latest/purlfy.min.js
const purifier = new Purlfy({ // Instantiate a Purlfy object
    fetchEnabled: true,
    lambdaEnabled: true,
});
const rules = await (await fetch("https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy-rules@core-0.3.x/<ruleset>.json")).json(); // Rules
// You may also use GitHub raw link for really latest rules: https://raw.githubusercontent.com/PRO-2684/pURLfy-rules/core-0.3.x/<ruleset>.json
purifier.importRules(rules); // Import rules
const additionalRules = {}; // You can also add your own rules
purifier.importRules(additionalRules);
purifier.addEventListener("statisticschange", e => { // Add an event listener for statistics change
    console.log("Statistics increment:", e.detail); // Only available in platforms that support `CustomEvent`
    console.log("Current statistics:", purifier.getStatistics());
});
purifier.purify("https://example.com/?utm_source=123").then(console.log); // Purify a URL
```

Here's a list of test URLs that you can use to test pURLfy:

- Bilibili's short link: `https://b23.tv/SI6OEcv`
- Ordinary Tieba link: `https://tieba.baidu.com/p/7989575070?share=none&fr=none&see_lz=none&share_from=none&sfc=none&client_type=none&client_version=none&st=none&is_video=none&unique=none`
- MC Wiki's external link: `https://link.mcmod.cn/target/aHR0cHM6Ly9naXRodWIuY29tL3dheTJtdWNobm9pc2UvQmV0dGVyQWR2YW5jZW1lbnRz`
- Bing's search result: `https://www.bing.com/ck/a?!&&p=de70ef254652193fJmltdHM9MTcxMjYyMDgwMCZpZ3VpZD0wMzhlNjdlMy1mN2I2LTZmMDktMGE3YS03M2JlZjZhMzZlOGMmaW5zaWQ9NTA2Nw&ptn=3&ver=2&hsh=3&fclid=038e67e3-f7b6-6f09-0a7a-73bef6a36e8c&psq=anti&u=a1aHR0cHM6Ly9nby5taWNyb3NvZnQuY29tL2Z3bGluay8_bGlua2lkPTg2ODkyMg&ntb=1`
- A URL nested too many times that cannot be opened normally: `https://www.minecraftforum.net/linkout?remoteUrl=https%3A%2F%2Fwww.urlshare.cn%2Fumirror_url_check%3Furl%3Dhttps%253A%252F%252Fc.pc.qq.com%252Fmiddlem.html%253Fpfurl%253Dhttps%25253A%25252F%25252Fgithub.com%25252Fjiashuaizhang%25252Frpc-encrypt%25253Futm_source%25253Dtest`

### 📚 API

#### Constructor

```js
new Purlfy({
    fetchEnabled: Boolean, // Enable the redirect mode (default: false)
    lambdaEnabled: Boolean, // Enable the lambda mode (default: false)
    maxIterations: Number, // Maximum number of iterations (default: 5)
    statistics: { // Initial statistics
        url: Number, // Number of links purified
        param: Number, // Number of parameters removed
        decoded: Number, // Number of URLs decoded (`param` mode)
        redirected: Number, // Number of URLs redirected (`redirect` mode)
        visited: Number, // Number of URLs visited (`visit` mode)
        char: Number, // Number of characters deleted
    },
    log: Function, // Log function (default is using `console.log` for output)
    fetch: async Function, // Function to fetch the given URL, should at least support `method`, `headers` and `redirect` in `options` parameter (default is using `fetch`)
})
```

#### Instance Methods

- `importRules(rules: object): void`: Import rules.
- `purify(url: string): Promise<object>`: Purify a URL.
    - `url`: The URL to be purified.
    - Returns a `Promise` that resolves to an object containing:
        - `url: string`: The purified URL.
        - `rule: string`: The matched rule.
- `clearStatistics(): void`: Clear statistics.
- `clearRules(): void`: Clear all imported rules.
- `getStatistics(): object`: Get statistics.
- `addEventListener("statisticschange", callback: function): void`: Add an event listener for statistics change.
    - The `callback` function will receive an `CustomEvent` / `Event` object based on whether the platform supports it.
    - If platform supports `CustomEvent`, the `detail` property of the event object will contain the incremental statistics.
- `removeEventListener("statisticschange", callback: function): void`: Remove an event listener for statistics change.

#### Instance Properties

You can change these properties after instantiation, and they will take effect for the next call to `purify`.

- `fetchEnabled: Boolean`: Whether the redirect mode is enabled.
- `lambdaEnabled: Boolean`: Whether the lambda mode is enabled.
- `maxIterations: Number`: Maximum number of iterations.

#### Static Properties

- `Purlfy.version: string`: The version of pURLfy.

## 📖 Rules

Community-contributed rules files are hosted on GitHub, and you can find them at [pURLfy-rules](https://github.com/PRO-2684/pURLfy-rules). The format of the rules files is as follows:

```jsonc
{
    "<domain>": {
        "<path>": {
            // A single rule
            "description": "<规则描述>",
            "mode": "<模式>",
            // Other parameters
            "author": "<作者>"
        },
        // ...
    },
    // ...
}
```

### ✅ Path Matching

`<domain>`, `<path>`: The domain and a part of path, such as `example.com/`, `/^.+\.example\.com$`, `path/` and `page`. Here's an explanation of them:

- The basic behavior is like paths on Unix file systems.
    - If not ending with `/`, its value will be treated as a [rule](#-a-single-rule).
    - If ending with `/`, there's more paths under it, like "folders" (theoretically, you can nest infinitely)
    - `/` is not allowed in the *middle* of `<domain>` or `<path>`.
- Note that if it starts with `/`, it will be treated as a RegExp pattern.
    - For example, `/^.+\.example\.com$` will match all subdomains of `example.com`, and `/^\d+$` will match a part of path that contains only digits.
    - Do remember to escape `\`, `.` etc in JSON strings.
    - Using RegExp is not recommended unless necessary, since it will slow down the matching process.
- If it's an empty string `""`, it will be treated as a **FallBack** rule: this rule will be used when no other rules are matched at this level.
- If there's multiple rules matched, the **best matched rule** will be used. (Exact match > RegExp match > FallBack rule)
- If you want a rule to match all paths under a domain, you can omit `<path>`, but remember to remove the `/` after the domain.

A simple example with comments showing the URLs that can be matched:

```jsonc
{
    "example.com/": {
        "a": {
            // The rule here will match "example.com/a"
        },
        "path/": {
            "to/": {
                "page": {
                    // The rule here will match "example.com/path/to/page"
                },
                "/^\\d+$": { // Remember to escape `\`
                    // The rule here will match all paths under "example.com/path/to/" that are composed of digits
                },
                "": {
                    // The rule here will match "example.com/path/to", excluding "page" and digits under it
                }
            },
            "": {
                // The rule here will match "example.com/path", excluding "to" under it
            }
        },
        "": {
            // The rule here will match "example.com", excluding "path" under it
        }
    },
    "example.org": {
        // The rule here will match every path under "example.org"
    },
    "": {
        // Fallback: this rule will be used for all paths that are not matched
    }
}
```

Here's an **erroneous example**:

```jsonc
{
    "example.com/": {
        "path/": { // Path ending with `/` will be treated as a "directory", thus you should remove the trailing `/`
            // Attempting to match "example.com/path"
        }
    },
    "example.org": { // Path not ending with `/` will be treated as a rule, thus you should add a trailing `/`
        "page": {
            // Attempting to match "example.org/page"
        }
    },
    "example.net/": {
        "path/to/page": { // Can't contain `/` in the middle - you should nest them
            // Attempting to match "example.net/path/to/page"
        },
        "/^\d+$": { // `\d` won't parse correctly in JSON strings, so use `\\d` instead
            // Attempting to match all paths under "example.net/" that are composed of digits
        }
    }
}
```

### 📃 A Single Rule

Paths not ending with `/` will be treated as a single rule, and there's multiple modes for a rule. The common parameters are as follows:

```jsonc
{
    "description": "<Rule Description>",
    "mode": "<Mode>",
    // Mode-specific parameters
    "author": "<Author>"
}
```

This table shows supported parameters for each mode:

| Param\Mode | `white` | `black` | `param` | `regex` | `redirect` | `visit` | `lambda` |
| ---------- | -- | --- | -- | --- | -- | --- | -- |
| `std`      | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `params`   | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `acts`     | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `regex`    | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `replace`  | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `ua`       | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `lambda`   | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `continue` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

#### 🟢 Whitelist Mode `white`

| Param | Type | Default |
| --- | --- | --- |
| `params` | `string[]` | Required |
| `std` | `Boolean` | `false` |

Under Whitelist mode, only the parameters specified in `params` will be kept, and others will be removed. `std` is for controlling whether the URL search string shall be deemed standard. Only if it is `true` or the URL search string is indeed standard will the URL be processed. Usually this is the most commonly used mode.

#### 🔴 Blacklist Mode `black`

| Param | Type | Default |
| --- | --- | --- |
| `params` | `string[]` | Required |
| `std` | `Boolean` | `false` |

Under Blacklist mode, the parameters specified in `params` will be removed, and others will be kept. `std` is for controlling whether the URL search string shall be deemed standard. Only if it is `true` or the URL search string is indeed standard will the URL be processed.

#### 🟤 Specific Parameter Mode `param`

| Param | Type | Default |
| --- | --- | --- |
| `params` | `string[]` | Required |
| `acts`   | `string[]` | `["url"]` |
| `continue` | `Boolean` | `true` |

Under Specific Parameter mode, pURLfy will:

1. Attempt to extract the parameters specified in `params` in order, until the first existing parameter is matched.
2. Decode the parameter value using the [processors](#-processors) specified in the `acts` array in order (if any `acts` value is invalid or throws an error, it is considered a failure and the original URL is returned).
3. Use the final result as the new URL.
4. If `continue` is not set to `false`, purify the new URL again.

#### 🟣 Regex Mode `regex`

| Param | Type | Default |
| --- | --- | --- |
| `regex` | `string[]` | Required |
| `replace` | `string[]` | Required |
| `continue` | `Boolean` | `true` |

Under Regex mode, pURLfy will, for each `regex`-`replace` pair:

1. Match the RegExp pattern specified in `regex` against the URL.
2. Replace all matched parts with the "replacement string" specified in `replace`.

If you'd like to learn more about the syntax of the "replacement string", please refer to the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement).

#### 🟡 Redirect Mode `redirect`

> [!CAUTION]
> For compatibility reasons, the `redirect` mode is disabled by default. Refer to the [API documentation](#-API) for enabling it.

| Param | Type | Default |
| --- | --- | --- |
| `ua` | `string` | `undefined` |
| `continue` | `Boolean` | `true` |

Under Redirect mode, pURLfy will call constructor parameter `fetch` to get the redirected URL, by firing a `HEAD` request using `ua` to the matched URL and return the `Location` header or the updated `response.url`. If `continue` is not set to `false`, the new URL will be purified again.

#### 🟠 Visit Mode `visit`

> [!CAUTION]
> For compatibility reasons, the `redirect` mode is disabled by default. Refer to the [API documentation](#-API) for enabling it.

| Param | Type | Default |
| --- | --- | --- |
| `ua` | `string` | `undefined` |
| `acts` | `string[]` | `["regex:<url_pattern>"]` |
| `continue` | `Boolean` | `true` |

Under Visit mode, pURLfy will visit the URL with `ua`, and if the URL has not beed redirected, it will call the [processors](#-processors) specified in `acts` in order (`<url_pattern>` is `https?:\/\/.(?:www\.)?[-a-zA-Z0-9@%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?!&\/\/=]*)`). The initial input to `acts` is of type `string`, i.e. the text returned by visiting the URL. If the URL has been redirected, the redirected URL will be returned. If `continue` is not set to `false`, the new URL will be purified again.

#### 🔵 Lambda Mode `lambda`

> [!CAUTION]
> For security reasons, the `lambda` mode is disabled by default. If you **trust the rules provider**, refer to the [API documentation](#-API) for enabling it.

| Param | Type | Default |
| --- | --- | --- |
| `lambda` | `string` | Required |
| `continue` | `Boolean` | `true` |

Under Lambda mode, pURLfy will try to execute the lambda function specified in `lambda` and use the result as the new URL. The function shall be async, and its body should accept a single `URL` parameter `url` and return a new `URL` object. For example:

```jsonc
{
    "example.com": {
        "description": "示例",
        "mode": "lambda",
        "lambda": "url.searchParams.delete('key'); return url;",
        "continue": false,
        "author": "PRO-2684"
    },
    // ...
}
```

If URL `https://example.com/?key=123` matches this rule, the `key` parameter will be deleted. After this operation, since `continue` is set to `false`, the URL returned by the function will not be purified again. Of course, this is not a good example, because this can be achieved by using [Blacklist mode](#-blacklist-mode-black).

### 🖇️ Processors

Some processors support parameters, simply append them to the function name separated by a colon (`:`): `func:arg1:arg2...:argn`. The following processors are currently supported:

- `url`: `string->string`, URL decoding (`decodeURIComponent`)
- `base64`: `string->string`, Base64 decoding (`decodeURIComponent(escape(atob(s.replaceAll('_', '/').replaceAll('-', '+'))))`)
- `slice:start:end`: `string->string`, String slicing (`s.slice(start, end)`), `start` and `end` will be converted to integers
- `regex:<regex>`: `string->string`, regex matching, returns the first match of the regex or an empty string if no match is found
- `dom`: `string->Document`, parse the string as a HTML `Document` object
- `sel:<selector>`: `Any->Element/null`, select the first element using CSS selector `<selector>` (The input shall have `querySelector` method)
- `attr:<attribute>`: `Element->string`, get the value of the attribute `<attribute>` of the element (`getAttribute`)
- `text`: `Element->string`, get the text content of the element (`textContent`)

## 😎 Projects Using pURLfy

> [!TIP]
> If you are using pURLfy in your project, feel free to submit a PR to add your project here!

- Our [Demo Page](https://pro-2684.github.io/?page=purlfy)
- Our Telegram Bot [@purlfy_bot](https://t.me/purlfy_bot) ([Source code](https://github.com/PRO-2684/Telegram-pURLfy))
- [pURLfy for Tampermonkey](https://greasyfork.org/scripts/492480)
- [LiteLoaderQQNT-pURLfy](https://github.com/PRO-2684/LiteLoaderQQNT-pURLfy)

## 🎉 Acknowledgments

- Thanks to [Tarnhelm](https://tarnhelm.project.ac.cn/) for providing some rules and for the initial inspiration of pURLfy.
- Thanks to [this script](https://greasyfork.org/scripts/412612) on GreasyFork for providing some rules for pURLfy.
- Thanks to [SearXNG](https://github.com/searxng/searxng/blob/f1a148f53e9fbd10e95baa442b40327732259f25/searx/engines/bing.py#L148) for providing Bing's purification rule.
- The logo of pURLfy is a combination of the ["Incognito" icon](https://www.svgrepo.com/svg/527757/incognito) and the ["Ghost" icon](https://www.svgrepo.com/svg/508069/ghost) from [SVG Repo](https://www.svgrepo.com/).
