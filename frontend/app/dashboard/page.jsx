'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import ItemCard from '@/components/ItemCard';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, closed

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
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
                highest_bidder_id: data.bidderId,
                highest_bidder_name: data.bidderName,
              }
            : item
        )
      );
    });

    socket.on('item:status', (data) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === data.itemId
            ? {
                ...item,
                status: data.status,
                highest_bidder_name: data.highest_bidder_name,
                current_highest_bid: data.current_highest_bid,
              }
            : item
        )
      );
    });

    return () => {
      socket.off('bid:update');
      socket.off('item:status');
    };
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const activeCount = items.filter((i) => i.status === 'active').length;

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bidding Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, <span className="text-emerald-400 font-medium">{user.name}</span>!
            {activeCount > 0 && (
              <span className="ml-2 text-amber-400">
                — {activeCount} active auction{activeCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All Items' },
            { key: 'active', label: 'Live Auctions' },
            { key: 'closed', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-[#0d2818]/60 text-gray-400 border border-[#1a4731]/60 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#0d2818]/80 border border-[#1a4731]/60 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-[#1a4731]/40 rounded-lg mb-4 w-3/4"></div>
                <div className="h-4 bg-[#1a4731]/40 rounded-lg mb-2 w-full"></div>
                <div className="h-4 bg-[#1a4731]/40 rounded-lg mb-4 w-1/2"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-[#1a4731]/40 rounded-xl"></div>
                  <div className="h-16 bg-[#1a4731]/40 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">No items found</h3>
            <p className="text-gray-500">
              {filter === 'active'
                ? 'No live auctions right now. Check back soon!'
                : 'No items available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currentUserId={user.id}
                onBidPlaced={fetchItems}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
