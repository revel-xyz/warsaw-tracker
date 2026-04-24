import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import PasswordGate from './components/PasswordGate';
import AgendaView from './components/AgendaView';
import InitiativesView from './components/InitiativesView';
import MoviesView from './components/MoviesView';

interface Task {
  id: number;
  title: string;
  owner: string | null;
  status: string;
  priority: string | null;
  day_assigned: string | null;
  initiative_number: number | null;
  notes: string | null;
  comments: string | null;
  sort_order: number | null;
}

type Tab = 'agenda' | 'initiatives' | 'movies';

export default function App() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem('wt_auth') === 'true'
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('agenda');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wt_tasks')
      .select('*')
      .order('sort_order');
    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadTasks();
    }
  }, [authenticated, loadTasks]);

  if (!authenticated) {
    return <PasswordGate onSuccess={() => setAuthenticated(true)} />;
  }

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'agenda', label: 'Daily Agenda', emoji: '📅' },
    { key: 'initiatives', label: 'Initiatives', emoji: '🚀' },
    { key: 'movies', label: 'Movie Tests', emoji: '🎬' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div
        className="p-4 shadow-sm"
        style={{ backgroundColor: '#FF6B35' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            🍿 Warsaw Offsite Tracker — April 2026
          </h1>
          <button
            className="btn btn-ghost btn-sm text-white opacity-70 hover:opacity-100"
            onClick={() => {
              localStorage.removeItem('wt_auth');
              setAuthenticated(false);
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'text-white shadow-sm'
                  : 'hover:bg-gray-100'
              }`}
              style={
                activeTab === tab.key
                  ? { backgroundColor: '#FF6B35', color: '#fff' }
                  : { color: '#555' }
              }
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" style={{ color: '#FF6B35' }}></span>
          </div>
        ) : (
          <>
            {activeTab === 'agenda' && (
              <AgendaView tasks={tasks} onRefresh={loadTasks} />
            )}
            {activeTab === 'initiatives' && (
              <InitiativesView tasks={tasks} onRefresh={loadTasks} />
            )}
            {activeTab === 'movies' && (
              <MoviesView tasks={tasks} onRefresh={loadTasks} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
