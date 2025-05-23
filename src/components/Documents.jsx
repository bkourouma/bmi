import React, { useEffect, useState, useRef, useCallback } from "react";

const API_BASE_URL = "http://127.0.0.1:8088";

const Documents = () => {
  // Document management state
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null,
    uploadedBy: "abc@abc.com" // Consider getting this from auth context
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState({
    isOpen: false,
    documentId: null,
    title: "",
    description: ""
  });

  const fileInputRef = useRef(null);

  /**
   * Fetch all documents from the API
   */
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/documents/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Erreur lors du chargement des documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear messages when user starts typing
    if (uploadMessage) {
      setUploadMessage("");
      setUploadSuccess(false);
    }
  };

  /**
   * Validate file upload
   */
  const validateFile = (file) => {
    if (!file) {
      return "Veuillez sélectionner un fichier PDF.";
    }
    
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return "Seuls les fichiers PDF sont acceptés.";
    }
    
    // Check file size (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "Le fichier est trop volumineux (maximum 10MB).";
    }
    
    return null;
  };

  /**
   * Handle document upload
   */
  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setUploadMessage("Le titre est requis.");
      return;
    }
    
    const fileError = validateFile(formData.file);
    if (fileError) {
      setUploadMessage(fileError);
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage("");
      setUploadSuccess(false);

      const formDataToSend = new FormData();
      formDataToSend.append("file", formData.file);
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("uploaded_by", formData.uploadedBy);

      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        setUploadSuccess(true);
        setUploadMessage("Document ajouté avec succès !");
        
        // Reset form
        setFormData({
          title: "",
          description: "",
          file: null,
          uploadedBy: formData.uploadedBy
        });
        
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        // Refresh documents list
        await fetchDocuments();
        
        // Clear success message after delay
        setTimeout(() => {
          setUploadSuccess(false);
          setUploadMessage("");
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors de l'upload");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadMessage(`Erreur: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle document deletion
   */
  const handleDelete = async (id, title) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le document "${title}" ?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        await fetchDocuments();
      } else {
        throw new Error("Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Erreur lors de la suppression du document");
    }
  };

  /**
   * Open edit modal
   */
  const openEditModal = (document) => {
    setEditModal({
      isOpen: true,
      documentId: document.id,
      title: document.title,
      description: document.description || ""
    });
  };

  /**
   * Close edit modal
   */
  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      documentId: null,
      title: "",
      description: ""
    });
  };

  /**
   * Handle edit modal input changes
   */
  const handleEditInputChange = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Save document edits
   */
  const saveEdit = async () => {
    if (!editModal.title.trim()) {
      alert("Le titre est requis.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${editModal.documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editModal.title.trim(),
          description: editModal.description.trim()
        }),
      });

      if (response.ok) {
        closeEditModal();
        await fetchDocuments();
      } else {
        throw new Error("Erreur lors de la modification");
      }
    } catch (err) {
      console.error("Edit error:", err);
      alert("Erreur lors de la modification du document");
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch {
      return dateString.split("T")[0];
    }
  };

  // Load documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-gray-600">Chargement des documents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Documents</h1>
          <p className="mt-2 text-sm text-gray-600">
            Téléchargez et gérez vos documents PDF
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erreur
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Ajouter un nouveau document
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                  placeholder="Entrez le titre du document"
                  required
                  disabled={isUploading}
                />
              </div>
              
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier PDF *
                </label>
                <input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={(e) => handleInputChange("file", e.target.files[0])}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                  required
                  disabled={isUploading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                placeholder="Description du document (optionnel)"
                disabled={isUploading}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Téléchargement...
                  </>
                ) : (
                  "Ajouter le document"
                )}
              </button>
            </div>

            {/* Success/Error Messages */}
            {uploadMessage && (
              <div className={`rounded-md p-4 ${
                uploadSuccess 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-red-50 border border-red-200"
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {uploadSuccess ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${
                      uploadSuccess ? "text-green-700" : "text-red-700"
                    }`}>
                      {uploadMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Documents Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Documents ({documents.length})
            </h3>
          </div>
          
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par télécharger votre premier document.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fichier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'ajout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ajouté par
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doc.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs truncate">
                          {doc.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`${API_BASE_URL}/documents/file/${doc.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {doc.filename}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.uploaded_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openEditModal(doc)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
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
                  Modifier le document
                </h3>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Titre *
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editModal.title}
                    onChange={(e) => handleEditInputChange("title", e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editModal.description}
                    onChange={(e) => handleEditInputChange("description", e.target.value)}
                    rows={4}
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

export default Documents;