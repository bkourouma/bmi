import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Read the base URL from env; default to local for dev
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8088";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      console.log(`🔗 Attempting login to: ${API_BASE_URL}/login`);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log(`📡 Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Login successful:", data);
        
        // Save login state and username
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", username);
        
        setMessage("✅ Connexion réussie ! Redirection...");
        
        // Small delay for user to see success message
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        // Try to get error details from response
        let errorMessage = "❌ Identifiant ou mot de passe incorrect !";
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = `❌ ${errorData.detail}`;
          }
        } catch (e) {
          // If response is not JSON, use default message
          console.log("Response is not JSON:", e);
        }
        
        console.log(`❌ Login failed: ${response.status} ${response.statusText}`);
        setMessage(errorMessage);
      }
    } catch (error) {
      console.error("🚨 Login error:", error);
      setMessage("❌ Erreur de connexion au serveur ! Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  // Test function to check if backend is reachable
  const testConnection = async () => {
    try {
      console.log(`🔍 Testing connection to: ${API_BASE_URL}/health`);
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Serveur accessible ! Status: ${data.status}`);
        console.log("🟢 Backend is reachable:", data);
      } else {
        setMessage(`❌ Serveur non accessible (${response.status})`);
      }
    } catch (error) {
      setMessage("❌ Impossible de joindre le serveur");
      console.error("🔴 Backend unreachable:", error);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Connexion BMI Admin</h2>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          fontSize: 12, 
          color: "#666", 
          marginBottom: 16, 
          padding: 8, 
          backgroundColor: "#f5f5f5", 
          borderRadius: 4 
        }}>
          API: {API_BASE_URL}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            disabled={isLoading}
            style={{ 
              width: "100%", 
              padding: 8,
              opacity: isLoading ? 0.6 : 1
            }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading}
            style={{ 
              width: "100%", 
              padding: 8,
              opacity: isLoading ? 0.6 : 1
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{ 
            width: "100%", 
            padding: 10, 
            background: isLoading ? "#ccc" : "#1976d2", 
            color: "white", 
            border: "none", 
            borderRadius: 4,
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>

      {/* Test connection button for debugging */}
      <button
        onClick={testConnection}
        style={{
          width: "100%",
          padding: 8,
          marginTop: 12,
          background: "transparent",
          border: "1px solid #ddd",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 12
        }}
      >
        🔍 Tester la connexion au serveur
      </button>

      {message && (
        <div style={{ 
          marginTop: 18, 
          padding: 8,
          borderRadius: 4,
          backgroundColor: message.startsWith("✅") ? "#e8f5e8" : "#ffeaea",
          color: message.startsWith("✅") ? "green" : "red",
          fontSize: 14
        }}>
          {message}
        </div>
      )}

      {/* Default credentials hint */}
      <div style={{ 
        marginTop: 16, 
        fontSize: 12, 
        color: "#666",
        textAlign: "center"
      }}>
        Pas de compte ? Utilisez le bouton "Tester la connexion" pour vérifier l'API
      </div>
    </div>
  );
}