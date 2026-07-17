import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowUpIcon,
  ChatIcon,
  CloseIcon,
  LeafIcon,
  MailIcon,
  PackageIcon,
  PhoneIcon,
  RefreshIcon,
  TruckIcon,
  WhatsAppIcon,
} from '../icons'
import { ROUTES } from '../../config'
import { useShop } from '../../context/ShopContext'

const PHONE_TEL = '+919690421423'
const PHONE_WA = '919690421423'
const EMAIL = 'care@pahadlink.com'

const TOPICS = [
  {
    id: 'order',
    label: 'Track order',
    Icon: PackageIcon,
    reply:
      'Check My Orders after login, or send your order ID on WhatsApp. We reply within 1 day.',
  },
  {
    id: 'shipping',
    label: 'Shipping',
    Icon: TruckIcon,
    reply: 'Pan-India delivery in 2-5 days. Free shipping above ₹499.',
  },
  {
    id: 'return',
    label: 'Returns',
    Icon: RefreshIcon,
    reply:
      'Damaged or wrong items can be returned. See Shipping & returns, or message us on WhatsApp.',
  },
  {
    id: 'product',
    label: 'Products',
    Icon: LeafIcon,
    reply:
      'Share the product name - we can help with sizes, ingredients, and storage.',
  },
]

const WELCOME = {
  id: 'welcome',
  from: 'bot',
  text: 'Hi! Pick a topic or type a question. For a live reply, use WhatsApp.',
}

const matchReply = (text) => {
  const q = text.toLowerCase()
  if (/track|order|delivery status/.test(q)) {
    return TOPICS.find((t) => t.id === 'order')
  }
  if (/ship|deliver|free shipping/.test(q)) {
    return TOPICS.find((t) => t.id === 'shipping')
  }
  if (/return|refund|replace/.test(q)) {
    return TOPICS.find((t) => t.id === 'return')
  }
  if (/product|size|ingredient|honey|rajma/.test(q)) {
    return TOPICS.find((t) => t.id === 'product')
  }
  return null
}

const waLink = (message) =>
  `https://wa.me/${PHONE_WA}?text=${encodeURIComponent(message)}`

const SupportChat = () => {
  const { pathname } = useLocation()
  const { cartOpen } = useShop()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([WELCOME])
  const [typing, setTyping] = useState(false)
  const listRef = useRef(null)
  const hide =
    cartOpen ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')

  useEffect(() => {
    if (cartOpen) setOpen(false)
  }, [cartOpen])

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, typing, open])

  const pushBot = (text, extras = {}) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-bot`, from: 'bot', text, ...extras },
    ])
  }

  const pushUser = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, from: 'user', text },
    ])
  }

  const replyLater = (fn) => {
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      fn()
    }, 420)
  }

  const onTopic = (topic) => {
    pushUser(topic.label)
    replyLater(() => pushBot(topic.reply, { topicId: topic.id }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || typing) return
    pushUser(text)
    setInput('')
    const matched = matchReply(text)
    replyLater(() => {
      if (matched) {
        pushBot(matched.reply, { topicId: matched.id })
      } else {
        pushBot('Got it - continue on WhatsApp for a quick reply from our team.', {
          handoff: true,
          draft: text,
        })
      }
    })
  }

  const draftForWa = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.from === 'user')
    return lastUser?.text
      ? `Hi PahadLink support, I need help with: ${lastUser.text}`
      : 'Hi PahadLink support, I need help with my order.'
  }, [messages])

  if (hide) return null

  return (
    <div className={`support-chat${open ? ' is-open' : ''}`}>
      {open && (
        <section
          className="support-chat__panel"
          role="dialog"
          aria-label="Customer support chat"
        >
          <header className="support-chat__head">
            <div className="support-chat__brand">
              <span className="support-chat__avatar" aria-hidden="true">
                <ChatIcon size={16} />
                <i className="support-chat__online" />
              </span>
              <div>
                <strong>PahadLink Support</strong>
                <span className="support-chat__status">Typically replies fast</span>
              </div>
            </div>
            <button
              type="button"
              className="support-chat__close"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <CloseIcon size={14} />
            </button>
          </header>

          <div className="support-chat__body" ref={listRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`support-chat__row support-chat__row--${msg.from}`}
              >
                {msg.from === 'bot' && (
                  <span className="support-chat__mini-avatar" aria-hidden="true">
                    <ChatIcon size={11} />
                  </span>
                )}
                <div
                  className={`support-chat__bubble support-chat__bubble--${msg.from}`}
                >
                  <p>{msg.text}</p>
                  {msg.from === 'bot' && msg.topicId === 'order' && (
                    <Link
                      to={ROUTES.ORDERS}
                      className="support-chat__inline-link"
                    >
                      <PackageIcon size={11} />
                      My orders
                    </Link>
                  )}
                  {msg.from === 'bot' && msg.topicId === 'return' && (
                    <Link
                      to={ROUTES.REFUNDS}
                      className="support-chat__inline-link"
                    >
                      <RefreshIcon size={11} />
                      Returns policy
                    </Link>
                  )}
                  {msg.from === 'bot' && (msg.handoff || msg.topicId) && (
                    <a
                      href={waLink(msg.draft || draftForWa)}
                      target="_blank"
                      rel="noreferrer"
                      className="support-chat__wa-btn"
                    >
                      <WhatsAppIcon size={12} />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="support-chat__row support-chat__row--bot">
                <span className="support-chat__mini-avatar" aria-hidden="true">
                  <ChatIcon size={11} />
                </span>
                <div
                  className="support-chat__bubble support-chat__bubble--bot support-chat__typing"
                  aria-label="Typing"
                >
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
          </div>

          <div className="support-chat__topics" aria-label="Quick help topics">
            {TOPICS.map((topic) => {
              const Icon = topic.Icon
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onTopic(topic)}
                  disabled={typing}
                >
                  <Icon size={12} />
                  {topic.label}
                </button>
              )
            })}
          </div>

          <div className="support-chat__direct">
            <a href={`tel:${PHONE_TEL}`} aria-label="Call support">
              <PhoneIcon size={13} />
              Call
            </a>
            <a
              href={waLink(draftForWa)}
              target="_blank"
              rel="noreferrer"
              className="support-chat__direct-wa"
              aria-label="WhatsApp support"
            >
              <WhatsAppIcon size={13} />
              WhatsApp
            </a>
            <a href={`mailto:${EMAIL}`} aria-label="Email support">
              <MailIcon size={13} />
              Email
            </a>
          </div>

          <form className="support-chat__form" onSubmit={onSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              aria-label="Support message"
              disabled={typing}
            />
            <button type="submit" aria-label="Send message" disabled={typing}>
              <ArrowUpIcon size={14} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`support-chat__launcher${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="support-chat__launcher-icon" aria-hidden="true">
          {open ? <CloseIcon size={22} /> : <ChatIcon size={22} />}
        </span>
        {!open && (
          <span className="support-chat__launcher-pulse" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

export default SupportChat
