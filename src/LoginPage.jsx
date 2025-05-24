import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Read the base URL from env; default to local for dev
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8088";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // Save login state and username
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", username);
        // Redirect to dashboard ("/")
        navigate("/");
      } else {
        setMessage("❌ Identifiant ou mot de passe incorrect !");
      }
    } catch (error) {
      setMessage("❌ Erreur de connexion au serveur !");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <button
          type="submit"
          style={{ width: "100%", padding: 10, background: "#1976d2", color: "white", border: "none", borderRadius: 4 }}
        >
          Se connecter
        </button>
      </form>
      {message && (
        <div style={{ marginTop: 18, color: message.startsWith("✅") ? "green" : "red" }}>
          {message}
        </div>
      )}
    </div>
  );
}
