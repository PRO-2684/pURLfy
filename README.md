# pURLfy

English | [简体中文](./README_zh.md)

The ultimate URL purifier.

> [!NOTE]
> Do you know that the name "pURLfy" is a combination of "purify" and "URL"? It can be pronounced as `pjuɑrelfaɪ`.

## 🪄 Functionalities

Purify URL: Remove redundant tracking parameters, skip redirecting pages, and extract the link that really matters.

- [x] Rule-based: Perform purification based on rules, making it more flexible.
- [x] Iterative purification: If the URL still contains tracking parameters after a single purification (e.g. URLs returned by `redirect` rules), it will continue to be purified.
- [x] Statistics: You can view statistics of the purification process, including the number of links purified, the number of parameters removed, the number of URLs decoded, the number of URLs redirected, and the number of characters deleted, etc.

## 🤔 Usage

### 🚀 Quick Start

```js
const purifier = new Purlfy({ // Instantiate a Purlfy object
    redirectEnabled: true,
    lambdaEnabled: true,
});
const rules = { // Rules
    "": {
        "description": "Fallback",
        "mode": "black",
        "params": [
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_term",
            "utm_content"
        ],
        "author": "PRO-2684"
    },
    // ...
};
purifier.importRules(rules); // Import rules
purifier.addEventListener("statisticschange", e => { // Add an event listener for statistics change
    console.log("Statistics changed to:", e.detail);
});
purifier.purifyURL("https://example.com/?utm_source=123").then(console.log); // Purify a URL
```

### 📚 API

TODO

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

`<domain>`, `<path>`: The domain and path, such as `example.com/` and `path/to/page` (Note that the leading `/` is removed).

- The basic behavior is like paths on Unix file systems.
    - If not ending with `/`, its value will be treated as a [rule](#-a-single-rule).
    - If ending with `/`, there's more paths under it (theoretically, you can nest infinitely)
- If it's an empty string `""`, it will be treated as a **FallBack** rule: this rule will be used when no other rules are matched at this level.
- If there's multiple rules matched, the rule with the **longest matched** path will be used.
- If you want a rule to match all paths under a domain, you can omit `<path>`, but remember to remove the `/` after the domain.
- You can also combine them as `<domain>/<path>`, but it's not recommended.

A simple example with comments showing the URLs that can be matched:

```jsonc
{
    "example.com/": {
        "a/b/c": {
            // The rule here will match "example.com/a/b/c"
        },
        "path/": {
            "to/": {
                "page": {
                    // The rule here will match "example.com/path/to/page"
                },
                "": {
                    // The rule here will match "example.com/path/to", excluding "page" under it
                }
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
        "path/to/page/": { // Path ending with `/` will be treated as a "directory", thus you should remove the trailing `/`
            // Attempting to match "example.com/path/to/page"
        }
    },
    "example.org": { // Path not ending with `/` will be treated as a rule, thus you should add a trailing `/`
        "path/to/page": {
            // Attempting to match "example.org/path/to/page"
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
2. Decode the parameter value using the decoding functions specified in the `decode` array in order (if the `decode` value is invalid, this decoding function will be skipped).
3. Use the final result as the new URL.
4. If `continue` is not set to `false`, purify the new URL again.

Currently supported `decode` functions are:

- `url`: URL decoding (`decodeURIComponent`)
- `base64`: Base64 decoding (`atob`)

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

Under Lambda mode, pURLfy will try to execute the lambda function specified in `lambda` and use the result as the new URL. The function body should accept a single `URL` parameter `url` and return a new `URL` object. For example:

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
