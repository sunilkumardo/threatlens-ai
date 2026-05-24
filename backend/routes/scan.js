const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const verifyToken = require('../middleware/auth');
const router = express.Router();

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
      status: 'scanning',
      createdAt: new Date().toISOString(),
      user: req.user.username,
      findings: [],
      summary: {}
    };
    scanHistory.push(scan);

    // Run Python scanner
    const scannerPath = path.join(__dirname, '..', 'scanner.py');
    const python = spawn('python', [scannerPath, url]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      try {
        // Get last JSON line from output
        const lines = output.trim().split('\n');
        const jsonLine = lines[lines.length - 1];
        const result = JSON.parse(jsonLine);

        const scanIndex = scanHistory.findIndex(s => s.id === scanId);
        if (result.error) {
          scanHistory[scanIndex].status = 'failed';
          scanHistory[scanIndex].error = result.error;
        } else {
          scanHistory[scanIndex].status = 'completed';
          scanHistory[scanIndex].findings = result.findings;
          scanHistory[scanIndex].summary = result.summary;
          scanHistory[scanIndex].completedAt = new Date().toISOString();
        }
      } catch (e) {
        const scanIndex = scanHistory.findIndex(s => s.id === scanId);
        scanHistory[scanIndex].status = 'failed';
        scanHistory[scanIndex].error = 'Scanner output parse error';
      }
    });

    res.json({ message: 'Scan started', scanId, scan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

// Get scan result by ID
router.get('/result/:id', verifyToken, (req, res) => {
  const scan = scanHistory.find(s => s.id === req.params.id && s.user === req.user.username);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  res.json({ scan });
});

// Get scan history
router.get('/history', verifyToken, (req, res) => {
  const userScans = scanHistory.filter(s => s.user === req.user.username);
  res.json({ scans: userScans });
});

router.get('/ping', (req, res) => {
  res.json({ message: 'Scan service is live' });
});

module.exports = router;