import { useState } from 'react';

interface PasswordGateProps {
  onSuccess: () => void;
}

export default function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'warsaw2026') {
      localStorage.setItem('wt_auth', 'true');
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
      <div className="card bg-white shadow-xl w-96">
        <div className="card-body items-center text-center">
          <h2 className="text-3xl mb-2">🍿</h2>
          <h2 className="card-title" style={{ color: '#1a1a1a' }}>Warsaw Offsite Tracker</h2>
          <p className="text-sm" style={{ color: '#666' }}>Enter the password to continue</p>
          <form onSubmit={handleSubmit} className="w-full mt-4">
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full"
              style={{ color: '#000' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-error text-sm mt-2">Incorrect password. Try again.</p>
            )}
            <button
              type="submit"
              className="btn w-full mt-4 text-white"
              style={{ backgroundColor: '#FF6B35', borderColor: '#FF6B35' }}
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
