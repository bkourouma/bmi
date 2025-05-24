import React, { useState, useRef, useEffect, useCallback } from "react";
import { CgSpinner } from "react-icons/cg";
import { FiSend, FiRefreshCw, FiSettings } from "react-icons/fi";
import { marked } from 'marked';

// Base URL: falls back to localhost in development, or uses env setting in production
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8088";

const API_URL = `${API_BASE_URL}/chat`;
const EXTRACT_NAME = `${API_BASE_URL}/extract_name`;
const SET_NAME = `${API_BASE_URL}/set_user_name`;
const DEBUG_ENDPOINT = `${API_BASE_URL}/debug/session/`;

// Function to parse markdown text
function parseMarkdown(md) {
  // Use Marked.js if available; fallback to simple newlines
  if (marked) {
    try {
      return marked.parse(md);
    } catch (err) {
      console.error("Error parsing markdown:", err);
      return md.replace(/\n/g, "<br/>");
    }
  }
  return md.replace(/\n/g, "<br/>");
}

export default function Chatbot() {
  // State management
  const [messages, setMessages] = useState(() =>
    JSON.parse(localStorage.getItem("chat_history") || "[]")
  );
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem("chat_session_id") || `sess_${Date.now()}`
  );
  const [userName, setUserName] = useState(() =>
    localStorage.getItem("user_name") || ""
  );
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  // Persist session and history
  useEffect(() => {
    localStorage.setItem("chat_session_id", sessionId);
  }, [sessionId]);
  
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);
  
  useEffect(() => {
    if (userName) localStorage.setItem("user_name", userName);
  }, [userName]);

  // Auto-scroll
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus on input when page loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Fetch debug info from backend
  const updateDebug = useCallback(async () => {
    const front = { sessionId, userName, chatHistory: messages };
    let out = "=== Front-end ===\n" + JSON.stringify(front, null, 2);
    
    try {
      const res = await fetch(`${DEBUG_ENDPOINT}${sessionId}`);
      if (res.ok) {
        const srv = await res.json();
        out += "\n\n=== Back-end ===\n" + JSON.stringify(srv, null, 2);
      } else {
        out += `\n\n[Back] Erreur ${res.status}`;
      }
    } catch (err) {
      out += `\n\n[Back] Erreur réseau: ${err}`;
    }
    
    setDebugInfo(out);
  }, [sessionId, userName, messages]);

  useEffect(() => {
    if (debugOpen) updateDebug();
  }, [messages, debugOpen, sessionId, updateDebug]);

  // Reset chat
  const resetChat = () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser la conversation ?")) {
      return;
    }
    
    localStorage.removeItem("chat_history");
    localStorage.removeItem("user_name");
    
    const newSession = `sess_${Date.now()}`;
    setSessionId(newSession);
    setMessages([]);
    setUserName("");
    
    // Add initial greeting
    addMessage(
      "Je suis Akissi, votre assistante chez BMI Côte d'Ivoire. Pour commencer, puis-je avoir votre prénom ?",
      "bot"
    );
    
    // Focus on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Helper to add a message
  function addMessage(content, role) {
    setMessages((msgs) => [...msgs, { role, content }]);
  }

  // Send handler
  const handleSend = async () => {
    const userInput = input.trim();
    if (!userInput || isLoading) return;
    
    setInput("");
    addMessage(userInput, "user");
    setIsLoading(true);

    try {
      // Name extraction flow
      if (!userName) {
        try {
          const res = await fetch(EXTRACT_NAME, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, question: userInput }),
          });
          
          if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
          }
          
          const { name } = await res.json();
          if (name) {
            setUserName(name);
            
            await fetch(SET_NAME, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sessionId, name }),
            });
            
            const greeting = `${name}, comment puis-je vous aider aujourd'hui ?`;
            addMessage(greeting, "bot");
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error("Name extraction error:", err);
          addMessage("Erreur lors de la détection du prénom. Comment puis-je vous aider ?", "bot");
          setIsLoading(false);
          return;
        }
      }

      // Usual chat flow
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question: userInput }),
      });
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const data = await res.json();
      addMessage(data.answer, "bot");
    } catch (err) {
      console.error("Chat error:", err);
      addMessage(`❌ Erreur: ${err.message || "Problème de connexion au serveur"}`, "bot");
    } finally {
      setIsLoading(false);
      
      // Focus back on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      addMessage(
        "Je suis Akissi, votre assistante chez BMI Côte d'Ivoire. Pour commencer, puis-je avoir votre prénom ?",
        "bot"
      );
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col h-screen">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        💬 Chatbot BMI Côte d'Ivoire
      </h2>
      
      {/* Chat container */}
      <div
        ref={chatBoxRef}
        className="flex-1 bg-white rounded-lg shadow-md p-4 sm:p-6 overflow-y-auto mb-4 flex flex-col"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] shadow-sm ${
                msg.role === "user" 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div
                className="prose"
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(msg.content),
                }}
              />
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 flex items-center">
              <CgSpinner className="animate-spin mr-2" />
              <span>Akissi réfléchit...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey ? handleSend() : null}
          placeholder="Votre message…"
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="inline-flex items-center justify-center bg-blue-600 text-white rounded-md p-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          title="Envoyer"
        >
          <FiSend className="w-5 h-5" />
        </button>
        <button
          onClick={resetChat}
          className="inline-flex items-center justify-center bg-red-500 text-white rounded-md p-3 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          title="Réinitialiser le chat"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      {/* Debug panel */}
      <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
        <div 
          className="bg-gray-100 px-4 py-2 flex justify-between items-center cursor-pointer" 
          onClick={() => setDebugOpen(prev => !prev)}
        >
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <FiSettings className="mr-2" /> Debug
          </h3>
          <span className="text-sm text-gray-500">
            {debugOpen ? "Masquer" : "Afficher"}
          </span>
        </div>
        
        {debugOpen && (
          <div className="p-4 bg-gray-50">
            <pre className="text-xs overflow-auto max-h-60 bg-white p-2 rounded border border-gray-200">
              {debugInfo || "Chargement des informations de débogage..."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}