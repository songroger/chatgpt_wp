#### set up

1. install packages: `pnpm i`

2. run as dev: `pnpm run dev`


#### api

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