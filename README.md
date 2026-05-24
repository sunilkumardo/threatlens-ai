# ThreatLens AI 🔐

> An AI-powered web vulnerability scanner with real-time security dashboard, automated CI/CD, and Gemini AI analysis.

![CI/CD](https://github.com/sunilkumardo/threatlens-ai/actions/workflows/ci.yml/badge.svg)
![Security](https://img.shields.io/badge/Security-CodeQL%20Enabled-green)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![Node](https://img.shields.io/badge/Node.js-22-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 What is ThreatLens AI?

ThreatLens AI is a full-stack security tool that scans any public website for OWASP-based vulnerabilities and generates an AI-powered risk report — similar to enterprise tools like Qualys, Tenable, and Burp Suite, but built entirely with free tools.

---

## ✨ Features

- 🔍 **OWASP Vulnerability Scanner** — checks security headers, HTTPS, cookies, open redirects, server disclosure
- 🤖 **Gemini AI Analysis** — generates plain-English risk reports with Impact + Fix for each vulnerability
- 📊 **Real-time Dashboard** — severity charts, scan history, color-coded findings table
- 📄 **PDF Report Export** — download and share professional security reports
- 🔐 **JWT Authentication** — secure login/register with bcrypt password hashing
- 🛡️ **Rate Limiting + Helmet** — production-grade API security
- ⚙️ **CI/CD Pipeline** — automated testing, security audit, build verification on every push
- 🔎 **GitHub Advanced Security** — CodeQL scanning, Dependabot, secret scanning enabled

---

## 🏗️ Architecture

| Layer | Component | Details |
|-------|-----------|---------|
| 🖥️ Frontend | React.js | Dashboard, Scanner UI, Charts, PDF Export |
| ⚙️ Backend | Node.js + Express | REST API, JWT Auth, Rate Limiting, Helmet |
| 🐍 Scanner | Python 3.12 | OWASP checks, Header analysis, Redirect detection |
| 🤖 AI Engine | Google Gemini API | Risk analysis, Executive summary, Fix recommendations |
| 🔄 CI/CD | GitHub Actions | Auto test, build, security audit on every push |
| 🔐 Security | GitHub GHAS | CodeQL, Dependabot, Secret scanning, Branch protection |

**Flow:** `User enters URL` → `React sends to Node API` → `Python scans target` → `Gemini AI analyzes` → `Dashboard shows report + PDF`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Recharts, jsPDF |
| Backend | Node.js, Express.js, JWT, Helmet |
| Scanner | Python 3.12, Requests |
| AI | Google Gemini API (Free) |
| CI/CD | GitHub Actions |
| Security | CodeQL, Dependabot, Secret Scanning |

---

## 🔐 Security Features Implemented

- ✅ JWT Authentication with 24h token expiry
- ✅ bcrypt password hashing (salt rounds: 10)
- ✅ Helmet.js security headers on all responses
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Input validation on all endpoints
- ✅ CodeQL scanning on every PR (fixed URL sanitization finding)
- ✅ Dependabot dependency vulnerability alerts
- ✅ GitHub secret scanning + push protection
- ✅ Branch protection rules on main

---

## ⚙️ Setup & Run Locally

### Prerequisites
- Node.js 18+
- Python 3.12+
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Backend
```bash
cd backend
npm install
# Create .env file:
# PORT=5000
# JWT_SECRET=your_secret
# GEMINI_API_KEY=your_gemini_key
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Scanner (standalone test)
```bash
cd backend
python scanner.py https://example.com
```

---

## 📸 Screenshots

> Dashboard with AI Security Report and Severity Chart

> PDF Export — Professional vulnerability report

> GitHub Actions CI/CD — All checks passing

> GitHub Security — CodeQL + Dependabot alerts

---

## 🧪 OWASP Checks Performed

| Check | Severity |
|-------|----------|
| HTTPS Enabled | HIGH |
| X-Frame-Options Header | HIGH |
| Content-Security-Policy | HIGH |
| Strict-Transport-Security | HIGH |
| X-Content-Type-Options | MEDIUM |
| X-XSS-Protection | MEDIUM |
| Referrer-Policy | LOW |
| Server Version Disclosure | LOW |
| Open Redirect | HIGH |
| Cookie Security Flags | MEDIUM |

---

## 📄 Sample AI Report Output

```json
{
  "risk_level": "HIGH",
  "executive_summary": "The website has several critical security misconfigurations...",
  "top_risks": [
    {
      "risk": "Missing Content-Security-Policy",
      "impact": "Vulnerable to XSS attacks",
      "fix": "Add Content-Security-Policy header"
    }
  ],
  "quick_wins": ["Enable HTTPS", "Add X-Frame-Options"],
  "overall_score": 35
}
```

---

## 👨‍💻 Author

- GitHub: [@sunilkumardo](https://github.com/sunilkumardo)
- LinkedIn: [Sunil Kumar D O](https://linkedin.com/in/sunilkumardo)
- Portfolio: [sunilkumardo.vercel.app](https://sunilkumardo.vercel.app)
- Email: sunilkumardo2004@gmail.com
---

## 📜 License

MIT License — Free to use and modify.

---

> *Built to demonstrate production-grade AppSec + Full-Stack + AI skills as a fresher — 2026*