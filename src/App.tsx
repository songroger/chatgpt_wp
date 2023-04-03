import './App.css'
import css from './App.module.css'
import Chat, {
  Bubble,
  MessageProps,
  Progress,
  toast,
  useMessages,
  Popup,
  Card,
  CardTitle,
  CardText,
  Image,
  Input,
  Search,
  ToolbarItemProps,
  Divider,
  Icon,
} from '@chatui/core'
import '@chatui/core/dist/index.css'
import '@chatui/core/es/styles/index.less'

import { useRef, useState } from 'react'
import './chatui-theme.css'
import axios from 'axios'
import clipboardy from 'clipboardy'
import MdEditor from "md-editor-rt"
import "md-editor-rt/lib/style.css"
import sanitizeHtml from 'sanitize-html';


const defaultQuickReplies = [
  // {
  //   type: 'refresh',
  //   icon: 'refresh',
  //   name: '清空',
  //   isNew: true,
  //   isHighlight: true,
  // },
  // {
  //   type: 'copy',
  //   icon: 'copy',
  //   name: '复制',
  //   isNew: false,
  //   isHighlight: true,
  // },
  {
    icon: 'cancel',
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

const toolbar = [
  {
    type: 'refresh',
    icon: 'refresh',
    title: '清空',
  },
  {
    type: 'copy',
    icon: 'copy',
    title: '复制',
  },
  // {
  //   // type: 'orderSelector',
  //   icon: 'cancel',
  //   title: '取消',
  // }
]

const initialMessages = [
  {
    type: 'text',
    content: {
      text: '您好，我是AI助理',
    },
    user: { avatar: '/gpt.png' },
  },
  {
    type: 'card',
  },
]

let chatContext: any[] = []

function App() {
  const { messages, appendMsg, setTyping, prependMsgs } = useMessages(initialMessages)
  const [percentage, setPercentage] = useState(0)
  const [open, setOpen] = useState(false)
  const source = axios.CancelToken.source()
  // const inputRef = useRef(null)

  const handleFocus = () => {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)

    }, 10)
  }
 
  const handleOrderChange = () => {
      // console.log(inputRef.current.value)
  }

  const handleOrderSend = () => {
      // console.log(inputRef.current.value)
      // queryMyKey(inputRef.current.value)
  }

  async function handleToolbarClick(item: ToolbarItemProps) {
      if (item.type === 'refresh') {
        chatContext.splice(0)
        messages.splice(0)
        prependMsgs(messages)
      }
      if (item.type === 'copy') {
        if (messages.length <= 1) {
            toast.show('无可用复制', "loading", 2_000)
            return
          }
        const r = messages
          .slice(1)
          .filter((it) => it.type === 'text')
          .map((it) => it.content.text)
          .join('\n')
        // console.log('messages', messages, r)
        await clipboardy.write(r)
        toast.show('复制成功', "loading", 3_000)
      }
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

  // openMenu
  function handleOpen() {
    setOpen(true);
    console.log("open menu")
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSend(type: string, val: string) {
    if (percentage > 0) {
      toast.show('等待回复,请稍后', "loading", 3_000)
      return
    }
    if (type === 'text' && val.trim()) {
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'right',
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
      case 'card':
        return (
            <Card>
              <CardTitle title="">
                <h5><Icon type="compass" /> Notes:</h5>
              </CardTitle>
              <CardText children="1.Remembers what user said earlier in the conversation;" />
              <CardText children="2.Allows user to provide follow-up corrections. Trained to decline inappropriate requests;" />
              <CardText children="3.May occasionally generate incorrect information, produce harmful instructions or biased content." />
            </Card>
            )
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

  function queryMyKey(orderId: string) {

    let url = 'mykey'

    axios
      .post(url, {
        orderId: orderId,
      })
      .then((response) => {
        let res = response.data.data.key
        console.log(res)
      })
      .catch((err) => {
        // 错误处理
        if (axios.isCancel(err)) {
          // 请求被取消时的处理
          console.log('请求被取消：', err.message);
        } else {
          toast.fail('请求出错，' + err.response.data.errorMsg)
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
          leftContent: {
              icon: 'ellipsis-h',
              title: '',
              onClick: handleOpen
          },
          // rightContent: [
          //     // {
          //     //   icon: 'apps',
          //     //   title: 'Applications',
          //     // },
          //     {
          //       icon: 'ellipsis-h',
          //       title: '',
          //     },
          //   ],
          title: 'ChatGPT',
        }}
        toolbar={toolbar}
        onToolbarClick={handleToolbarClick}
        messages={messages}
        renderMessageContent={renderMessageContent}
        quickReplies={defaultQuickReplies}
        onQuickReplyClick={handleQuickReplyClick}
        onSend={handleSend}
        onInputFocus={handleFocus}
        placeholder="Ask anything you like..."
      />
      <Progress value={percentage} />
      <Popup
        active={open}
        title="使用说明"
        onClose={handleClose}
      >
        <div style={{padding:'0px 15px'}}>
          <Card>
            <CardText children="1.每天可免费使用10次,独立key按所有权限使用;" />
            <CardText children="2.如何获取独立key? 打赏作者：每1元获得100次;" />
            <CardText children="3.如何打赏? 按如下微信二维码支付, 根据支付单号查询你的专属key;" />
            <CardText children="4.打赏完之后, 获取key可能会有延迟, 如有紧急问题可直接微信联系." />
          </Card>
          <Divider>独立key查询</Divider>
          <Search
            placeholder="请输入支付单号"
            onSearch={(q) => {
              queryMyKey(q);
            }}
            onClear={() => {
              console.log('cancel');
            }}
          />
          <h4>打赏码:</h4>
          <Image src="//img.alicdn.com/tfs/TB1e9m8p5_1gK0jSZFqXXcpaXXa-1024-683.jpg" alt="Responsive image" fluid />
          <h4>联系作者:</h4>
          <Image src="//img.alicdn.com/tfs/TB1e9m8p5_1gK0jSZFqXXcpaXXa-1024-683.jpg" alt="Responsive image" fluid />
        </div>
      </Popup>
    </div>
  )
}

export default App
