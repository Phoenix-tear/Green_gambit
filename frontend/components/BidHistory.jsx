'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function BidHistory({ itemId }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, [itemId]);

  const fetchBids = async () => {
    try {
      const data = await apiFetch(`/bids/${itemId}`);
      setBids(data);
    } catch (err) {
      console.error('Failed to fetch bids:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-5 pb-4">
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-[#1a4731]/40 rounded-lg"></div>
          <div className="h-8 bg-[#1a4731]/40 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="px-5 pb-4">
        <p className="text-gray-500 text-sm text-center py-2">No bids yet</p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-4 max-h-48 overflow-y-auto scrollbar-thin">
      <div className="space-y-1.5">
        {bids.map((bid, index) => (
          <div
            key={bid.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
              index === 0
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-[#1a4731]/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0
                  ? 'bg-amber-500/30 text-amber-300'
                  : 'bg-[#1a4731] text-gray-400'
              }`}>
                {bid.bidder_name?.[0]?.toUpperCase() || '?'}
              </div>
              <span className={index === 0 ? 'text-amber-300 font-medium' : 'text-gray-400'}>
                {bid.bidder_name}
              </span>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${index === 0 ? 'text-amber-400' : 'text-gray-300'}`}>
                ${bid.amount?.toFixed(2)}
              </span>
              <p className="text-gray-600 text-xs">
                {new Date(bid.placed_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
