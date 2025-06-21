import { useState, useEffect, useRef } from "react"
import { signOut, fetchAuthSession } from "@aws-amplify/auth"
import axios from "axios"
import { Loader, Send, Upload, LogOut, BookOpen, FileText } from "../compo/icons"
import "./styles.css"

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [history, setHistory] = useState([])
  const [file, setFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState("")
  const [toasts, setToasts] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const apiUrl = "https://n8cujiaan1.execute-api.us-east-1.amazonaws.com/dev"

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, history])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const showToast = ({ title, description, variant = "default" }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, variant }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  const fetchHistory = async () => {
    try {
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()

      const response = await axios.post(
        `${apiUrl}/chat-history`,
        {
          user_id: session.userSub,
        },
        {
          headers: { Authorization: `Bearer ${idToken}` },
        },
      )

      const historyMessages = response.data.history || []
      setHistory(historyMessages)

      if (historyMessages.length === 0) {
        setMessages([
          {
            text: "👋 Welcome to StudyBuddy! Upload a document to get started, then ask me questions about it.",
            sender: "bot",
          },
        ])
      }
    } catch (err) {
      showToast({
        title: "Error",
        description: `Failed to fetch history: ${err.message}`,
        variant: "error",
      })
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || isProcessing) return

    const userMessage = { text: newMessage, sender: "user" }
    setMessages([...messages, userMessage])
    setNewMessage("")
    setIsProcessing(true)

    try {
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()

      const response = await axios.post(
        `${apiUrl}/query`,
        { query: newMessage },
        { headers: { Authorization: `Bearer ${idToken}` } },
      )
      console.log(response.data.response);
      const fullResponse = response.data.response

      const referenceText = response.data.references

      setMessages((prev) => [
        ...prev,
        { text: fullResponse, sender: "bot" },
        ...(referenceText ? [{ text: referenceText, sender: "reference" }] : []),
      ])
    } catch (err) {
      setMessages((prev) => [...prev, { text: `Error: ${err.message}`, sender: "system" }])

      showToast({
        title: "Error",
        description: err.message,
        variant: "error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
    }
  }

  const handleFileUpload = async () => {
    if (!file) return

    setIsProcessing(true)
    setMessages([
      ...messages,
      {
        text: "Uploading and indexing document...",
        sender: "system",
      },
    ])

    try {
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()

      // Step 1: Get presigned URL
      const presignedResponse = await axios.post(
        `${apiUrl}/presigned`,
        { fileName: file.name, fileType: file.type },
        { headers: { Authorization: `Bearer ${idToken}` } },
      )
      const { presignedUrl } = presignedResponse.data

      // Step 2: Upload file to S3
      await axios.put(presignedUrl, file, {
        headers: { "Content-Type": file.type },
      })

      // Step 3: Trigger indexing Lambda
      await axios.post(
        `${apiUrl}/upload`,
        { presigned_url: presignedUrl },
        { headers: { Authorization: `Bearer ${idToken}` } },
      )

      setMessages((prev) => [
        ...prev,
        {
          text: `Document "${file.name}" uploaded and indexed successfully! You can now ask questions about it.`,
          sender: "system",
        },
      ])

      setFile(null)
      setFileName("")

      showToast({
        title: "Success",
        description: "Document uploaded and indexed successfully!",
        variant: "success",
      })
    } catch (err) {
      setMessages((prev) => [...prev, { text: `Error: ${err.message}`, sender: "system" }])

      showToast({
        title: "Upload Failed",
        description: err.message,
        variant: "error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = "/login"
    } catch (err) {
      showToast({
        title: "Sign Out Failed",
        description: err.message,
        variant: "error",
      })
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <BookOpen className="brand-icon" />
          <h1 className="brand-title">StudyBuddy</h1>
        </div>
        <button onClick={handleSignOut} className="sign-out-btn">
          <LogOut className="btn-icon" />
          Sign Out
        </button>
      </header>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.variant}`}>
            {toast.title && <h4 className="toast-title">{toast.title}</h4>}
            <p className="toast-description">{toast.description}</p>
          </div>
        ))}
      </div>

      <div className="main-content">
        {/* Main chat area */}
        <div className="chat-section">
          <div className="chat-card">
            {/* Card header */}
            <div className="card-header">
              <div className="card-title">
                <FileText className="title-icon" />
                Document Chat
              </div>
            </div>

            {/* Chat messages */}
            <div className="chat-messages-container">
              <div className="chat-messages">
                <div className="messages-list">
                  {[...history, ...messages].map((msg, index) => {
                    if (msg.sender === "user") {
                      return (
                        <div key={index} className="message-row message-user">
                          <div className="message-bubble message-bubble-user">{msg.text}</div>
                        </div>
                      )
                    } else if (msg.sender === "bot") {
                      return (
                        <div key={index} className="message-row message-bot">
                          <div className="message-bubble message-bubble-bot">{msg.text}</div>
                        </div>
                      )
                    } else if (msg.sender === "reference") {
                      return (
                        <div key={index} className="message-row message-bot">
                          <div className="message-bubble message-bubble-reference">
                            <strong>Reference:</strong> {msg.text}
                          </div>
                        </div>
                      )
                    } else {
                      return (
                        <div key={index} className="message-row message-center">
                          <div className="message-bubble message-bubble-system">{msg.text}</div>
                        </div>
                      )
                    }
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Message input */}
            <div className="message-input-container">
              {isProcessing && (
                <div className="processing-overlay">
                  <div className="processing-modal">
                    <Loader className="processing-spinner" />
                    <p className="processing-text">Processing...</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isProcessing ? "Please wait..." : "Ask a question about your document..."}
                  disabled={isProcessing}
                  className="message-input"
                />
                <button type="submit" disabled={isProcessing || !newMessage.trim()} className="send-btn">
                  <Send className="btn-icon" />
                  <span className="sr-only">Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Document upload card */}
          <div className="sidebar-card">
            <div className="card-header">
              <div className="card-title-small">Document Upload</div>
            </div>
            <div className="card-content">
              <div className="upload-section">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="file-input-hidden"
                  disabled={isProcessing}
                />

                <button onClick={triggerFileInput} className="file-upload-btn" disabled={isProcessing}>
                  <Upload className="upload-icon" />
                  <span className="upload-text">Select Document</span>
                </button>

                {fileName && <div className="file-name">Selected: {fileName}</div>}

                <button onClick={handleFileUpload} disabled={isProcessing || !file} className="process-btn">
                  Upload & Process Document
                </button>
              </div>
            </div>
          </div>

          {/* How to use card */}
          <div className="sidebar-card help-card">
            <div className="card-header-small">
              <div className="card-title-small">How to use</div>
            </div>
            <div className="card-content">
              <ol className="help-list">
                <li>Upload a document (PDF, DOCX, TXT)</li>
                <li>Wait for processing to complete</li>
                <li>Ask questions about the document content</li>
                <li>View references to see source information</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
