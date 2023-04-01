import './App.css'
import css from './App.module.css'
import Chat, {
  Bubble,
  MessageProps,
  Progress,
  toast,
  useMessages,
} from '@chatui/core'
import '@chatui/core/dist/index.css'
import '@chatui/core/es/styles/index.less'

import { useState } from 'react'
import './chatui-theme.css'
import axios from 'axios'
import clipboardy from 'clipboardy'
import MdEditor from "md-editor-rt"
import "md-editor-rt/lib/style.css"
import sanitizeHtml from 'sanitize-html';


const defaultQuickReplies = [
  {
    name: '清空',
    isNew: true,
    isHighlight: true,
  },
  {
    name: '复制',
    isNew: false,
    isHighlight: true,
  },
  {
    name: '取消',
    isNew: false,
    isHighlight: true,
  },
  {
    name: 'Ai会替代人类工作吗',
    isNew: false,
    isHighlight: true,
  }
]

const initialMessages = [
  {
    type: 'text',
    content: {
      text: '您好，我是AI助理',
    },
    user: { avatar: '/gpt.png' },
  },
]

let chatContext: any[] = []

function App() {
  const { messages, appendMsg, setTyping, prependMsgs } = useMessages(initialMessages)
  const [percentage, setPercentage] = useState(0)
  const source = axios.CancelToken.source()

  const handleFocus = () => {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)

    }, 10)
  }


  // clearQuestion 清空文本特殊字符
  function clearQuestion(requestText: string) {
    requestText = requestText.replace(/\s/g, '')
    const punctuation = ',.;!?，。！？、…'
    const runeRequestText = requestText.split('')
    const lastChar = runeRequestText[runeRequestText.length - 1]
    if (punctuation.indexOf(lastChar) < 0) {
      requestText = requestText + '。'
    }
    return requestText
  }

  // clearQuestion 清空文本换行符号
  function clearReply(reply: string) {
    // TODO 清洗回复特殊字符
    return reply
  }

  function handleSend(type: string, val: string) {
    if (percentage > 0) {
      toast.show('正在等待上一次回复，请稍后', "loading", 3_000)
      return
    }
    if (type === 'text' && val.trim()) {
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'left',
        user: { avatar: '/user.png' },
      })

      setTyping(true)
      setPercentage(10)
      onGenCode(val)
    }
  }

  function renderMessageContent(msg: MessageProps) {
    const { type, content } = msg

    switch (type) {
      case 'text':
        let text = content.text
        let isHtml = sanitizeHtml(text) !== text;
        if(isHtml){
          return (
              <Bubble><MdEditor
                  style={{float: 'left'}}
                  modelValue = { text } // 要展示的markdown字符串
                  previewOnly = { true } // 只展示预览框部分
              ></MdEditor></Bubble>
          )
        }else{
          return (
              <Bubble>{text}</Bubble>
          )
        }

      default:
        return null
    }
  }

  async function handleQuickReplyClick(item: { name: string }) {
    if (item.name === '清空') {

      chatContext.splice(0)
      messages.splice(0)
      prependMsgs(messages)
    }
    if (item.name === '复制') {
      if (messages.length <= 1) {
        return
      }
      const r = messages
        .slice(1)
        .filter((it) => it.type === 'text')
        .map((it) => it.content.text)
        .join('\n')
      console.log('messages', messages, r)
      await clipboardy.write(r)
      toast.show('复制成功', "loading", 3_000)
    }
    if (item.name === 'Ai会替代人类工作吗') {
      handleSend('text', item.name);
    }
    if (item.name === '取消') {
        setPercentage(0)
        setTyping(false)
        source.cancel('你已取消')
    }
  }

  function onGenCode(question: string) {
    question = clearQuestion(question)
    chatContext.push({
      role: 'user',
      content: question,
    })

    let url = 'completion'

    axios
      .post(url, {
        messages: chatContext,
        cancelToken: source.token
      })
      .then((response) => {
        let reply = clearReply(response.data.data.reply)
        appendMsg({
          type: 'text',
          content: { text: reply },
          user: { avatar: '/gpt.png' },
        })
        chatContext = response.data.data.messages
        console.log(chatContext)
        setPercentage(0)
      })
      .catch((err) => {
        // 错误处理
        if (axios.isCancel(err)) {
          // 请求被取消时的处理
          console.log('请求被取消：', err.message);
        } else {
          toast.fail('请求出错，' + err.response.data.errorMsg)
          setPercentage(0)
          setTyping(false)
        }
      })
  }

  return (
    <div className={css.app}>
      <Chat
        navbar={{
          // leftContent: {
          //   icon: 'chevron-left',
          //   title: 'Back',
          // },
          // rightContent: [
          //   {
          //     icon: 'apps',
          //     title: 'Applications',
          //   },
          //   {
          //     icon: 'ellipsis-h',
          //     title: 'More',
          //   },
          // ],
          title: 'ChatGPT',
        }}
        messages={messages}
        renderMessageContent={renderMessageContent}
        quickReplies={defaultQuickReplies}
        onQuickReplyClick={handleQuickReplyClick}
        onSend={handleSend}
        onInputFocus={handleFocus}
        placeholder="Ask anything you like..."
      />
      <Progress value={percentage} />
    </div>
  )
}

export default App
