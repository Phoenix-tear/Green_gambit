'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import BidHistory from './BidHistory';

export default function ItemCard({ item, currentUserId, onBidPlaced }) {
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const isLeading = item.highest_bidder_id === currentUserId;
  const currentBid = item.current_highest_bid || item.starting_price;

  const handleBid = async (e) => {
    e.preventDefault();
    if (!bidAmount || parseFloat(bidAmount) <= currentBid) {
      setToast({ type: 'error', message: `Bid must be higher than $${currentBid.toFixed(2)}` });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/bids', {
        method: 'POST',
        body: JSON.stringify({ item_id: item.id, amount: parseFloat(bidAmount) }),
      });
      setToast({ type: 'success', message: 'Your bid was placed!' });
      setBidAmount('');
      if (onBidPlaced) onBidPlaced();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Outbid! Someone bid higher.' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            LIVE
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            CLOSED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
            INACTIVE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0d2818]/80 border border-[#1a4731]/60 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm group">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
            {item.name}
          </h3>
          {getStatusBadge()}
        </div>
        {item.description && (
          <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.description}</p>
        )}

        {/* Price Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#1a4731]/40 rounded-xl p-3">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Starting Price</p>
            <p className="text-white font-semibold">${item.starting_price?.toFixed(2)}</p>
          </div>
          <div className="bg-[#1a4731]/40 rounded-xl p-3">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Current Bid</p>
            <p className="text-amber-400 font-bold text-lg">
              ${currentBid.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Leading Badge */}
        {item.status === 'active' && isLeading && (
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl px-4 py-2 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-amber-300 text-sm font-semibold">You are leading!</span>
          </div>
        )}

        {/* Winner Display */}
        {item.status === 'closed' && item.highest_bidder_name && (
          <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-emerald-300 text-sm font-semibold">
              🏆 Winner: {item.highest_bidder_name}
            </p>
            <p className="text-emerald-400/70 text-xs mt-1">
              Winning bid: ${item.current_highest_bid?.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Bid Form */}
      {item.status === 'active' && (
        <div className="px-5 pb-4">
          <form onSubmit={handleBid} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min={currentBid + 0.01}
                placeholder={`Min: ${(currentBid + 0.01).toFixed(2)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full bg-[#1a4731]/60 border border-[#1a4731] rounded-xl pl-7 pr-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-[#0d2818] px-5 py-2.5 rounded-xl font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {loading ? '...' : 'Place Bid'}
            </button>
          </form>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`mx-5 mb-4 px-4 py-2 rounded-xl text-sm font-medium animate-pulse ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Bid History Toggle */}
      {item.status === 'active' && (
        <div className="border-t border-[#1a4731]/60">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-5 py-3 text-gray-500 hover:text-amber-400 text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            {showHistory ? '▲ Hide' : '▼ Show'} Bid History
          </button>
          {showHistory && <BidHistory itemId={item.id} />}
        </div>
      )}
    </div>
  );
}
