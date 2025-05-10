import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/chat', {
        message: userMessage
      });

      setMessages(prev => [...prev, { text: response.data.reply, sender: 'bot' }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.', 
        sender: 'bot' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="floating-chat">
      {!isOpen && (
        <button 
          className="chat-button"
          onClick={() => setIsOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Bank Assistant</h3>
            <button className="close-button" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <p>How can I help you today?</p>
                <p>You can ask me about:</p>
                <ul>
                  <li>Opening a new account</li>
                  <li>Required documents</li>
                  <li>Application status</li>
                  <li>Document updates</li>
                  <li>Security information</li>
                  <li>Getting help or support</li>
                </ul>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .floating-chat {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #007bff;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s;
        }

        .chat-button:hover {
          transform: scale(1.05);
        }

        .chat-window {
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          padding: 15px;
          background: #007bff;
          color: white;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .welcome-message {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .welcome-message ul {
          list-style: none;
          padding: 0;
          margin: 10px 0;
          text-align: left;
        }

        .welcome-message li {
          margin: 5px 0;
          color: #495057;
          font-size: 0.9rem;
        }

        .message {
          max-width: 80%;
          padding: 10px 12px;
          border-radius: 12px;
          margin: 2px 0;
          word-wrap: break-word;
          font-size: 0.9rem;
        }

        .user-message {
          background: #007bff;
          color: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .bot-message {
          background: #f1f3f5;
          color: #212529;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .chat-input {
          padding: 15px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          display: flex;
          gap: 8px;
        }

        .chat-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .chat-input button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .chat-input button:hover {
          background: #0056b3;
        }

        .chat-input button:disabled {
          background: #ced4da;
          cursor: not-allowed;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: #6c757d;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default FloatingChat; 