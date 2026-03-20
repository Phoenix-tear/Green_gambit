'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Create item form
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setUser(decoded);
    } catch {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiFetch('/items');
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Socket.IO listeners
  useEffect(() => {
    const socket = getSocket();

    socket.on('bid:update', (data) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === data.itemId
            ? {
                ...item,
                current_highest_bid: data.amount,
                highest_bidder_name: data.bidderName,
                highest_bidder_id: data.bidderId,
              }
            : item
        )
      );
    });

    socket.on('item:status', (data) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === data.itemId
            ? { ...item, status: data.status }
            : item
        )
      );
    });

    return () => {
      socket.off('bid:update');
      socket.off('item:status');
    };
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/items', {
        method: 'POST',
        body: JSON.stringify({
          name: itemName,
          description: itemDesc,
          starting_price: parseFloat(itemPrice),
        }),
      });
      setItemName('');
      setItemDesc('');
      setItemPrice('');
      showToast('success', 'Item created successfully!');
      fetchItems();
    } catch (err) {
      showToast('error', err.message || 'Failed to create item');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await apiFetch(`/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast('success', `Item ${newStatus === 'active' ? 'opened' : 'closed'} for bidding`);
      fetchItems();
    } catch (err) {
      showToast('error', err.message || 'Failed to update status');
    }
  };

  if (!user) return null;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'closed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">
            Manage items and control auctions
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium border ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border-red-500/30'
          }`}>
            {toast.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Item Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#0d2818]/80 border border-[#1a4731]/60 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-[#0d2818] text-sm font-black">+</span>
                New Item
              </h2>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5">Item Name</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    className="w-full bg-[#1a4731]/40 border border-[#1a4731] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
                    placeholder="e.g., Vintage Watch"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5">Description</label>
                  <textarea
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#1a4731]/40 border border-[#1a4731] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm resize-none"
                    placeholder="Item description..."
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5">Starting Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    required
                    className="w-full bg-[#1a4731]/40 border border-[#1a4731] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
                    placeholder="100.00"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[#0d2818] py-3 rounded-xl font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create Item'}
                </button>
              </form>
            </div>
          </div>

          {/* Items Table */}
          <div className="lg:col-span-2">
            <div className="bg-[#0d2818]/80 border border-[#1a4731]/60 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#1a4731]/60">
                <h2 className="text-lg font-bold text-white">All Items ({items.length})</h2>
              </div>

              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-[#1a4731]/30 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-gray-400">No items yet. Create your first item!</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1a4731]/40">
                  {items.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-[#1a4731]/20 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-white font-semibold truncate">{item.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">
                              Start: <span className="text-gray-300">${item.starting_price?.toFixed(2)}</span>
                            </span>
                            {item.current_highest_bid && (
                              <span className="text-gray-500">
                                Highest: <span className="text-amber-400 font-medium">${item.current_highest_bid?.toFixed(2)}</span>
                              </span>
                            )}
                            {item.highest_bidder_name && (
                              <span className="text-gray-500">
                                by <span className="text-emerald-400">{item.highest_bidder_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {item.status === 'inactive' && (
                            <button
                              onClick={() => handleStatusChange(item.id, 'active')}
                              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all cursor-pointer"
                            >
                              Open Bidding
                            </button>
                          )}
                          {item.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(item.id, 'closed')}
                              className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all cursor-pointer"
                            >
                              Close Bidding
                            </button>
                          )}
                          {item.status === 'closed' && (
                            <span className="text-gray-500 text-sm py-2 px-3">
                              Auction ended
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
