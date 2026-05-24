const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const verifyToken = require('../middleware/auth');
const { analyzeWithAI } = require('../utils/gemini');
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
      summary: {},
      aiReport: null
    };
    scanHistory.push(scan);

    res.json({ message: 'Scan started', scanId });

    // Run Python scanner in background
    const scannerPath = path.join(__dirname, '..', 'scanner.py');
    const python = spawn('python', [scannerPath, url]);

    let output = '';

    python.stdout.on('data', (data) => { output += data.toString(); });

    python.on('close', async (code) => {
      const scanIndex = scanHistory.findIndex(s => s.id === scanId);
      try {
        const lines = output.trim().split('\n');
        const jsonLine = lines[lines.length - 1];
        const result = JSON.parse(jsonLine);

        if (result.error) {
          scanHistory[scanIndex].status = 'failed';
          scanHistory[scanIndex].error = result.error;
          return;
        }

        scanHistory[scanIndex].findings = result.findings;
        scanHistory[scanIndex].summary = result.summary;
        scanHistory[scanIndex].status = 'analyzing';

        // Send to Gemini AI
        console.log(`[*] Sending scan results to Gemini AI for ${url}...`);
        const aiReport = await analyzeWithAI(result);
        scanHistory[scanIndex].aiReport = aiReport;
        scanHistory[scanIndex].status = 'completed';
        scanHistory[scanIndex].completedAt = new Date().toISOString();
        console.log(`[✓] AI analysis complete for ${url} - Risk: ${aiReport.risk_level}`);

      } catch (e) {
        scanHistory[scanIndex].status = 'failed';
        scanHistory[scanIndex].error = 'Processing error: ' + e.message;
      }
    });

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