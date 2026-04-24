import { useState } from 'react';
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

interface AgendaViewProps {
  tasks: Task[];
  onRefresh: () => void;
}

const DAY_ORDER = ['2026-04-23', '2026-04-24', '2026-04-25'];
const DAY_LABELS: Record<string, string> = {
  '2026-04-23': '📅 Wed Apr 23',
  '2026-04-24': '📅 Thu Apr 24',
  '2026-04-25': '📅 Fri Apr 25',
};

function priorityColor(priority: string | null): string {
  if (!priority) return '';
  const p = priority.toLowerCase();
  if (p === 'high' || p === 'p0') return '#ef4444';
  if (p === 'medium' || p === 'p1') return '#f59e0b';
  if (p === 'low' || p === 'p2') return '#22c55e';
  return '';
}

export default function AgendaView({ tasks, onRefresh }: AgendaViewProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const agendaTasks = tasks.filter((t) => t.day_assigned !== null && t.day_assigned !== '');
  const grouped: Record<string, Task[]> = {};
  for (const day of DAY_ORDER) {
    grouped[day] = agendaTasks
      .filter((t) => t.day_assigned === day)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }
  // Also group any other days not in DAY_ORDER
  for (const t of agendaTasks) {
    if (t.day_assigned && !DAY_ORDER.includes(t.day_assigned)) {
      if (!grouped[t.day_assigned]) grouped[t.day_assigned] = [];
      grouped[t.day_assigned].push(t);
    }
  }

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

  const addItem = async (day: string) => {
    const dayTasks = grouped[day] || [];
    const maxSort = dayTasks.reduce((max, t) => Math.max(max, t.sort_order ?? 0), 0);
    await supabase.from('wt_tasks').insert({
      title: 'New item',
      day_assigned: day,
      status: 'not_started',
      sort_order: maxSort + 1,
    }).select();
    onRefresh();
  };

  const allDays = [...DAY_ORDER, ...Object.keys(grouped).filter((d) => !DAY_ORDER.includes(d))].filter(
    (d) => grouped[d] && grouped[d].length > 0 || DAY_ORDER.includes(d)
  );

  return (
    <div className="space-y-6">
      {allDays.map((day) => (
        <div key={day} className="card bg-white shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-bold text-lg" style={{ color: '#1a1a1a' }}>
              {DAY_LABELS[day] || `📅 ${day}`}
            </h3>
            <div className="divide-y">
              {(grouped[day] || []).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 group"
                  style={{
                    borderLeft: priorityColor(task.priority) ? `4px solid ${priorityColor(task.priority)}` : undefined,
                    paddingLeft: priorityColor(task.priority) ? '12px' : undefined,
                  }}
                >
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
              onClick={() => addItem(day)}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
