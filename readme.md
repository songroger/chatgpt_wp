TODO:

1. 弹窗里面的功能：
    ~~展示码、按单号查询key、~~
    保存key

~~2. 主屏增加些说明性图文~~


#### set up

1. install packages: `pnpm i`

2. run as dev: `pnpm run dev`


#### api

1. chat:

url: /completion   [post req]

payload:

```
{
    "messages": [{
        "role": "user",
        "content": "Ai会替代人类工作吗"
    }]
}
```

return:

```json
{
    "code": 200,
    "data": {
        "messages": [{
            "role": "system",
            "content": "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible."
        }, {
            "role": "user",
            "content": "Ai会替代人类工作吗。"
        }, {
            "role": "assistant",
            "content": "AI可以替代一些人类工作，但不是所有工作都可以被替代。"
        }],
        "reply": "AI可以替代一些人类工作，但不是所有工作都可以被替代。"
    },
    "errorMsg": ""
}
```

2. 查询key:

url: /mykey  [post req]

payload:

```
{"orderId": "56757"}
```

return:

```json
{
    "code": 200,
    "data": {
        "key": "private-key-29EIWIOIUIW"
    },
    "errorMsg": ""
}
```
