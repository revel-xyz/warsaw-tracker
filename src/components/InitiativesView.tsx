import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus } from 'lucide-react';

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

interface Initiative {
  id: number;
  number: number;
  title: string;
  description: string | null;
  status: string | null;
  owner: string | null;
}

interface InitiativesViewProps {
  tasks: Task[];
  onRefresh: () => void;
}

export default function InitiativesView({ tasks, onRefresh }: InitiativesViewProps) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadInitiatives();
  }, []);

  const loadInitiatives = async () => {
    const { data } = await supabase
      .from('wt_initiatives')
      .select('*')
      .order('number');
    if (data) setInitiatives(data);
  };

  // Filter: initiative_number IS NOT NULL AND initiative_number != 7
  const filteredTasks = tasks.filter(
    (t) => t.initiative_number !== null && t.initiative_number !== 7
  );

  const grouped: Record<number, Task[]> = {};
  for (const t of filteredTasks) {
    const num = t.initiative_number!;
    if (!grouped[num]) grouped[num] = [];
    grouped[num].push(t);
  }
  // Sort tasks within each group
  for (const key of Object.keys(grouped)) {
    grouped[Number(key)].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }

  const INITIATIVE_EMOJIS: Record<number, string> = {
    1: '🚀',
    2: '📊',
    3: '🎯',
    4: '💡',
    5: '🔧',
    6: '📋',
    8: '🌟',
    9: '📈',
    10: '🎨',
  };

  const toggleDone = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'not_started' : 'done';
    await supabase.from('wt_tasks').update({ status: newStatus }).eq('id', task.id);
    onRefresh();
  };

  const deleteTask = async (id: number) => {
    await supabase.from('wt_tasks').delete().eq('id', id);
    onRefresh();
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const saveEdit = async (id: number) => {
    if (editValue.trim()) {
      await supabase.from('wt_tasks').update({ title: editValue.trim() }).eq('id', id);
    }
    setEditingId(null);
    onRefresh();
  };

  const addItem = async (initiativeNumber: number) => {
    const initTasks = grouped[initiativeNumber] || [];
    const maxSort = initTasks.reduce((max, t) => Math.max(max, t.sort_order ?? 0), 0);
    await supabase.from('wt_tasks').insert({
      title: 'New item',
      initiative_number: initiativeNumber,
      status: 'not_started',
      sort_order: maxSort + 1,
    }).select();
    onRefresh();
  };

  // Show initiatives that have tasks or exist in the DB (excluding #7)
  const initiativeNumbers = [...new Set([
    ...initiatives.filter((i) => i.number !== 7).map((i) => i.number),
    ...Object.keys(grouped).map(Number),
  ])].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {initiativeNumbers.map((num) => {
        const init = initiatives.find((i) => i.number === num);
        const emoji = INITIATIVE_EMOJIS[num] || '📌';
        const initTasks = grouped[num] || [];

        return (
          <div key={num} className="card bg-white shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-bold text-lg" style={{ color: '#1a1a1a' }}>
                {emoji} {init ? `#${num}: ${init.title}` : `Initiative #${num}`}
              </h3>
              {init?.description && (
                <p className="text-sm" style={{ color: '#666' }}>{init.description}</p>
              )}
              <div className="divide-y mt-2">
                {initTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2 group">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={task.status === 'done'}
                      onChange={() => toggleDone(task)}
                      style={{ accentColor: '#FF6B35' }}
                    />
                    {editingId === task.id ? (
                      <input
                        type="text"
                        className="input input-sm input-bordered flex-1"
                        style={{ color: '#000' }}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`flex-1 cursor-pointer ${task.status === 'done' ? 'line-through opacity-50' : ''}`}
                        style={{ color: '#1a1a1a' }}
                        onClick={() => startEdit(task)}
                      >
                        {task.title}
                      </span>
                    )}
                    {task.owner && (
                      <span
                        className="badge badge-sm text-white"
                        style={{ backgroundColor: '#FF6B35' }}
                      >
                        {task.owner}
                      </span>
                    )}
                    <button
                      className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 size={14} style={{ color: '#999' }} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-ghost btn-sm mt-2 self-start"
                style={{ color: '#FF6B35' }}
                onClick={() => addItem(num)}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>
        );
      })}
      {initiativeNumbers.length === 0 && (
        <div className="text-center py-12" style={{ color: '#999' }}>
          No initiatives found.
        </div>
      )}
    </div>
  );
}
