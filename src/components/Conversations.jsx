import React, { useEffect, useState, useCallback } from "react";

const API_BASE_URL = "http://127.0.0.1:8088";

const Conversations = () => {
  // State
  const [convos, setConvos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConvos, setSelectedConvos] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Edit modal state
  const [editModal, setEditModal] = useState({
    isOpen: false,
    convoId: null,
    message: "",
    role: "",
    user_name: "",
  });

  /**
   * Fetch all conversations from the API
   */
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `${API_BASE_URL}/conversations/`;
      const params = new URLSearchParams();
      
      if (dateRange.startDate) {
        params.append('start_date', dateRange.startDate);
      }
      if (dateRange.endDate) {
        params.append('end_date', dateRange.endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      // Sort conversations by timestamp in descending order (newest first)
      const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setConvos(sortedData);
      setSelectedConvos([]); // Reset selections when fetching new data
    } catch (err) {
      setError("Erreur lors du chargement des conversations");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  /**
   * Handle delete
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchConversations();
      } else {
        throw new Error();
      }
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = async () => {
    if (!selectedConvos.length) return;
    if (!window.confirm(`Supprimer ${selectedConvos.length} conversation(s) ?`)) return;
    
    try {
      const deletePromises = selectedConvos.map(id =>
        fetch(`${API_BASE_URL}/conversations/${id}`, {
          method: "DELETE",
        })
      );
      
      await Promise.all(deletePromises);
      await fetchConversations();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  /**
   * Handle checkbox selection
   */
  const handleSelectConvo = (id) => {
    setSelectedConvos(prev => 
      prev.includes(id) 
        ? prev.filter(convoId => convoId !== id)
        : [...prev, id]
    );
  };

  /**
   * Handle select all
   */
  const handleSelectAll = () => {
    if (selectedConvos.length === convos.length) {
      setSelectedConvos([]);
    } else {
      setSelectedConvos(convos.map(c => c.id));
    }
  };

  /**
   * Open edit modal
   */
  const openEditModal = (convo) => {
    setEditModal({
      isOpen: true,
      convoId: convo.id,
      message: convo.message,
      role: convo.role,
      user_name: convo.user_name || "",
    });
  };

  /**
   * Close edit modal
   */
  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      convoId: null,
      message: "",
      role: "",
      user_name: "",
    });
  };

  /**
   * Handle edit input changes
   */
  const handleEditInputChange = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Save conversation edits
   */
  const saveEdit = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/conversations/${editModal.convoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: editModal.message,
            role: editModal.role,
            user_name: editModal.user_name,
          }),
        }
      );

      if (response.ok) {
        closeEditModal();
        await fetchConversations();
      } else {
        throw new Error("Erreur lors de la modification");
      }
    } catch (err) {
      alert("Erreur lors de la modification");
    }
  };

  /**
   * Export to CSV
   */
  const handleExport = () => {
    if (!convos.length) return;
    const csvRows = [
      [
        "ID",
        "Session",
        "Horodatage",
        "Message",
        "Rôle",
        "Utilisateur",
      ].join(","),
      ...convos.map((c) =>
        [
          c.id,
          c.session_id,
          `"${formatDate(c.timestamp)}"`,
          `"${(c.message || "").replace(/"/g, '""')}"`,
          c.role,
          c.user_name || "",
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "conversations.csv";
    link.click();
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return dateString?.split("T")[0] || "";
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des Conversations
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Affiche l&apos;historique des conversations du chatbot
            </p>
          </div>
        </div>

        {/* Date Range Filter + Actions */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex items-end justify-between flex-wrap gap-4">
            {/* Action Buttons Left */}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Exporter CSV
              </button>
              {selectedConvos.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Supprimer ({selectedConvos.length})
                </button>
              )}
            </div>
            {/* Filter Inputs Right */}
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                />
              </div>
              <button
                onClick={fetchConversations}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Filtrer
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Conversations ({convos.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Chargement…</div>
          ) : convos.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucune conversation
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedConvos.length === convos.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horodatage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {convos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedConvos.includes(c.id)}
                          onChange={() => handleSelectConvo(c.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-2">{c.id}</td>
                      <td className="px-4 py-2">{c.session_id}</td>
                      <td className="px-4 py-2">{formatDate(c.timestamp)}</td>
                      <td className="px-4 py-2">{c.message}</td>
                      <td className="px-4 py-2">{c.role}</td>
                      <td className="px-4 py-2">{c.user_name}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editModal.isOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Modifier la conversation
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="edit-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="edit-message"
                    value={editModal.message}
                    onChange={(e) => handleEditInputChange("message", e.target.value)}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                  />
                </div>
                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <input
                    id="edit-role"
                    type="text"
                    value={editModal.role}
                    onChange={(e) => handleEditInputChange("role", e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                  />
                </div>
                <div>
                  <label htmlFor="edit-user" className="block text-sm font-medium text-gray-700 mb-1">
                    Utilisateur
                  </label>
                  <input
                    id="edit-user"
                    type="text"
                    value={editModal.user_name}
                    onChange={(e) => handleEditInputChange("user_name", e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  onClick={closeEditModal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
