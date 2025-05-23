import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Documents from "./components/Documents";
import LoginPage from "./LoginPage";
import PrivateRoute from "./PrivateRoute";
import Chatbots from "./components/Chatbots";
import Conversations from "./components/Conversations";
import Users from "./components/Users";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div className="flex bg-[#f7f9fb] min-h-screen">
                <Sidebar />
                <Dashboard />
              </div>
            </PrivateRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <PrivateRoute>
              <div className="flex bg-[#f7f9fb] min-h-screen">
                <Sidebar />
                <Documents />
              </div>
            </PrivateRoute>
          }
        />

        <Route
          path="/chatbots"
          element={
            <PrivateRoute>
              <div className="flex bg-[#f7f9fb] min-h-screen">
                <Sidebar />
                <Chatbots />
              </div>
            </PrivateRoute>
          }
        />

        <Route
          path="/conversations"
          element={
            <PrivateRoute>
              <div className="flex bg-[#f7f9fb] min-h-screen">
                <Sidebar />
                <Conversations />
              </div>
            </PrivateRoute>
          }
        />

        <Route
          path="/users"
          element={
            <PrivateRoute>
              <div className="flex bg-[#f7f9fb] min-h-screen">
                <Sidebar />
                <Users />
              </div>
            </PrivateRoute>
          }
        />

        {/* Add more protected routes here */}
      </Routes>
    </Router>
  );
}

export default App;
