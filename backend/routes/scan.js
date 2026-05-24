const express = require('express');
const { v4: uuidv4 } = require('uuid');
const verifyToken = require('../middleware/auth');
const router = express.Router();

// In-memory scan history
const scanHistory = [];

// Start a scan
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url)
      return res.status(400).json({ error: 'URL is required' });

    const scanId = uuidv4();
    const scan = {
      id: scanId,
      url,
      status: 'queued',
      createdAt: new Date().toISOString(),
      user: req.user.username
    };

    scanHistory.push(scan);
    res.json({ message: 'Scan queued', scanId, scan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

// Get scan history
router.get('/history', verifyToken, (req, res) => {
  const userScans = scanHistory.filter(s => s.user === req.user.username);
  res.json({ scans: userScans });
});

// Health
router.get('/ping', (req, res) => {
  res.json({ message: 'Scan service is live' });
});

module.exports = router;