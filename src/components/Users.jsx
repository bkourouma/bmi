import React, { useState, useEffect } from "react";
import { MdAdd, MdDelete } from "react-icons/md";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8088/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle user deletion
  const handleDelete = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8088/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("✅ Utilisateur supprimé avec succès");
        fetchUsers(); // Refresh the list
      } else {
        setMessage("❌ Erreur lors de la suppression");
      }
    } catch (error) {
      setMessage("❌ Erreur de connexion au serveur");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8088/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Utilisateur ajouté avec succès");
        setFormData({
          username: "",
          password: "",
          confirmPassword: ""
        });
        setIsAddModalOpen(false);
        fetchUsers(); // Refresh the list
      } else {
        setMessage(`❌ ${data.detail || "Erreur lors de l'ajout de l'utilisateur"}`);
      }
    } catch (error) {
      setMessage("❌ Erreur de connexion au serveur");
    }
  };

  if (isLoading) {
    return <div className="p-4">Chargement...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-start py-12 px-2">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">Gestion des utilisateurs</h1>
          </div>

          {message && (
            <div className={`mx-6 mt-4 mb-2 p-3 rounded ${
              message.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-5 text-left text-base font-bold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-8 py-5 text-left text-base font-bold text-gray-600 uppercase tracking-wider">Nom d'utilisateur</th>
                  <th className="px-8 py-5 text-right text-base font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, idx) => (
                  <tr key={user.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-700">{user.id}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-900">{user.username}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-base font-medium">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                        title="Supprimer"
                      >
                        <MdDelete size={22} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add User Button at the bottom */}
          <div className="flex justify-center px-6 py-5 border-t border-gray-200">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 text-base font-medium shadow"
            >
              <MdAdd size={22} /> Ajouter un utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ajouter un utilisateur</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                Ajouter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 