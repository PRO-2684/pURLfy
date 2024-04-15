# pURLfy

English | [简体中文](./README_zh.md)

The ultimate URL purifier.

> [!NOTE]
> Do you know that the name "pURLfy" is a combination of "purify" and "URL"? It can be pronounced as `pjuɑrelfaɪ`.

## 🪄 Functionalities

Purify URL: Remove redundant tracking parameters, skip redirecting pages, and extract the link that really matters.

- ⚡ Fast: Purify URLs quickly and efficiently. (Time complexity is $O(n)$, where $n$ is the count of `/` in the URL path.)
- 🪶 Lightweight: Zero-dependency; Minified script less than 3kb.
- 📃 Rule-based: Perform purification based on rules, making it more flexible.
- 🔄️ Async: Calling `purify` won't block your thread.
- 🔁 Iterative purification: If the URL still contains tracking parameters after a single purification (e.g. URLs returned by `redirect` rules), it will continue to be purified.
- 📊 Statistics: You can track statistics of the purification process, including the number of links purified, the number of parameters removed, the number of URLs decoded, the number of URLs redirected, and the number of characters deleted, etc.

## 🤔 Usage

### 😎 Projects Using pURLfy

> [!TIP]
> If you are using pURLfy in your project, feel free to submit a PR to add your project here!

- Our [Demo Page](https://pro-2684.github.io/?page=purlfy)
- Our Telegram Bot [@purlfy_bot](https://t.me/purlfy_bot)
- [pURLfy for Tampermonkey](https://greasyfork.org/scripts/492480)
- [LiteLoaderQQNT-pURLfy](https://github.com/PRO-2684/LiteLoaderQQNT-pURLfy)

### 🚀 Quick Start

Visit our [demo page](https://pro-2684.github.io/?page=purlfy), or try it out with our Telegram bot [@purlfy_bot](https://t.me/purlfy_bot)!

```js
// Somewhat import `Purlfy` class from https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy@latest/purlfy.min.js
const purifier = new Purlfy({ // Instantiate a Purlfy object
    redirectEnabled: true,
    lambdaEnabled: true,
});
const rules = await (await fetch("https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy@latest/rules/<country>.json")).json(); // Rules
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
    redirectEnabled: Boolean, // Enable the redirect mode (default: false)
    lambdaEnabled: Boolean, // Enable the lambda mode (default: false)
    maxIterations: Number, // Maximum number of iterations (default: 5)
    statistics: { // Initial statistics
        url: Number, // Number of links purified
        param: Number, // Number of parameters removed
        decoded: Number, // Number of URLs decoded (`param` mode)
        redirected: Number, // Number of URLs redirected (`redirect` mode)
        char: Number, // Number of characters deleted
    },
    log: Function, // Log function (default: `console.log.bind(console, "\x1b[38;2;220;20;60m[pURLfy]\x1b[0m")`)
})
```

#### Methods

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

#### Properties

You can change these properties after instantiation, and they will take effect for the next call to `purify`.

- `redirectEnabled: Boolean`: Whether the redirect mode is enabled.
- `lambdaEnabled: Boolean`: Whether the lambda mode is enabled.
- `maxIterations: Number`: Maximum number of iterations.

## 📖 Rules

The format of the rules `rules` is as follows:

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

`<domain>`, `<path>`: The domain and a part of path, such as `example.com/`, `path/` and `page` (Note that the leading `/` is removed). Here's an explanation of them:

- The basic behavior is like paths on Unix file systems.
    - If not ending with `/`, its value will be treated as a [rule](#-a-single-rule).
    - If ending with `/`, there's more paths under it, like "folders" (theoretically, you can nest infinitely)
    - `/` is not allowed in the *middle* of `<domain>` or `<path>`.
- If it's an empty string `""`, it will be treated as a **FallBack** rule: this rule will be used when no other rules are matched at this level.
- If there's multiple rules matched, the rule with the **longest matched** path will be used.
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
                "": {
                    // The rule here will match "example.com/path/to", excluding "page" under it
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

| Param\Mode | `white` | `black` | `param` | ~~`regex`~~ | `redirect` | `lambda` |
| --- | --- | --- | --- | --- | --- | --- |
| `params` | ✅ | ✅ | ✅ | ❓ | ❌ | ❌ |
| `decode` | ❌ | ❌ | ✅ | ❓ | ❌ | ❌ |
| `lambda` | ❌ | ❌ | ❌ | ❓ | ❌ | ✅ |
| `continue` | ❌ | ❌ | ✅ | ❓ | ✅ | ✅ |

#### 🟢 Whitelist Mode `white`

| Param | Type | Default |
| --- | --- | --- |
| `params` | `string[]` | Required |

Under Whitelist mode, only the parameters specified in `params` will be kept, and others will be removed. Usually this is the most commonly used mode.

#### 🟠 Blacklist Mode `black`

| Param | Type | Default |
| --- | --- | --- |
| `params` | `string[]` | Required |

Under Blacklist mode, the parameters specified in `params` will be removed, and others will be kept.

#### 🟤 Specific Parameter Mode `param`

| Param | Type | Default |
| --- | --- | --- |
| `params` | `string[]` | Required |
| `decode` | `string[]` | `["url"]` |
| `continue` | `Boolean` | `true` |

Under Specific Parameter mode, pURLfy will:

1. Attempt to extract the parameters specified in `params` in order, until the first existing parameter is matched.
2. Decode the parameter value using the decoding functions specified in the `decode` array in order (if any `decode` value is invalid or throws an error, it is considered a failure and the original URL is returned).
3. Use the final result as the new URL.
4. If `continue` is not set to `false`, purify the new URL again.

Some decoding functions support parameters, simply append them to the function name separated by a colon (`:`): `func:arg1:arg2...:argn`. The following decoding functions are currently supported:

- `url`: URL decoding (`decodeURIComponent`)
- `base64`: Base64 decoding (`decodeURIComponent(escape(atob(s.replaceAll('_', '/').replaceAll('-', '+'))))`)
- `slice:start:end`: String slicing (`s.slice(start, end)`), `start` and `end` will be converted to integers

#### 🟣 Regex Mode `regex`

TODO

#### 🟡 Redirect Mode `redirect`

> [!CAUTION]
> For compatibility reasons, the `redirect` mode is disabled by default. Refer to the [API documentation](#-API) for enabling it.

| Param | Type | Default |
| --- | --- | --- |
| `continue` | `Boolean` | `true` |

Under Redirect mode, pURLfy will:

1. Attempt to fire a `HEAD` request to the matched URL.
2. If the status code is `3xx`, the `Location` header will be used as the new URL.
3. If `continue` is not set to `false`, purify the new URL again.

#### 🔵 Lambda Mode `lambda`

> [!CAUTION]
> For security reasons, the `lambda` mode is disabled by default. Refer to the [API documentation](#-API) for enabling it.

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

## 🎉 Acknowledgments

- Thanks to [Tarnhelm](https://tarnhelm.project.ac.cn/) for providing some rules and for the initial inspiration of pURLfy.
- Thanks to [this script](https://greasyfork.org/scripts/412612) on GreasyFork for providing some rules for pURLfy.
- Thanks to [SearXNG](https://github.com/searxng/searxng/blob/f1a148f53e9fbd10e95baa442b40327732259f25/searx/engines/bing.py#L148) for providing Bing's purification rule.
