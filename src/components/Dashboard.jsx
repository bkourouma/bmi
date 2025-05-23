// src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { MdMessage, MdDescription, MdTrendingUp, MdAccessTime } from "react-icons/md";

const API_BASE_URL = "http://127.0.0.1:8088";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalDocuments: 0,
    activeUsers: 0,
    avgResponseTime: 0,
    recentConversations: [],
    recentDocuments: [],
    conversationTrend: [],
    documentTrend: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch conversations
        const conversationsRes = await fetch(`${API_BASE_URL}/conversations/`);
        const conversations = await conversationsRes.json();

        // Fetch documents
        const documentsRes = await fetch(`${API_BASE_URL}/documents/`);
        const documents = await documentsRes.json();

        // Calculate statistics
        const uniqueUsers = new Set(conversations.map(c => c.user_name)).size;
        const recentConvos = conversations.slice(-5).reverse();
        const recentDocs = documents.slice(-5).reverse();

        // Calculate average response time (simplified example)
        const responseTimes = conversations
          .filter(c => c.role === 'assistant')
          .map((c, i, arr) => {
            if (i === 0) return 0;
            const prevMsg = arr[i - 1];
            return new Date(c.timestamp) - new Date(prevMsg.timestamp);
          })
          .filter(t => t > 0);
        
        const avgResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000 // Convert to seconds
          : 0;

        setStats({
          totalConversations: conversations.length,
          totalDocuments: documents.length,
          activeUsers: uniqueUsers,
          avgResponseTime: avgResponseTime.toFixed(1),
          recentConversations: recentConvos,
          recentDocuments: recentDocs,
          conversationTrend: calculateTrend(conversations),
          documentTrend: calculateTrend(documents)
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateTrend = (data) => {
    // Group data by date and count items
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.timestamp || item.uploaded_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Convert to array and get last 7 days
    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-7)
      .map(([date, count]) => ({ date, count }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 w-full">
      <div className="text-2xl font-semibold mb-3">Tableau de bord</div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<MdMessage className="text-blue-500" size={24} />}
          title="Conversations"
          value={stats.totalConversations}
          trend={stats.conversationTrend}
        />
        <MetricCard
          icon={<MdDescription className="text-green-500" size={24} />}
          title="Documents"
          value={stats.totalDocuments}
          trend={stats.documentTrend}
        />
        <MetricCard
          icon={<MdTrendingUp className="text-purple-500" size={24} />}
          title="Utilisateurs Actifs"
          value={stats.activeUsers}
        />
        <MetricCard
          icon={<MdAccessTime className="text-orange-500" size={24} />}
          title="Temps de Réponse Moyen"
          value={`${stats.avgResponseTime}s`}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Conversations Récentes</h3>
          <div className="space-y-4">
            {stats.recentConversations.map((convo) => (
              <div key={convo.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium">{convo.user_name || 'Anonyme'}</div>
                  <div className="text-sm text-gray-600 truncate">{convo.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(convo.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {convo.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Documents Récents</h3>
          <div className="space-y-4">
            {stats.recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium">{doc.title}</div>
                  <div className="text-sm text-gray-600 truncate">{doc.description || 'Pas de description'}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Ajouté par {doc.uploaded_by} le {new Date(doc.uploaded_at).toLocaleString()}
                  </div>
                </div>
                <a
                  href={`${API_BASE_URL}/documents/file/${doc.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Voir
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, trend }) {
  const showTrend = trend && trend.length >= 2;
  const isTrendingUp = showTrend && trend[trend.length - 1].count > trend[trend.length - 2].count;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <div className="text-sm text-gray-500">{title}</div>
            <div className="text-2xl font-semibold">{value}</div>
          </div>
        </div>
        {showTrend && (
          <div className={`text-sm ${isTrendingUp ? 'text-green-500' : 'text-red-500'}`}>
            {isTrendingUp ? '↑' : '↓'}
          </div>
        )}
      </div>
    </div>
  );
}
