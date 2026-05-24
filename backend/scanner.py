import requests
import json
import sys
import urllib.parse
from datetime import datetime

def check_https(url):
    """Check if site uses HTTPS"""
    if url.startswith("https://"):
        return {"check": "HTTPS Enabled", "status": "PASS", "severity": "INFO", "detail": "Site uses HTTPS encryption."}
    return {"check": "HTTPS Enabled", "status": "FAIL", "severity": "HIGH", "detail": "Site uses HTTP. Data is transmitted unencrypted."}

def check_security_headers(url, headers):
    """Check for important security headers"""
    results = []
    security_headers = {
        "X-Frame-Options": ("FAIL", "HIGH", "Missing X-Frame-Options. Site may be vulnerable to Clickjacking."),
        "X-Content-Type-Options": ("FAIL", "MEDIUM", "Missing X-Content-Type-Options. Vulnerable to MIME sniffing attacks."),
        "Strict-Transport-Security": ("FAIL", "HIGH", "Missing HSTS header. Forces HTTP connections possible."),
        "Content-Security-Policy": ("FAIL", "HIGH", "Missing CSP header. Increases XSS attack risk."),
        "X-XSS-Protection": ("FAIL", "MEDIUM", "Missing XSS Protection header."),
        "Referrer-Policy": ("FAIL", "LOW", "Missing Referrer-Policy header. May leak sensitive URLs.")
    }
    for header, (status, severity, detail) in security_headers.items():
        if header.lower() in [h.lower() for h in headers]:
            results.append({"check": f"Header: {header}", "status": "PASS", "severity": "INFO", "detail": f"{header} is present."})
        else:
            results.append({"check": f"Header: {header}", "status": status, "severity": severity, "detail": detail})
    return results

def check_cookies(response):
    """Check cookie security flags"""
    results = []
    for cookie in response.cookies:
        if not cookie.secure:
            results.append({"check": f"Cookie '{cookie.name}' Secure Flag", "status": "FAIL", "severity": "MEDIUM", "detail": f"Cookie '{cookie.name}' missing Secure flag. Can be sent over HTTP."})
        else:
            results.append({"check": f"Cookie '{cookie.name}' Secure Flag", "status": "PASS", "severity": "INFO", "detail": f"Cookie '{cookie.name}' has Secure flag."})
        if not cookie.has_nonstandard_attr("HttpOnly"):
            results.append({"check": f"Cookie '{cookie.name}' HttpOnly Flag", "status": "FAIL", "severity": "MEDIUM", "detail": f"Cookie '{cookie.name}' missing HttpOnly flag. Accessible via JavaScript (XSS risk)."})
    return results

def check_server_info(headers):
    """Check if server version is exposed"""
    results = []
    if "server" in [h.lower() for h in headers]:
        server = headers.get("Server", headers.get("server", ""))
        results.append({"check": "Server Version Disclosure", "status": "FAIL", "severity": "LOW", "detail": f"Server header exposes: '{server}'. Attackers can target known vulnerabilities."})
    else:
        results.append({"check": "Server Version Disclosure", "status": "PASS", "severity": "INFO", "detail": "Server version not exposed."})
    if "x-powered-by" in [h.lower() for h in headers]:
        powered = headers.get("X-Powered-By", "")
        results.append({"check": "X-Powered-By Disclosure", "status": "FAIL", "severity": "LOW", "detail": f"X-Powered-By exposes: '{powered}'. Technology stack revealed."})
    return results

def check_open_redirects(url):
    """Basic open redirect check"""
    results = []
    parsed = urllib.parse.urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    test_url = f"{base}/?redirect=https://evil.com"
    try:
        r = requests.get(test_url, allow_redirects=False, timeout=5)
        if r.status_code in [301, 302, 303, 307, 308]:
            location = r.headers.get("Location", "")
            if "evil.com" in location:
                results.append({"check": "Open Redirect", "status": "FAIL", "severity": "HIGH", "detail": "Possible open redirect vulnerability detected."})
            else:
                results.append({"check": "Open Redirect", "status": "PASS", "severity": "INFO", "detail": "No open redirect detected."})
        else:
            results.append({"check": "Open Redirect", "status": "PASS", "severity": "INFO", "detail": "No open redirect detected."})
    except:
        results.append({"check": "Open Redirect", "status": "INFO", "severity": "INFO", "detail": "Could not test open redirect."})
    return results

def scan_url(url):
    """Main scan function"""
    print(f"[*] Starting ThreatLens AI scan for: {url}", flush=True)
    findings = []
    summary = {"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0, "passed": 0}

    try:
        response = requests.get(url, timeout=10, allow_redirects=True, headers={"User-Agent": "ThreatLens-AI-Scanner/1.0"})
        headers = response.headers

        # Run all checks
        findings.append(check_https(url))
        findings.extend(check_security_headers(url, headers))
        findings.extend(check_server_info(headers))
        findings.extend(check_cookies(response))
        findings.extend(check_open_redirects(url))

        # Calculate summary
        for f in findings:
            summary["total"] += 1
            sev = f["severity"].upper()
            if sev == "CRITICAL": summary["critical"] += 1
            elif sev == "HIGH": summary["high"] += 1
            elif sev == "MEDIUM": summary["medium"] += 1
            elif sev == "LOW": summary["low"] += 1
            elif f["status"] == "PASS": summary["passed"] += 1

        result = {
            "url": url,
            "scan_time": datetime.now().isoformat(),
            "status_code": response.status_code,
            "findings": findings,
            "summary": summary
        }

        print(json.dumps(result))

    except requests.exceptions.ConnectionError:
        print(json.dumps({"error": f"Cannot connect to {url}. Site may be down."}))
    except requests.exceptions.Timeout:
        print(json.dumps({"error": f"Connection to {url} timed out."}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No URL provided"}))
        sys.exit(1)
    scan_url(sys.argv[1])