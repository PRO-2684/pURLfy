# pURLfy

[English](./README.md) | 简体中文

终极 URL 净化器。

> [!NOTE]
> 你知道 "pURLfy" 这个名字是 "purify" 和 "URL" 的组合吗？它可以发音为 `pjuɑrelfaɪ`。

## 🪄 功能

净化 URL：去除多余的跟踪参数，跳过重定向界面，提取真正重要的链接。

- [x] 基于规则：根据规则净化，更为灵活。
- [x] 迭代式净化：若单次净化后的 URL 仍包含跟踪参数 (例如 `redirect` 规则返回的 URL)，将继续净化。
- [x] 统计数据：您可以查看净化过程中的统计数据，包括净化的链接数量、移除的参数数量、解码的网址数量、重定向的网址数量、删除的字符数量等。

## 🤔 使用

### 🚀 快速开始

```js
const purifier = new Purlfy({ // 实例化一个 Purlfy 对象
    redirectEnabled: true,
    lambdaEnabled: true,
});
const rules = { // 规则
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
purifier.importRules(rules); // 导入规则
purifier.addEventListener("statisticschange", e => { // 添加统计数据变化的事件监听器
    console.log("Statistics changed to:", e.detail);
});
purifier.purifyURL("https://example.com/?utm_source=123").then(console.log); // 净化一个 URL
```

### 📚 API

TODO

## 📖 规则

规则 `rules` 的格式如下:

```jsonc
{
    "<domain>": {
        "<path>": {
            // 单条规则
            "description": "<规则描述>",
            "mode": "<模式>",
            // 其它参数
            "author": "<作者>"
        },
        // ...
    },
    // ...
}
```

### ✅ 路径匹配

`<domain>`, `<path>`: 域名和路径，例如 `example.com/`, `path/to/page` (注意去除开头的 `/`)。

- 基础行为与 Unix 文件系统路径类似
    - 若不以 `/` 结尾，表示其值就是一条 [规则](#-单条规则)
    - 若以 `/` 结尾，表示其下有更多子路径 (理论上可以无限嵌套)
- 若为 `""`，则表示作为 **FallBack** 规则：当此层级没有匹配到其他规则时使用此规则
- 当有多个规则匹配时，会优先使用 **最长匹配** 的规则
- 若想要某条规则匹配域名下所有路径，则可以省略 `<path>`，但是注意别忘了把域名后的 `/` 去除。
- 你也可以将其合并为一个 `<domain>/<path>`，但是不推荐这样做。

一个简单的例子，注释给出了可以匹配的网址:

```jsonc
{
    "example.com/": {
        "a/b/c": {
            // 这里的规则会匹配 "example.com/a/b/c"
        },
        "path/": {
            "to/": {
                "page": {
                    // 这里的规则会匹配 "example.com/path/to/page"
                },
                "": {
                    // 这里的规则会匹配 "example.com/path/to" 除 "page" 以外的所有子路径
                }
            }
        },
        "": {
            // 这里的规则会匹配 "example.com" 除 "path" 以外的所有子路径
        }
    },
    "example.org": {
        // 这里的规则会匹配 "example.org" 的所有路径
    },
    "": {
        // Fallback: 所有未匹配到的路径都会使用这里的规则
    }
}
```

以下是 ***错误示范***:

```jsonc
{
    "example.com/": {
        "path/to/page/": { // 以 `/` 结尾的会被认为下面有子路径，正确做法是移除末尾的 `/`
            // 尝试匹配 "example.com/path/to/page" 的规则
        }
    },
    "example.org": { // 不以 `/` 结尾的会被认为是一条规则，正确做法是末尾加上 `/`
        "path/to/page": {
            // 尝试匹配 "example.org/path/to/page" 的规则
        }
    }
}
```

### 📃 单条规则

不以 `/` 结尾的路径的值就是一条规则，规则有多种模式，通用的格式如下:

```jsonc
{
    "description": "<规则描述>",
    "mode": "<模式>",
    // 与模式相关的参数
    "author": "<作者>"
}
```

下面这张表格展示了每种模式支持的参数:

| 参数\模式 | `white` | `black` | `param` | ~~`regex`~~ | `redirect` | `lambda` |
| --- | --- | --- | --- | --- | --- | --- |
| `params` | ✅ | ✅ | ✅ | ❓ | ❌ | ❌ |
| `decode` | ❌ | ❌ | ✅ | ❓ | ❌ | ❌ |
| `lambda` | ❌ | ❌ | ❌ | ❓ | ❌ | ✅ |
| `continue` | ❌ | ❌ | ✅ | ❓ | ✅ | ✅ |

#### 🟢 白名单模式 `white`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `params` | `string[]` | 必须 |

白名单模式下，只有在 `params` 中指定的查询参数才会被保留，原网址中的其余查询参数会被删除。通常来说这是最常用的模式。

#### 🟠 黑名单模式 `black`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `params` | `string[]` | 必须 |

黑名单模式下，在 `params` 中指定的查询参数将会被删除，原网址中的其余查询参数会被保留。

#### 🟤 特定参数模式 `param`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `params` | `string[]` | 必须 |
| `decode` | `string[]` | `["url"]` |
| `continue` | `Boolean` | `true` |

取特定参数模式下，pURLfy 会:

1. 依次尝试取出 `params` 中指定的参数，直到匹配到第一个存在的参数
2. 使用 `decode` 数组中指定的解码函数依次对参数值进行解码 (若 `decode` 值无效，则跳过这个解码函数)
3. 将最终的结果作为新的 URL
4. 若 `continue` 未被设置为 `false`，则再次净化新的 URL

`decode` 目前支持如下值:

- `url`: 解码 URL 编码 (`decodeURIComponent`)
- `base64`: 解码 Base64 编码 (`atob`)

#### 🟣 正则模式 `regex`

TODO

#### 🟡 重定向模式 `redirect`

> [!CAUTION]
> 出于兼容性考虑，此模式默认禁用。若您想要启用此模式并且 **执行环境支持跨域**，请参照 [API 文档](#-API) 开启此模式。

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `continue` | `Boolean` | `true` |

重定向模式下，pURLfy 会:

1. 向匹配到的网址发起 `HEAD` 请求
2. 若返回的状态码为 `3xx`，则会将头部信息中的 `Location` 作为新的 URL
3. 若 `continue` 未被设置为 `false`，则再次净化新的 URL

#### 🔵 匿名函数模式 `lambda`

> [!CAUTION]
> 出于安全考虑，此模式默认禁用。若您想要启用此模式并且 **信任规则来源**，请参照 [API 文档](#-API) 开启此模式。

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `lambda` | `string` | 必须 |
| `continue` | `Boolean` | `true` |

匿名函数模式下，pURLfy 会尝试执行 `lambda` 字段中指定的函数体，并将其返回值作为新的 URL。此函数体应接受一个类型为 `URL` 的参数 `url`，并返回一个新的 `URL` 对象。例如如下规则：

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

那么如果 URL `https://example.com/?key=123` 匹配到了此规则，则会删除 `key` 参数。在此操作后，因为 `continue` 被设置为 `false`，函数返回的 URL 不会被再次执行净化。当然，这并非一个很好的例子，因为这完全可以通过 [黑名单模式](#-黑名单模式-black) 来实现。
