'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

interface UserData {
  id: number;
  name: string;
  email: string;
  optimizations_used: number;
  subscription_type: string;
}

export default function AdminPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/');
      } else {
        fetchUsers();
      }
    }
  }, [isLoading, user, token, router]);

  const fetchUsers = async () => {
    setLoadingData(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setErrorMsg('Access denied. You may not be an admin.');
      }
    } catch (e) {
      setErrorMsg('Failed to load users');
    } finally {
      setLoadingData(false);
    }
  };

  const handleResetQuota = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/reset_quota/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchUsers(); // reload
      } else {
        alert('Failed to reset quota');
      }
    } catch (e) {
      alert('Error resetting quota');
    }
  };

  const handleUpdateQuota = async (userId: number, currentQuota: number) => {
    const newQuota = prompt('Enter new optimizations used (0-5):', currentQuota.toString());
    if (newQuota !== null) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/update_quota`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId, new_used_count: parseInt(newQuota) })
        });
        if (res.ok) {
          fetchUsers();
        } else {
          alert('Failed to update quota');
        }
      } catch (e) {
        alert('Error updating quota');
      }
    }
  };

  if (isLoading) return <div className="p-10">Loading auth...</div>;
  if (!user) return <div className="p-10">Redirecting...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to App
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6">
            {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-sm uppercase tracking-wider text-slate-500">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Subscription</th>
                <th className="p-4 font-medium">Used Quota</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingData ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="p-4">{u.id}</td>
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-slate-500">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${u.subscription_type === 'pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {u.subscription_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${u.optimizations_used >= 5 ? 'text-red-500' : 'text-slate-700'}`}>
                        {u.optimizations_used} / 5
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleResetQuota(u.id)}
                        className="text-xs px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => handleUpdateQuota(u.id, u.optimizations_used)}
                        className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
