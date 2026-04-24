import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';

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

interface MoviesViewProps {
  tasks: Task[];
  onRefresh: () => void;
}

function parseGoal(notes: string | null): string {
  if (!notes) return '';
  const lines = notes.split('\n');
  for (const line of lines) {
    if (line.includes('🎯') && line.toUpperCase().includes('GOAL')) {
      // Extract content after "GOAL:" or "GOAL -" etc
      const match = line.match(/GOAL\s*[:\-–—]\s*(.*)/i);
      if (match) return match[1].trim();
      // fallback: everything after the emoji
      const afterEmoji = line.split('🎯')[1];
      if (afterEmoji) {
        const cleaned = afterEmoji.replace(/GOAL/i, '').replace(/^[\s:\-–—]+/, '').trim();
        return cleaned || afterEmoji.trim();
      }
    }
  }
  return '';
}

export default function MoviesView({ tasks, onRefresh }: MoviesViewProps) {
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editingOwner, setEditingOwner] = useState<number | null>(null);
  const [editOwnerValue, setEditOwnerValue] = useState('');
  const [editingSummary, setEditingSummary] = useState<number | null>(null);
  const [editSummaryValue, setEditSummaryValue] = useState('');
  const [editingComments, setEditingComments] = useState<number | null>(null);
  const [editCommentsValue, setEditCommentsValue] = useState('');
  const [expandedBriefs, setExpandedBriefs] = useState<Set<number>>(new Set());

  const movieTasks = tasks
    .filter((t) => t.initiative_number === 7)
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  const toggleDone = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'not_started' : 'done';
    await supabase.from('wt_tasks').update({ status: newStatus }).eq('id', task.id);
    onRefresh();
  };

  const deleteTask = async (id: number) => {
    await supabase.from('wt_tasks').delete().eq('id', id);
    onRefresh();
  };

  // Title editing
  const startEditTitle = (task: Task) => {
    setEditingTitle(task.id);
    setEditTitleValue(task.title);
  };
  const saveTitle = async (id: number) => {
    if (editTitleValue.trim()) {
      await supabase.from('wt_tasks').update({ title: editTitleValue.trim() }).eq('id', id);
    }
    setEditingTitle(null);
    onRefresh();
  };

  // Owner editing
  const startEditOwner = (task: Task) => {
    setEditingOwner(task.id);
    setEditOwnerValue(task.owner || '');
  };
  const saveOwner = async (id: number) => {
    await supabase.from('wt_tasks').update({ owner: editOwnerValue.trim() || null }).eq('id', id);
    setEditingOwner(null);
    onRefresh();
  };

  // Summary editing (updates the 🎯 GOAL line in notes)
  const startEditSummary = (task: Task) => {
    setEditingSummary(task.id);
    setEditSummaryValue(parseGoal(task.notes));
  };
  const saveSummary = async (id: number, currentNotes: string | null) => {
    const newGoal = editSummaryValue.trim();
    let newNotes = currentNotes || '';
    const goalLineRegex = /.*🎯.*GOAL.*/i;
    if (goalLineRegex.test(newNotes)) {
      newNotes = newNotes.replace(goalLineRegex, `🎯 GOAL: ${newGoal}`);
    } else {
      newNotes = `🎯 GOAL: ${newGoal}\n${newNotes}`;
    }
    await supabase.from('wt_tasks').update({ notes: newNotes }).eq('id', id);
    setEditingSummary(null);
    onRefresh();
  };

  // Comments editing
  const startEditComments = (task: Task) => {
    setEditingComments(task.id);
    setEditCommentsValue(task.comments || '');
  };
  const saveComments = async (id: number) => {
    await supabase.from('wt_tasks').update({ comments: editCommentsValue.trim() || null }).eq('id', id);
    setEditingComments(null);
    onRefresh();
  };

  const toggleBrief = (id: number) => {
    setExpandedBriefs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addMovie = async () => {
    const maxSort = movieTasks.reduce((max, t) => Math.max(max, t.sort_order ?? 0), 0);
    await supabase.from('wt_tasks').insert({
      title: 'New Movie Test',
      initiative_number: 7,
      status: 'not_started',
      sort_order: maxSort + 1,
      notes: '🎯 GOAL: ',
    }).select();
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {movieTasks.map((task) => {
        const goal = parseGoal(task.notes);
        const isBriefOpen = expandedBriefs.has(task.id);

        return (
          <div
            key={task.id}
            className="card bg-white shadow-sm"
            style={{ border: '1px solid #e5e7eb' }}
          >
            <div className="card-body p-5">
              {/* Header row: checkbox + title + owner + delete */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mt-1"
                  checked={task.status === 'done'}
                  onChange={() => toggleDone(task)}
                  style={{ accentColor: '#FF6B35' }}
                />
                <div className="flex-1">
                  {editingTitle === task.id ? (
                    <input
                      type="text"
                      className="input input-sm input-bordered w-full font-bold"
                      style={{ color: '#000', fontSize: '16px' }}
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onBlur={() => saveTitle(task.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveTitle(task.id)}
                      autoFocus
                    />
                  ) : (
                    <h3
                      className={`font-bold cursor-pointer ${task.status === 'done' ? 'line-through opacity-50' : ''}`}
                      style={{ color: '#000', fontSize: '16px' }}
                      onClick={() => startEditTitle(task)}
                    >
                      {task.title}
                    </h3>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingOwner === task.id ? (
                    <input
                      type="text"
                      className="input input-xs input-bordered w-24"
                      style={{ color: '#000' }}
                      value={editOwnerValue}
                      onChange={(e) => setEditOwnerValue(e.target.value)}
                      onBlur={() => saveOwner(task.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveOwner(task.id)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="badge badge-sm cursor-pointer text-white"
                      style={{ backgroundColor: '#FF6B35' }}
                      onClick={() => startEditOwner(task)}
                    >
                      {task.owner || 'unassigned'}
                    </span>
                  )}
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 size={14} style={{ color: '#999' }} />
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              <div
                className="mt-3 p-3 rounded"
                style={{ borderLeft: '4px solid #3b82f6', backgroundColor: '#f8fafc' }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: '#3b82f6' }}>
                  Executive Summary
                </p>
                {editingSummary === task.id ? (
                  <textarea
                    className="textarea textarea-bordered w-full text-sm"
                    style={{ color: '#000' }}
                    value={editSummaryValue}
                    onChange={(e) => setEditSummaryValue(e.target.value)}
                    onBlur={() => saveSummary(task.id, task.notes)}
                    rows={2}
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm cursor-pointer"
                    style={{ color: '#000' }}
                    onClick={() => startEditSummary(task)}
                  >
                    {goal || <span style={{ color: '#999' }}>Click to add executive summary...</span>}
                  </p>
                )}
              </div>

              {/* Creative Brief toggle */}
              <div className="mt-2">
                <button
                  className="btn btn-ghost btn-sm px-1 gap-1"
                  style={{ color: '#666' }}
                  onClick={() => toggleBrief(task.id)}
                >
                  {isBriefOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="text-xs font-semibold">Creative Brief</span>
                </button>
                {isBriefOpen && (
                  <div
                    className="p-3 rounded mt-1 text-sm whitespace-pre-wrap"
                    style={{ backgroundColor: '#f9fafb', color: '#000', border: '1px solid #e5e7eb' }}
                  >
                    {task.notes || <span style={{ color: '#999' }}>No creative brief yet.</span>}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1" style={{ color: '#666' }}>
                  Comments
                </p>
                {editingComments === task.id ? (
                  <textarea
                    className="textarea textarea-bordered w-full text-sm"
                    style={{ color: '#000' }}
                    value={editCommentsValue}
                    onChange={(e) => setEditCommentsValue(e.target.value)}
                    onBlur={() => saveComments(task.id)}
                    rows={2}
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm cursor-pointer"
                    style={{ color: '#000' }}
                    onClick={() => startEditComments(task)}
                  >
                    {task.comments || <span style={{ color: '#999' }}>no comments yet</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <button
        className="btn text-white"
        style={{ backgroundColor: '#FF6B35', borderColor: '#FF6B35' }}
        onClick={addMovie}
      >
        <Plus size={16} /> Add Movie Test
      </button>

      {movieTasks.length === 0 && (
        <div className="text-center py-12" style={{ color: '#999' }}>
          No movie tests found. Click "Add Movie Test" to create one.
        </div>
      )}
    </div>
  );
}
