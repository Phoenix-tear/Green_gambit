const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

let io;
router.setIo = (socketIo) => { io = socketIo; };

// POST /api/bids — auth required
router.post('/', authMiddleware, (req, res) => {
  try {
    const { item_id, amount } = req.body;
    const userId = req.user.id;

    if (!item_id || amount == null) {
      return res.status(400).json({ error: 'item_id and amount are required' });
    }

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.status !== 'active') {
      return res.status(400).json({ error: 'Bidding is not active for this item' });
    }

    const minimumBid = item.current_highest_bid || item.starting_price;
    if (amount <= minimumBid) {
      return res.status(400).json({
        error: `Bid must be higher than ${minimumBid}`,
        current_highest: minimumBid
      });
    }

    // Insert bid
    db.prepare('INSERT INTO bids (item_id, user_id, amount) VALUES (?, ?, ?)').run(
      item_id,
      userId,
      amount
    );

    // Update item
    db.prepare(
      'UPDATE items SET current_highest_bid = ?, highest_bidder_id = ? WHERE id = ?'
    ).run(amount, userId, item_id);

    const bidderName = req.user.name;

    // Emit bid update to all clients
    if (io) {
      io.emit('bid:update', {
        itemId: item_id,
        amount,
        bidderName,
        bidderId: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: 'Bid placed successfully',
      bid: { item_id, amount, bidderName, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Place bid error:', err);
    res.status(500).json({ error: 'Failed to place bid' });
  }
});

// GET /api/bids/:item_id
router.get('/:item_id', (req, res) => {
  try {
    const bids = db.prepare(`
      SELECT bids.*, users.name AS bidder_name
      FROM bids
      JOIN users ON bids.user_id = users.id
      WHERE bids.item_id = ?
      ORDER BY bids.placed_at DESC
    `).all(req.params.item_id);

    res.json(bids);
  } catch (err) {
    console.error('Get bids error:', err);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

module.exports = router;
