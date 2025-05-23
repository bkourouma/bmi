import React, { useState, useRef, useEffect } from "react";

// You may want to put the API URLs in an .env or config file
const API_URL = "http://localhost:6688/chat";
const EXTRACT_NAME = "http://localhost:6688/extract_name";
const SET_NAME = "http://localhost:6688/set_user_name";
const DEBUG_ENDPOINT = "http://localhost:6688/debug/session/";

function parseMarkdown(md) {
  // Use Marked.js if available; fallback to simple newlines
  if (window.marked) return window.marked.parse(md);
  return md.replace(/\n/g, "<br/>");
}

export default function Chatbots() {
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("chat_history") || "[]"));
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => localStorage.getItem("chat_session_id") || ("sess_" + Date.now()));
  const [userName, setUserName] = useState(() => localStorage.getItem("user_name") || "");
  const [debugOpen, setDebugOpen] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");
  const chatBoxRef = useRef();

  // Store session id and chat history in localStorage
  useEffect(() => {
    localStorage.setItem("chat_session_id", sessionId);
  }, [sessionId]);
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    if (userName) localStorage.setItem("user_name", userName);
  }, [userName]);

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages]);

  // Debug info fetcher
  const updateDebug = async () => {
    const front = { sessionId, userName, chatHistory: messages };
    let out = "=== Front-end ===\n" + JSON.stringify(front, null, 2);
    try {
      const res = await fetch(DEBUG_ENDPOINT + sessionId);
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
  };
  useEffect(() => { if (debugOpen) updateDebug(); }, [messages, debugOpen, sessionId]);

  // Reset chat
  const resetChat = () => {
    localStorage.removeItem("chat_history");
    localStorage.removeItem("user_name");
    const newSession = "sess_" + Date.now();
    setSessionId(newSession);
    setMessages([]);
    setUserName("");
    addMessage("Je suis Akissi, votre assistante chez BMI Côte d'Ivoire. Pour commencer, puis-je avoir votre prénom ?", "bot");
  };

  // Add a message
  function addMessage(content, role) {
    setMessages((msgs) => [...msgs, { role, content }]);
  }

  // Send handler
  const handleSend = async () => {
    const userInput = input.trim();
    if (!userInput) return;
    setInput("");
    addMessage(userInput, "user");

    // Name extraction flow
    if (!userName) {
      try {
        const res = await fetch(EXTRACT_NAME, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, question: userInput })
        });
        const { name } = await res.json();
        if (name) {
          setUserName(name);
          await fetch(SET_NAME, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, name })
          });
          const greeting = `${name}, comment puis-je vous aider aujourd'hui ?`;
          addMessage(greeting, "bot");
          return;
        }
      } catch (e) {
        addMessage("Erreur lors de la détection du prénom.", "bot");
      }
    }

    // Usual chat flow
    addMessage("💭...", "bot");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question: userInput })
      });
      const data = await res.json();
      setMessages(msgs => {
        // Remove last placeholder bot message
        const copy = [...msgs];
        copy.pop();
        return [...copy, { role: "bot", content: data.answer }];
      });
    } catch (err) {
      setMessages(msgs => {
        const copy = [...msgs];
        copy.pop();
        return [...copy, { role: "bot", content: "❌ Erreur API: " + err }];
      });
    }
  };

  // On mount, greet if empty
  useEffect(() => {
    if (messages.length === 0) {
      addMessage("Je suis Akissi, votre assistante chez BMI Côte d'Ivoire. Pour commencer, puis-je avoir votre prénom ?", "bot");
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>💬 Chatbot BMI Côte d'Ivoire</h2>
      <div
        ref={chatBoxRef}
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 20,
          height: 380,
          overflowY: "auto",
          marginBottom: 16,
          boxShadow: "0 2px 8px #0001",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.role === "user" ? "user" : "bot"}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#d1e7dd" : "#e0f7fa",
              padding: "0.75rem",
              borderRadius: 8,
              margin: "0.5rem 0",
              maxWidth: "75%",
              textAlign: msg.role === "user" ? "right" : "left",
              whiteSpace: "pre-wrap"
            }}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" ? handleSend() : null}
          placeholder="Votre message…"
          style={{
            flex: 1, padding: "0.5rem", fontSize: "1rem",
            borderRadius: 6, border: "1px solid #bbb"
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "0.5rem 1.2rem", fontSize: "1rem",
            background: "#005baa", color: "#fff",
            border: "none", borderRadius: 6, cursor: "pointer"
          }}
        >
          Envoyer
        </button>
        <button
          onClick={resetChat}
          style={{
            background: "#ff6b6b", color: "#fff",
            padding: "0.5rem 0.7rem", fontSize: "1rem", border: "none",
            borderRadius: 6, cursor: "pointer"
          }}
          title="Réinitialiser le chat"
        >⟲</button>
      </div>

      {/* Debug panel */}
      <div style={{
        marginTop: "1rem", border: "1px solid #ccc", padding: "0.5rem", background: "#fafafa"
      }}>
        <h4 style={{ display: "inline-block", margin: 0 }}>⚙️ Debug</h4>
        <button
          style={{
            float: "right", background: "#eee", color: "#444",
            padding: "0.1rem 0.7rem", fontSize: "0.9rem", border: "none", borderRadius: 4, cursor: "pointer"
          }}
          onClick={() => setDebugOpen(d => !d)}
        >{debugOpen ? "Masquer Debug" : "Afficher Debug"}</button>
        {debugOpen && (
          <pre
            style={{
              background: "#f7f7f7", padding: "0.5rem",
              overflow: "auto", maxHeight: 200, marginTop: 8, whiteSpace: "pre-wrap"
            }}
          >{debugInfo}</pre>
        )}
      </div>
    </div>
  );
}
