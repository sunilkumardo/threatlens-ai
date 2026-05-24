import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = 'http://localhost:5000/api';
const COLORS = { HIGH: '#ef4444', MEDIUM: '#f97316', LOW: '#eab308', INFO: '#3b82f6', PASS: '#22c55e' };

export default function Dashboard({ token, username, onLogout }) {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner');
  const [statusMsg, setStatusMsg] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/scan/history`, { headers });
      setHistory(res.data.scans.reverse());
    } catch (err) { console.error(err); }
  };

  const startScan = async () => {
    if (!url) return;
    setScanning(true); setCurrentScan(null); setStatusMsg('🔍 Scanning target...');
    try {
      const res = await axios.post(`${API}/scan/start`, { url }, { headers });
      const scanId = res.data.scanId;
      setStatusMsg('🤖 AI is analyzing vulnerabilities...');
      // Poll for result
      const poll = setInterval(async () => {
        try {
          const result = await axios.get(`${API}/scan/result/${scanId}`, { headers });
          const scan = result.data.scan;
          if (scan.status === 'completed' || scan.status === 'failed') {
            clearInterval(poll);
            setCurrentScan(scan);
            setScanning(false);
            setStatusMsg('');
            fetchHistory();
          }
        } catch (e) { clearInterval(poll); setScanning(false); setStatusMsg(''); }
      }, 2000);
    } catch (err) {
      setScanning(false);
      setStatusMsg('❌ Scan failed. Check URL and try again.');
    }
  };

  const getSeverityColor = (sev) => COLORS[sev] || '#64748b';

  const downloadPDF = (scan) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ThreatLens AI', 14, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Vulnerability Scan Report', 14, 28);
  doc.setFontSize(9);
  doc.setTextColor(180, 190, 210);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

  // Target Info
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 42, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Target URL:', 14, 53);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(96, 165, 250);
  doc.text(scan.url, 45, 53);
  doc.setTextColor(220, 230, 245);
  doc.text(`Scan Date: ${new Date(scan.createdAt).toLocaleString()}`, 14, 63);
  doc.text(`Scanned By: ${scan.user}`, 120, 63);

  // Summary Cards
  let y = 80;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Executive Summary', 14, y);
  y += 8;

  const riskColor = scan.aiReport?.risk_level === 'CRITICAL' ? [239, 68, 68] :
    scan.aiReport?.risk_level === 'HIGH' ? [249, 115, 22] :
    scan.aiReport?.risk_level === 'MEDIUM' ? [234, 179, 8] : [34, 197, 94];

  doc.setFillColor(...riskColor);
  doc.roundedRect(14, y, 40, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK LEVEL', 16, y + 6);
  doc.setFontSize(12);
  doc.text(scan.aiReport?.risk_level || 'N/A', 16, y + 14);

  doc.setFillColor(30, 58, 138);
  doc.roundedRect(58, y, 40, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('SECURITY SCORE', 60, y + 6);
  doc.setFontSize(12);
  doc.text(`${scan.aiReport?.overall_score}/100`, 60, y + 14);

  doc.setFillColor(127, 29, 29);
  doc.roundedRect(102, y, 40, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('HIGH ISSUES', 104, y + 6);
  doc.setFontSize(12);
  doc.text(`${scan.summary?.high || 0}`, 104, y + 14);

  doc.setFillColor(120, 53, 15);
  doc.roundedRect(146, y, 40, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('MEDIUM ISSUES', 148, y + 6);
  doc.setFontSize(12);
  doc.text(`${scan.summary?.medium || 0}`, 148, y + 14);

  y += 26;

  // AI Summary text
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(scan.aiReport?.executive_summary || '', pageWidth - 28);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 6 + 8;

  // Quick Wins
  if (scan.aiReport?.quick_wins?.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Quick Wins', 14, y); y += 7;
    scan.aiReport.quick_wins.forEach(win => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(21, 128, 61);
      doc.text(`✓ ${win}`, 14, y); y += 6;
    });
    y += 4;
  }

  // Findings Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('Detailed Findings', 14, y); y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Check', 'Status', 'Severity', 'Detail']],
    body: scan.findings.map(f => [f.check, f.status, f.severity, f.detail]),
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30], fontSize: 8 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // Top Risks
  if (scan.aiReport?.top_risks?.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Top Risks (AI Analysis)', 14, y); y += 8;

    scan.aiReport.top_risks.forEach((risk, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(14, y, pageWidth - 28, 8, 1, 1, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 53, 15);
      doc.text(`${i + 1}. ${risk.risk}`, 16, y + 5.5);
      y += 12;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text('Impact:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const impactLines = doc.splitTextToSize(risk.impact, pageWidth - 42);
      doc.text(impactLines, 30, y);
      y += impactLines.length * 5 + 3;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 128, 61);
      doc.text('Fix:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const fixLines = doc.splitTextToSize(risk.fix, pageWidth - 42);
      doc.text(fixLines, 30, y);
      y += fixLines.length * 5 + 8;
    });
  }

  // Footer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, doc.internal.pageSize.getHeight() - 12, pageWidth, 12, 'F');
  doc.setTextColor(200, 210, 230);
  doc.setFontSize(8);
  doc.text('Generated by ThreatLens AI — AI-Powered Vulnerability Scanner', 14, doc.internal.pageSize.getHeight() - 4);

  doc.save(`ThreatLens-Report-${scan.url.replace(/https?:\/\//, '').replace(/\//g, '-')}-${Date.now()}.pdf`);
};

  const getPieData = (summary) => [
    { name: 'High', value: summary.high || 0 },
    { name: 'Medium', value: summary.medium || 0 },
    { name: 'Low', value: summary.low || 0 },
    { name: 'Passed', value: summary.passed || 0 },
  ].filter(d => d.value > 0);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo}>🔐 ThreatLens</div>
        <nav style={styles.nav}>
          {['scanner', 'history'].map(tab => (
            <div key={tab} style={{ ...styles.navItem, ...(activeTab === tab ? styles.navActive : {}) }} onClick={() => setActiveTab(tab)}>
              {tab === 'scanner' ? '🎯 Scanner' : '📋 History'}
            </div>
          ))}
        </nav>
        <div style={styles.sidebarBottom}>
          <p style={styles.userLabel}>👤 {username}</p>
          <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>
        {activeTab === 'scanner' && (
          <div>
            <h2 style={styles.pageTitle}>🎯 Vulnerability Scanner</h2>
            <p style={styles.pageSubtitle}>Enter any URL to scan for OWASP security vulnerabilities</p>

            {/* Scan Input */}
            <div style={styles.scanBox}>
              <input
                style={styles.scanInput}
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !scanning && startScan()}
                disabled={scanning}
              />
              <button style={styles.scanBtn} onClick={startScan} disabled={scanning}>
                {scanning ? '⏳ Scanning...' : '🚀 Scan Now'}
              </button>
            </div>

            {statusMsg && <div style={styles.statusMsg}>{statusMsg}</div>}

            {/* Scan Results */}
            {currentScan && currentScan.status === 'completed' && (
              <div>
                {/* Action Buttons */}
<div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
  <button
    style={{ ...styles.scanBtn, background: 'linear-gradient(135deg, #059669, #047857)', padding: '10px 20px', fontSize: '13px' }}
    onClick={() => downloadPDF(currentScan)}>
    📄 Download PDF Report
  </button>
  <button
    style={{ ...styles.scanBtn, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', padding: '10px 20px', fontSize: '13px' }}
    onClick={() => {
      const shareText = `ThreatLens AI Scan Report\nURL: ${currentScan.url}\nRisk: ${currentScan.aiReport?.risk_level}\nScore: ${currentScan.aiReport?.overall_score}/100\nHigh Issues: ${currentScan.summary?.high}`;
      navigator.clipboard.writeText(shareText);
      alert('Report summary copied to clipboard! Share it anywhere.');
    }}>
    🔗 Share Report
  </button>
  <button
    style={{ ...styles.scanBtn, background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '10px 20px', fontSize: '13px' }}
    onClick={() => setCurrentScan(null)}>
    🗑️ Clear Scan
  </button>
</div>
                {/* Summary Cards */}
                <div style={styles.cards}>
                  {[
                    { label: 'Risk Level', value: currentScan.aiReport?.risk_level || 'N/A', color: currentScan.aiReport?.risk_level === 'HIGH' ? '#ef4444' : '#f97316' },
                    { label: 'Security Score', value: `${currentScan.aiReport?.overall_score}/100`, color: '#3b82f6' },
                    { label: 'High Issues', value: currentScan.summary.high, color: '#ef4444' },
                    { label: 'Medium Issues', value: currentScan.summary.medium, color: '#f97316' },
                  ].map((card, i) => (
                    <div key={i} style={styles.card}>
                      <p style={styles.cardLabel}>{card.label}</p>
                      <p style={{ ...styles.cardValue, color: card.color }}>{card.value}</p>
                    </div>
                  ))}
                </div>

                <div style={styles.twoCol}>
                  {/* AI Report */}
                  <div style={styles.panel}>
                    <h3 style={styles.panelTitle}>🤖 AI Security Report</h3>
                    <p style={styles.aiSummary}>{currentScan.aiReport?.executive_summary}</p>
                    <h4 style={styles.subTitle}>⚡ Quick Wins</h4>
                    {currentScan.aiReport?.quick_wins?.map((win, i) => (
                      <div key={i} style={styles.quickWin}>✅ {win}</div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div style={styles.panel}>
                    <h3 style={styles.panelTitle}>📊 Severity Breakdown</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={getPieData(currentScan.summary)} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {getPieData(currentScan.summary).map((entry, i) => (
                            <Cell key={i} fill={Object.values(COLORS)[i]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Findings Table */}
                <div style={styles.panel}>
                  <h3 style={styles.panelTitle}>🔍 Detailed Findings</h3>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {['Check', 'Status', 'Severity', 'Detail'].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentScan.findings.map((f, i) => (
                        <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                          <td style={styles.td}>{f.check}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, background: f.status === 'PASS' ? '#166534' : '#7f1d1d', color: f.status === 'PASS' ? '#22c55e' : '#ef4444' }}>
                              {f.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: getSeverityColor(f.severity), fontWeight: '600' }}>{f.severity}</span>
                          </td>
                          <td style={styles.td}>{f.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top Risks */}
                {currentScan.aiReport?.top_risks?.length > 0 && (
                  <div style={styles.panel}>
                    <h3 style={styles.panelTitle}>🚨 Top Risks (AI Analysis)</h3>
                    {currentScan.aiReport.top_risks.map((risk, i) => (
                      <div key={i} style={styles.riskCard}>
                        <h4 style={styles.riskTitle}>⚠️ {risk.risk}</h4>
                        <p style={styles.riskText}><strong style={{ color: '#ef4444' }}>Impact:</strong> {risk.impact}</p>
                        <p style={styles.riskText}><strong style={{ color: '#22c55e' }}>Fix:</strong> {risk.fix}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 style={styles.pageTitle}>📋 Scan History</h2>
            <p style={styles.pageSubtitle}>All previous vulnerability scans</p>
            {history.length === 0 ? (
              <div style={styles.empty}>No scans yet. Go to Scanner to start!</div>
            ) : (
              history.map((scan, i) => (
                <div key={i} style={styles.historyCard} onClick={() => { setCurrentScan(scan); setActiveTab('scanner'); }}>
                  <div>
                    <p style={styles.historyUrl}>{scan.url}</p>
                    <p style={styles.historyDate}>{new Date(scan.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={styles.historyRight}>
                    <span style={{ color: '#ef4444' }}>HIGH: {scan.summary?.high || 0}</span>
                    <span style={{ color: '#f97316', marginLeft: '12px' }}>MED: {scan.summary?.medium || 0}</span>
                    <span style={{ ...styles.badge, marginLeft: '12px', background: scan.status === 'completed' ? '#166534' : '#7f1d1d', color: scan.status === 'completed' ? '#22c55e' : '#ef4444' }}>
                      {scan.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#0a0e1a' },
  sidebar: { width: '220px', background: '#1a1f35', borderRight: '1px solid #2d3561', display: 'flex', flexDirection: 'column', padding: '24px 0', position: 'fixed', height: '100vh' },
  sidebarLogo: { fontSize: '18px', fontWeight: '700', color: '#3b82f6', padding: '0 24px 24px', borderBottom: '1px solid #2d3561' },
  nav: { flex: 1, padding: '16px 0' },
  navItem: { padding: '12px 24px', cursor: 'pointer', color: '#64748b', fontSize: '14px', transition: 'all 0.2s' },
  navActive: { background: '#0a0e1a', color: '#3b82f6', borderRight: '3px solid #3b82f6' },
  sidebarBottom: { padding: '16px 24px', borderTop: '1px solid #2d3561' },
  userLabel: { color: '#64748b', fontSize: '13px', marginBottom: '8px' },
  logoutBtn: { background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '100%' },
  main: { marginLeft: '220px', flex: 1, padding: '32px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#e2e8f0', marginBottom: '8px' },
  pageSubtitle: { color: '#64748b', marginBottom: '24px', fontSize: '14px' },
  scanBox: { display: 'flex', gap: '12px', marginBottom: '16px' },
  scanInput: { flex: 1, padding: '14px 16px', borderRadius: '8px', border: '1px solid #2d3561', background: '#1a1f35', color: '#e2e8f0', fontSize: '15px', outline: 'none' },
  scanBtn: { padding: '14px 28px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  statusMsg: { background: '#1a1f35', border: '1px solid #2d3561', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#93c5fd', fontSize: '14px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  card: { background: '#1a1f35', border: '1px solid #2d3561', borderRadius: '12px', padding: '20px' },
  cardLabel: { color: '#64748b', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' },
  cardValue: { fontSize: '28px', fontWeight: '700' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  panel: { background: '#1a1f35', border: '1px solid #2d3561', borderRadius: '12px', padding: '24px', marginBottom: '16px' },
  panelTitle: { fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' },
  aiSummary: { color: '#94a3b8', lineHeight: '1.6', marginBottom: '16px', fontSize: '14px' },
  subTitle: { color: '#e2e8f0', fontSize: '14px', fontWeight: '600', marginBottom: '8px' },
  quickWin: { color: '#22c55e', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #0f172a' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', padding: '8px 12px', borderBottom: '1px solid #2d3561' },
  td: { padding: '10px 12px', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #0f172a' },
  trEven: { background: '#0f172a' },
  badge: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
  riskCard: { background: '#0a0e1a', borderRadius: '8px', padding: '16px', marginBottom: '12px', border: '1px solid #2d3561' },
  riskTitle: { color: '#fbbf24', fontSize: '14px', fontWeight: '600', marginBottom: '8px' },
  riskText: { color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', marginBottom: '4px' },
  historyCard: { background: '#1a1f35', border: '1px solid #2d3561', borderRadius: '10px', padding: '16px 20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  historyUrl: { color: '#e2e8f0', fontWeight: '600', fontSize: '14px', marginBottom: '4px' },
  historyDate: { color: '#64748b', fontSize: '12px' },
  historyRight: { display: 'flex', alignItems: 'center', fontSize: '13px' },
  empty: { color: '#64748b', textAlign: 'center', padding: '48px', background: '#1a1f35', borderRadius: '12px' }
};