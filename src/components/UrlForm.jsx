import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link2, Sparkles, Copy, Check, Calendar, Download, UploadCloud, FileText, CheckCircle2, XCircle, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

const UrlForm = ({ onUrlCreated, authFetch }) => {
  const [formMode, setFormMode] = useState('single'); // 'single' or 'bulk'

  // Single URL States
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lanHost, setLanHost] = useState('');

  // Bulk CSV States
  const [csvFile, setCsvFile] = useState(null);
  const [bulkUrls, setBulkUrls] = useState([]); // Parsed data
  const [bulkError, setBulkError] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null); // Return from API

  React.useEffect(() => {
    const fetchLanIp = async () => {
      try {
        const res = await authFetch('/api/urls/qr-host');
        const data = await res.json();
        if (res.ok && data.lanIp) {
          setLanHost(`http://${data.lanIp}:${data.port}`);
        }
      } catch (err) {
        console.error('Failed to resolve LAN IP:', err);
      }
    };
    fetchLanIp();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);
    setLoading(true);

    let formattedUrl = longUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'http://' + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch (_) {
      setError('Please enter a valid target URL (e.g. google.com)');
      setLoading(false);
      return;
    }

    try {
      let expiryIso = null;
      if (expiresAt) {
        const selectedDate = new Date(expiresAt);
        if (selectedDate <= new Date()) {
          throw new Error('Expiry date must be in the future');
        }
        expiryIso = selectedDate.toISOString();
      }

      const res = await authFetch('/api/urls/shorten', {
        method: 'POST',
        body: JSON.stringify({
          longUrl: formattedUrl,
          customAlias: customAlias.trim() || null,
          expiresAt: expiryIso,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setSuccessData(data);
      setLongUrl('');
      setCustomAlias('');
      setExpiresAt('');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a78bfa', '#3b82f6', '#ec4899']
      });

      if (onUrlCreated) {
        onUrlCreated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFullShortUrl = (code) => {
    return `${window.location.origin}/r/${code}`;
  };

  const handleCopy = () => {
    if (!successData) return;
    const link = getFullShortUrl(successData.shortCode);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy via Clipboard API, trying fallback:', err);
          fallbackCopyText(link);
        });
    } else {
      fallbackCopyText(link);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
  };

  const downloadQrCode = () => {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 10, 10, 280, 280);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${successData.shortCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // CSV Drag and Drop & Parsing logic
  const parseCsv = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one URL entry.');
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const urlIndex = headers.indexOf('url');
    const aliasIndex = headers.indexOf('alias');
    const expiryIndex = headers.indexOf('expiry');

    if (urlIndex === -1) {
      throw new Error('CSV is missing the mandatory "url" column in headers.');
    }

    const items = [];
    for (let i = 1; i < lines.length; i++) {
      // Basic splitting matching commas but skipping commas inside quotes if present
      const rawRow = lines[i];
      const row = rawRow.split(',').map(cell => cell.trim().replace(/['"]/g, ''));
      if (!row[urlIndex]) continue; // Skip empty rows

      items.push({
        longUrl: row[urlIndex],
        customAlias: aliasIndex !== -1 && row[aliasIndex] ? row[aliasIndex] : null,
        expiresAt: expiryIndex !== -1 && row[expiryIndex] ? row[expiryIndex] : null
      });
    }

    if (items.length === 0) {
      throw new Error('No valid URL rows detected in the CSV file.');
    }

    return items;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    processFile(file);
  };

  const processFile = (file) => {
    setBulkError('');
    setBulkResults(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCsv(text);
        setBulkUrls(parsed);
      } catch (err) {
        setBulkError(err.message);
        setBulkUrls([]);
      }
    };
    reader.onerror = () => {
      setBulkError('Failed to read CSV file.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
      processFile(file);
    } else {
      setBulkError('Please drop a valid .csv file.');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkUrls.length === 0) return;
    setBulkLoading(true);
    setBulkError('');
    setBulkResults(null);

    try {
      const res = await authFetch('/api/urls/bulk', {
        method: 'POST',
        body: JSON.stringify({ urls: bulkUrls }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit bulk warp sequence');
      }

      setBulkResults(data);
      setBulkUrls([]);
      setCsvFile(null);

      // Trigger Confetti if there are successes
      const hasSuccess = data.some(r => r.success);
      if (hasSuccess) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a78bfa', '#38bdf8']
        });
      }

      if (onUrlCreated) {
        onUrlCreated();
      }
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,url,alias,expiry\nhttps://github.com,hub-code,2026-12-31T23:59:59Z\nhttps://news.ycombinator.com,,\nhttps://vite.dev,dev-portal,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cosmic_warp_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="form-card glassmorphic">
      {/* Sub-modes Toggle */}
      <div className="form-modes-toggle">
        <button
          type="button"
          className={`mode-toggle-btn ${formMode === 'single' ? 'active' : ''}`}
          onClick={() => {
            setFormMode('single');
            setError('');
            setSuccessData(null);
          }}
        >
          🛰️ Single Route
        </button>
        <button
          type="button"
          className={`mode-toggle-btn ${formMode === 'bulk' ? 'active' : ''}`}
          onClick={() => {
            setFormMode('bulk');
            setBulkError('');
            setBulkResults(null);
          }}
        >
          📂 Bulk Warp (CSV)
        </button>
      </div>

      {formMode === 'single' ? (
        /* SINGLE SHORTENER ROUTE FORM */
        <>
          <h2><Sparkles size={18} className="glow-icon" /> Warp Vector</h2>
          <form onSubmit={handleSubmit} className="shorten-form">
            <div className="form-group">
              <label htmlFor="longUrl">Target Destination URL</label>
              <div className="input-with-icon">
                <Link2 className="input-icon" size={16} />
                <input
                  type="text"
                  id="longUrl"
                  required
                  placeholder="Paste your long cosmic link (e.g. github.com/google/deepmind)"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="customAlias">Custom Warp Alias (Optional)</label>
                <input
                  type="text"
                  id="customAlias"
                  placeholder="e.g. main-deck"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="expiresAt">Expiration Date (Optional)</label>
                <div className="date-input-wrapper">
                  <Calendar className="date-icon" size={16} />
                  <input
                    type="datetime-local"
                    id="expiresAt"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {error && <div className="form-error-msg">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block btn-warp" disabled={loading}>
              {loading ? 'Compressing space-time...' : 'Warp Link'}
            </button>
          </form>

          {successData && (
            <div className="success-banner animate-fade-in">
              <div className="success-content">
                <div className="success-text">
                  <h3>Link Warped Successfully!</h3>
                  <p>Your short link is registered and active.</p>
                  
                  <div className="short-url-box">
                    <span className="short-url-text">{getFullShortUrl(successData.shortCode)}</span>
                    <button className="copy-icon-btn" onClick={handleCopy} title="Copy Link to Clipboard">
                      {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="qr-container">
                  <QRCodeSVG
                    id="qr-svg"
                    value={lanHost ? `${lanHost}/r/${successData.shortCode}` : getFullShortUrl(successData.shortCode)}
                    size={110}
                    bgColor={'#ffffff'}
                    fgColor={'#07060e'}
                    level={'H'}
                    includeMargin={true}
                  />
                  <button className="btn btn-secondary btn-xs btn-qr-download" onClick={downloadQrCode}>
                    <Download size={12} /> QR Code
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* BULK WARP CSV UPLOADER */
        <>
          <div className="bulk-header-actions">
            <h2><UploadCloud size={18} className="glow-icon" /> Bulk Warp Engine</h2>
            <button type="button" className="glow-link-template" onClick={downloadTemplate}>
              <Info size={12} /> Template CSV
            </button>
          </div>

          <form onSubmit={handleBulkSubmit} className="shorten-form">
            <div
              className="dropzone glassmorphic"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <UploadCloud size={32} className="text-muted" />
              <p>Drag and drop your <strong>.csv</strong> coordinates file here</p>
              <span className="text-muted" style={{ fontSize: '0.75rem', margin: '4px 0' }}>or</span>
              <label htmlFor="csv-upload" className="btn btn-secondary btn-xs cursor-pointer">
                Select File
              </label>
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                className="hidden-file-input"
                onChange={handleFileChange}
              />
            </div>

            {csvFile && (
              <div className="file-info-badge">
                <FileText size={14} className="text-primary" />
                <span>{csvFile.name} ({bulkUrls.length} links parsed)</span>
              </div>
            )}

            {bulkError && <div className="form-error-msg">{bulkError}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-warp"
              disabled={bulkUrls.length === 0 || bulkLoading}
            >
              {bulkLoading ? 'Warping bulk fleet...' : `Warp ${bulkUrls.length || ''} Links`}
            </button>
          </form>

          {/* Bulk upload results display */}
          {bulkResults && (
            <div className="bulk-results-banner animate-fade-in scrollable">
              <h3>Bulk Warp Report</h3>
              <div className="results-list-container">
                {bulkResults.map((res, i) => (
                  <div key={i} className={`result-item ${res.success ? 'success' : 'failure'}`}>
                    {res.success ? (
                      <>
                        <CheckCircle2 size={14} className="text-success" />
                        <div className="result-item-content">
                          <span className="result-original-url">{res.longUrl}</span>
                          <span className="result-short-url">{getFullShortUrl(res.shortCode)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="text-error" />
                        <div className="result-item-content">
                          <span className="result-original-url">{res.longUrl}</span>
                          <span className="result-error-reason">{res.error}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UrlForm;
