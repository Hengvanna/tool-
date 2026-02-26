import { useState } from 'react';
import { LogIn, CheckCircle, XCircle, Loader2, UploadCloud, Eye, EyeOff, Copy } from 'lucide-react';
import { authenticateMoodle } from './api';
import './index.css';

const TokenDisplay = ({ token }) => {
  const [visible, setVisible] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
  };

  const maskToken = (t) => {
    if (!t) return '';
    if (t.length <= 8) return '•'.repeat(t.length);
    return t.substring(0, 4) + '•'.repeat(t.length - 8) + t.slice(-4);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="token-cell" title={visible ? token : 'Hidden Token'}>
        {visible ? token : maskToken(token)}
      </div>
      <button
        onClick={() => setVisible(!visible)}
        className="btn-icon"
        title={visible ? 'Hide Token' : 'Show Token'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button onClick={copyToClipboard} className="btn-icon" title="Copy Token">
        <Copy size={16} />
      </button>
    </div>
  );
};

function App() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'success', 'error'

  const processLines = (text) => {
    // Parse lines with separators like comma, tab, space, or colon
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    return lines.map(line => {
      // support various delimiters: "user,pass", "user:pass", "user pass", "user\tpass"
      const match = line.match(/^([^\s,:]+)[\s,:]+(.+)$/);
      if (match) {
        return { username: match[1].trim(), password: match[2].trim() };
      }
      return { username: line, password: '', error: 'Invalid format' };
    });
  };

  const handleCheck = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setResults([]);

    const parsedCredentials = processLines(inputText);
    const newResults = [];

    for (const cred of parsedCredentials) {
      if (cred.error) {
        newResults.push({ ...cred, status: 'error', message: cred.error });
        continue;
      }

      try {
        const response = await authenticateMoodle(cred.username, cred.password);

        if (response.success) {
          newResults.push({
            username: cred.username,
            status: 'success',
            token: response.token
          });
        } else {
          newResults.push({
            username: cred.username,
            status: 'error',
            message: response.error || 'Invalid credentials'
          });
        }
      } catch (err) {
        newResults.push({
          username: cred.username,
          status: 'error',
          message: 'Network error or CORS issue'
        });
      }
      // Update state incrementally so user sees progress
      setResults([...newResults]);
    }

    setIsProcessing(false);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Moodle Auth Checker</h1>
        <p>Bulk import and verify CADT Elearning credentials</p>
      </header>

      <main>
        <div className="card glass-panel">
          <div className="form-group">
            <label className="form-label" htmlFor="credentials">
              Paste Credentials (Username and Password)
            </label>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Format supported: <code>username,password</code> or <code>username:password</code> or <code>username password</code>. One per line.
            </p>
            <textarea
              id="credentials"
              className="form-control"
              placeholder="vanna.heng:Hengvanna123@&#10;john.doe,password123&#10;jane.doe pass456"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              className="btn btn-primary"
              onClick={handleCheck}
              disabled={isProcessing || !inputText.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Check Credentials
                </>
              )}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <>
            <div className="summary-grid">
              <div
                className={`summary-card glass-panel cursor-pointer ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setFilter('all')}
              >
                <div className="summary-value text-primary">{results.length}</div>
                <div className="summary-label">Total Tested</div>
              </div>
              <div
                className={`summary-card glass-panel cursor-pointer ${filter === 'success' ? 'ring-2 ring-success' : ''}`}
                onClick={() => setFilter('success')}
              >
                <div className="summary-value text-success">{results.filter(r => r.status === 'success').length}</div>
                <div className="summary-label">Success</div>
              </div>
              <div
                className={`summary-card glass-panel cursor-pointer ${filter === 'error' ? 'ring-2 ring-danger' : ''}`}
                onClick={() => setFilter('error')}
              >
                <div className="summary-value text-danger">{results.filter(r => r.status === 'error').length}</div>
                <div className="summary-label">Failed</div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th width="30%">Username</th>
                    <th width="20%">Status</th>
                    <th width="45%">Details (Token / Error)</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .filter(result => filter === 'all' || result.status === filter)
                    .map((result, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td className="font-medium">{result.username}</td>
                        <td>
                          {result.status === 'success' ? (
                            <span className="status-badge status-success">
                              <CheckCircle size={14} /> success
                            </span>
                          ) : (
                            <span className="status-badge status-error">
                              <XCircle size={14} /> failed
                            </span>
                          )}
                        </td>
                        <td>
                          {result.status === 'success' ? (
                            <TokenDisplay token={result.token} />
                          ) : (
                            <div style={{ color: "var(--danger)", fontSize: "0.875rem" }}>
                              {result.message}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
