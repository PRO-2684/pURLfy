# pURLfy

[English](./README.md) | 简体中文

终极 URL 净化器。

> [!NOTE]
> 你知道 "pURLfy" 这个名字是 "purify" 和 "URL" 的组合吗？它可以发音为 `pjuɑrelfaɪ`。

## 🪄 功能

净化 URL：去除多余的跟踪参数，跳过重定向界面，提取真正重要的链接。

- ⚡ 快速：快速高效地净化 URL。 (时间复杂度为 $O(n)$，其中 $n$ 是 URL 路径中 `/` 的数量)
- 🪶 轻量：零依赖；最小化脚本不到 3kb。
- 📃 基于规则：根据规则净化，更为灵活。
- 🔄️ 异步：调用 `purify` 不会阻塞您的线程。
- 🔁 迭代式净化：若单次净化后的 URL 仍包含跟踪参数 (例如 `redirect` 规则返回的 URL)，将继续净化。
- 📊 统计数据：您可以跟踪净化过程中的统计数据，包括净化的链接数量、移除的参数数量、解码的网址数量、重定向的网址数量、删除的字符数量等。

## 🤔 使用

### 😎 使用 pURLfy 的项目

> [!TIP]
> 若您的项目使用了 pURLfy，欢迎提交 PR 将您的项目添加到这里！

- 我们的 [示例页面](https://pro-2684.github.io/?page=purlfy)
- 我们的 Telegram 机器人 [@purlfy_bot](https://t.me/purlfy_bot)
- [pURLfy for Tampermonkey](https://greasyfork.org/scripts/492480)
- [LiteLoaderQQNT-pURLfy](https://github.com/PRO-2684/LiteLoaderQQNT-pURLfy)

### 🚀 快速开始

访问我们的 [示例页面](https://pro-2684.github.io/?page=purlfy)，或者通过我们的 Telegram 机器人 [@purlfy_bot](https://t.me/purlfy_bot) 来体验！

```js
// 通过某种方式从 https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy@latest/purlfy.min.js 导入 `Purlfy` 类
const purifier = new Purlfy({ // 实例化一个 Purlfy 对象
    redirectEnabled: true,
    lambdaEnabled: true,
});
const rules = await (await fetch("https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy@latest/rules/<country>.json")).json(); // 规则
// 你也可以使用 GitHub raw 链接来获取真正的最新规则: https://raw.githubusercontent.com/PRO-2684/pURLfy/main/rules/<country>.json
const additionalRules = {}; // 你也可以添加自己的规则
purifier.importRules(additionalRules);
purifier.importRules(rules); // 导入规则
purifier.addEventListener("statisticschange", e => { // 添加统计数据变化的事件监听器
    console.log("Statistics increment:", e.detail); // 只有在支持 `CustomEvent` 的环境下才能使用
    console.log("Current statistics:", purifier.getStatistics());
});
purifier.purify("https://example.com/?utm_source=123").then(console.log); // 净化一个 URL
```

以下是一些测试链接，你可以尝试使用 pURLfy 净化它们:

- 哔哩哔哩的短链: `https://b23.tv/SI6OEcv`
- 中规中矩的贴吧分享链接: `https://tieba.baidu.com/p/7989575070?share=none&fr=none&see_lz=none&share_from=none&sfc=none&client_type=none&client_version=none&st=none&is_video=none&unique=none`
- MC 百科外链: `https://link.mcmod.cn/target/aHR0cHM6Ly9naXRodWIuY29tL3dheTJtdWNobm9pc2UvQmV0dGVyQWR2YW5jZW1lbnRz`
- 必应的搜索结果: `https://www.bing.com/ck/a?!&&p=de70ef254652193fJmltdHM9MTcxMjYyMDgwMCZpZ3VpZD0wMzhlNjdlMy1mN2I2LTZmMDktMGE3YS03M2JlZjZhMzZlOGMmaW5zaWQ9NTA2Nw&ptn=3&ver=2&hsh=3&fclid=038e67e3-f7b6-6f09-0a7a-73bef6a36e8c&psq=anti&u=a1aHR0cHM6Ly9nby5taWNyb3NvZnQuY29tL2Z3bGluay8_bGlua2lkPTg2ODkyMg&ntb=1`
- 套娃 N 次后甚至无法正常访问的外链: `https://www.minecraftforum.net/linkout?remoteUrl=https%3A%2F%2Fwww.urlshare.cn%2Fumirror_url_check%3Furl%3Dhttps%253A%252F%252Fc.pc.qq.com%252Fmiddlem.html%253Fpfurl%253Dhttps%25253A%25252F%25252Fgithub.com%25252Fjiashuaizhang%25252Frpc-encrypt%25253Futm_source%25253Dtest`

### 📚 API

#### 构造函数

```js
new Purlfy({
    redirectEnabled: Boolean, // 是否启用重定向模式 (默认: false)
    lambdaEnabled: Boolean, // 是否启用匿名函数模式 (默认: false)
    maxIterations: Number, // 最大迭代次数 (默认: 5)
    statistics: { // 初始统计数据
        url: Number, // 净化的网址数量
        param: Number, // 移除的参数数量
        decoded: Number, // 解码的网址数量 (`param` 模式)
        redirected: Number, // 重定向的网址数量 (`redirect` 模式)
        char: Number, // 移除的字符数量
    },
    log: Function, // 日志函数 (默认通过 `console.log` 输出)
    getRedirectedUrl: async Function, // 获取重定向后的 URL 的函数 (默认使用 `fetch` 发送 `HEAD` 请求，详见 [重定向模式](#-重定向模式-redirect))
})
```

#### 方法

- `importRules(rules: object): void`: 导入规则
- `purify(url: string): Promise<object>`: 净化一个 URL
    - `url`: 要净化的 URL
    - 返回值: `Promise`，解析为一个对象，包含:
        - `url: string`: 净化后的 URL
        - `rule: string`: 匹配到的规则
- `clearStatistics(): void`: 清空统计数据
- `clearRules(): void`: 清空所有已导入的规则
- `getStatistics(): object`: 获取统计数据
- `addEventListener("statisticschange", callback: function): void`: 添加统计数据变化的事件监听器
    - 根据平台是否支持，`callback` 函数会接收一个 `CustomEvent` / `Event` 对象
    - 若支持 `CustomEvent`，则其 `detail` 属性为统计数据的增量
- `removeEventListener("statisticschange", callback: function): void`: 移除统计数据变化的事件监听器

#### 属性

你可以在初始化后更改下面的属性，它们将在下次调用 `purify` 时生效。

- `redirectEnabled: Boolean`: 是否启用重定向模式
- `lambdaEnabled: Boolean`: 是否启用匿名函数模式
- `maxIterations: Number`: 最大迭代次数

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

`<domain>`, `<path>`: 域名和一部分路径，例如 `example.com/`, `/^.+\.example\.com$`, `path/` 和 `page`。以下是对它们的解释:

- 基础行为与 Unix 文件系统路径类似
    - 若不以 `/` 结尾，表示其值就是一条 [规则](#-单条规则)
    - 若以 `/` 结尾，表示其下有更多子路径，可以与“文件夹”类比 (理论上可以无限嵌套)
    - `<domain>`, `<path>` *中间* 不可以含有 `/`
- 若以 `/` 开头，将会被认为是正则表达式。
    - 例如 `/^.+\.example\.com$` 可以匹配 `example.com` 的所有子域名，`/^\d+$` 可以匹配一段只包含数字的路径
    - 请别忘记在 JSON 中转义特殊字符，例如 `\`, `.` 等
    - 除非必要，不建议使用正则表达式，因为它会使匹配速度变慢
- 若为 `""`，则表示作为 **FallBack** 规则：当此层级没有匹配到其他规则时使用此规则
- 当有多个规则匹配时，会优先使用 **最佳匹配** 的规则 (精准匹配 > 正则匹配 > FallBack)
- 若想要某条规则匹配域名下所有路径，则可以省略 `<path>`，但是注意别忘了把域名后的 `/` 去除。

一个简单的例子，注释给出了可以匹配的网址:

```jsonc
{
    "example.com/": {
        "a": {
            // 这里的规则会匹配 "example.com/a"
        },
        "path/": {
            "to/": {
                "page": {
                    // 这里的规则会匹配 "example.com/path/to/page"
                },
                "/^\\d+$": { // 注意转义 `\`
                    // 这里的规则会匹配 "example.com/path/to/" 下的所有由数字组成的路径
                },
                "": {
                    // 这里的规则会匹配 "example.com/path/to" 除 "page" 和数字路径以外的所有子路径
                }
            },
            "": {
                // 这里的规则会匹配 "example.com/path" 除 "to" 以外的所有子路径
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
        "path/": { // 以 `/` 结尾的会被认为下面有子路径，正确做法是移除末尾的 `/`
            // 尝试匹配 "example.com/path" 的规则
        }
    },
    "example.org": { // 不以 `/` 结尾的会被认为是一条规则，正确做法是末尾加上 `/`
        "page": {
            // 尝试匹配 "example.org/page" 的规则
        }
    },
    "example.net/": {
        "path/to/page": { // 中间不可以含有 `/`，正确做法是嵌套
            // 尝试匹配 "example.net/path/to/page" 的规则
        },
        "/^\d+$": { // 在 JSON 中 `\d` 无法被正确解析，正确做法是使用 `\\d`
            // 尝试匹配 "example.net" 下所有由数字组成的路径
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

| 参数\模式 | `white` | `black` | `param` | `regex` | `redirect` | `lambda` |
| ---------- | -- | --- | -- | --- | -- | --- |
| `params`   | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `decode`   | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `regex`    | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `replace`  | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `lambda`   | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `continue` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

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
2. 使用 `decode` 数组中指定的解码函数依次对参数值进行解码 (若任一 `decode` 值无效或执行出错，则认定失败，返回原 URL)
3. 将最终的结果作为新的 URL
4. 若 `continue` 未被设置为 `false`，则再次净化新的 URL

部分解码函数支持传入参数，只需用 `:` 分隔即可：`func:arg1:arg2...:argn`。目前支持的解码函数如下:

- `url`: URL 解码 (`decodeURIComponent`)
- `base64`: Base64 解码 (`decodeURIComponent(escape(atob(s.replaceAll('_', '/').replaceAll('-', '+'))))`)
- `slice:start:end`: 截取字符串 (`s.slice(start, end)`)，`start` 和 `end` 会被转换为整数

#### 🟣 正则模式 `regex`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `regex` | `string[]` | 必须 |
| `replace` | `string[]` | 必须 |
| `continue` | `Boolean` | `true` |

正则模式下，pURLfy 会对每一 `regex`-`replace` 对进行:

1. 在 URL 中匹配 `regex` 中指定的正则表达式
2. 替换所有匹配到的部分为 `replace` 中指定的“替换字符串”

若您想要了解“替换字符串”的语法，请参考 [MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/replace#%E6%8C%87%E5%AE%9A%E5%AD%97%E7%AC%A6%E4%B8%B2%E4%BD%9C%E4%B8%BA%E6%9B%BF%E6%8D%A2%E9%A1%B9)。

#### 🟡 重定向模式 `redirect`

> [!CAUTION]
> 出于兼容性考虑，此模式默认禁用。请参照 [API 文档](#-API) 开启此模式。

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `continue` | `Boolean` | `true` |

重定向模式下，pURLfy 会调用传入参数 `getRedirectedUrl` 来获取重定向后的 URL。`getRedirectedUrl` 应为一个异步函数，接受一个类型为 `string` 的参数 `url`，并返回一个新的 `string` 类型的 URL 作为重定向后的 URL。默认情况下，pURLfy 会使用 `fetch` 发送 `HEAD` 请求来获取重定向后的 URL。若 `continue` 未被设置为 `false`，则再次净化新的 URL。

#### 🔵 匿名函数模式 `lambda`

> [!CAUTION]
> 出于安全考虑，此模式默认禁用。若您 **信任规则来源**，请参照 [API 文档](#-API) 开启此模式。

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `lambda` | `string` | 必须 |
| `continue` | `Boolean` | `true` |

匿名函数模式下，pURLfy 会尝试执行 `lambda` 字段中指定的函数体，并将其返回值作为新的 URL。此函数是异步的，其函数体应接受一个类型为 `URL` 的参数 `url`，并返回一个新的 `URL` 对象。例如如下规则：

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

## 🎉 鸣谢

- 感谢 [Tarnhelm](https://tarnhelm.project.ac.cn/) 提供的规则文件以及为 pURLfy 提供最初的灵感。
- 感谢 GreasyFork 上的 [这个脚本](https://greasyfork.org/scripts/412612)，为 pURLfy 提供了一些规则。
- 感谢 [SearXNG](https://github.com/searxng/searxng/blob/f1a148f53e9fbd10e95baa442b40327732259f25/searx/engines/bing.py#L148) 提供的 Bing 的净化规则。
