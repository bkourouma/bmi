import React, { useState, useEffect } from "react";
import {
  MdDashboard,
  MdMail,
  MdRocketLaunch,
  MdOutlineSmartToy,
  MdGroups,
  MdLogout,
} from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";

const menu = [
  { icon: <MdDashboard size={22} />,      label: "Tableau de bord",        path: "/" },
  { icon: <MdMail size={22} />,           label: "Documents",              path: "/documents" },
  { icon: <MdRocketLaunch size={22} />,   label: "Conversations",          path: "/conversations" },
  { icon: <MdOutlineSmartToy size={22} />,label: "Test Chatbot",           path: "/chatbots" },
  { icon: <MdGroups size={22} />,         label: "Utilisateurs",           path: "/users" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    // Clear all user data
    localStorage.clear();
    // Redirect to login page
    navigate("/login");
  };

  return (
    <aside className="bg-[#111d2f] text-white w-64 min-h-screen flex flex-col justify-between py-4">
      <div>
        <div className="px-6 pb-6">
          <span className="text-2xl font-bold">
            <span className="text-[#3f8cff]">ChatBot</span>
            <span className="text-white">360</span>
          </span>
        </div>
        <nav>
          {menu.map((item) => (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-6 py-2 cursor-pointer hover:bg-[#21304b] rounded-md mb-1
                ${location.pathname === item.path ? "bg-[#183153]" : ""}`}
            >
              {item.icon}
              <span className="text-[1rem]">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
      <div className="px-6 mb-6 space-y-2">
        <div className="border-t border-[#2c3753] pt-3 mb-3">
          <div className="text-sm font-semibold">{username}</div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full text-sm px-2 py-2 hover:bg-[#21304b] rounded-md text-yellow-300"
        >
          <MdLogout size={18} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
