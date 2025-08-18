import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'USER'|'RECRUITER'>('USER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({ email, password, name, role });
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Register</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <form onSubmit={onSubmit}>
        <label className="block mb-2">Full name</label>
        <input className="w-full border p-2 mb-3" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block mb-2">Email</label>
        <input className="w-full border p-2 mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block mb-2">Password</label>
        <input type="password" className="w-full border p-2 mb-3" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="block mb-2">I am a</label>
        <select className="w-full border p-2 mb-4" value={role} onChange={(e) => setRole(e.target.value as 'USER' | 'RECRUITER')}>
          <option value="USER">Applicant</option>
          <option value="RECRUITER">Recruiter</option>
        </select>
        <button className="px-4 py-2 bg-green-600 text-white rounded" disabled={busy}>
          {busy ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
