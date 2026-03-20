const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// We'll set this from server.js
let io;
router.setIo = (socketIo) => { io = socketIo; };

// GET /api/items — public
router.get('/', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT items.*, users.name AS highest_bidder_name
      FROM items
      LEFT JOIN users ON items.highest_bidder_id = users.id
      ORDER BY items.created_at DESC
    `).all();
    res.json(items);
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/items — admin only
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, description, starting_price } = req.body;
    if (!name || starting_price == null) {
      return res.status(400).json({ error: 'Name and starting_price are required' });
    }

    const result = db.prepare(
      'INSERT INTO items (name, description, starting_price) VALUES (?, ?, ?)'
    ).run(name, description || '', starting_price);

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PATCH /api/items/:id/status — admin only
router.patch('/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'closed', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active, closed, or inactive' });
    }

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.prepare('UPDATE items SET status = ? WHERE id = ?').run(status, req.params.id);

    // Get updated item with bidder name
    const updatedItem = db.prepare(`
      SELECT items.*, users.name AS highest_bidder_name
      FROM items
      LEFT JOIN users ON items.highest_bidder_id = users.id
      WHERE items.id = ?
    `).get(req.params.id);

    // Emit item status change to all clients
    if (io) {
      io.emit('item:status', {
        itemId: updatedItem.id,
        status: updatedItem.status,
        highest_bidder_name: updatedItem.highest_bidder_name,
        current_highest_bid: updatedItem.current_highest_bid
      });
    }

    res.json(updatedItem);
  } catch (err) {
    console.error('Update item status error:', err);
    res.status(500).json({ error: 'Failed to update item status' });
  }
});

module.exports = router;
