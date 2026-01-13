import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Home, Award, Eye, Clock, Target, Zap, RefreshCw, Download, Settings, AlertCircle, Database, Link } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const HybridDashboard = () => {
  // ========================================
  // CONFIGURATION
  // ========================================
  const [dataSource, setDataSource] = useState('sample'); // 'sample' or 'sheets'
  const [googleSheetConfig, setGoogleSheetConfig] = useState({
    sheetId: '10TfZ1o1d4DoTmnilPzIaiTLfjXU0x3HGnnYG7TqGQwQ',  // Your Google Sheet ID
    apiKey: '',   // Paste your Google API key in the Settings panel (recommended)
    autoRefreshInterval: 30000,
    usePublicUrl: false, // Use Sheets API by default (more reliable than public CSV / avoids CORS issues)
  });
  // ========================================

// ========================================
// SIMPLE PASSWORD PROTECTION (no accounts)
// ========================================
// IMPORTANT: This is a "shared password" gate for convenience.
// It is NOT high-security: the password exists in the front-end code.
// Change this password to something only you share with trusted people.
const DASHBOARD_PASSWORD = "12092025!";

const [isAuthenticated, setIsAuthenticated] = useState(() => {
  // Remember login on this device
  return localStorage.getItem("gh_dashboard_auth") === "true";
});

const [passwordInput, setPasswordInput] = useState("");

const handleLogin = () => {
  if (passwordInput === DASHBOARD_PASSWORD) {
    localStorage.setItem("gh_dashboard_auth", "true");
    setIsAuthenticated(true);
  } else {
    alert("Wrong password");
  }
};

const handleLogout = () => {
  localStorage.removeItem("gh_dashboard_auth");
  setIsAuthenticated(false);
  setPasswordInput("");
};

  const [selectedManager, setSelectedManager] = useState('total');
  const [selectedMonth, setSelectedMonth] = useState('january');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const months = [
    { id: 'january', name: 'January 2026', monthNum: 1 },
    { id: 'february', name: 'February 2026', monthNum: 2 },
    { id: 'march', name: 'March 2026', monthNum: 3 },
    { id: 'april', name: 'April 2026', monthNum: 4 },
    { id: 'may', name: 'May 2026', monthNum: 5 },
    { id: 'june', name: 'June 2026', monthNum: 6 },
    { id: 'july', name: 'July 2026', monthNum: 7 },
    { id: 'august', name: 'August 2026', monthNum: 8 },
    { id: 'september', name: 'September 2026', monthNum: 9 },
    { id: 'october', name: 'October 2026', monthNum: 10 },
    { id: 'november', name: 'November 2026', monthNum: 11 },
    { id: 'december', name: 'December 2026', monthNum: 12 }
  ];

  const managers = [
    { id: 'total', name: 'Golden Home North', color: '#C9A961', sheetName: 'Total' },
    { id: 'aggelopoulos', name: 'Aggelopoulos', color: '#E74C3C', sheetName: 'Aggelopoulos' },
    { id: 'koutris', name: 'Koutris', color: '#3498DB', sheetName: 'Koutris' },
    { id: 'kamarineas', name: 'Kamarineas', color: '#2ECC71', sheetName: 'Kamarineas' },
    { id: 'tsonopoulou', name: 'Tsonopoulou', color: '#9B59B6', sheetName: 'Tsonopoulou' },
    { id: 'antoniou', name: 'Antoniou', color: '#F39C12', sheetName: 'Antoniou' },
    { id: 'chatziroussos', name: 'Chatziroussos', color: '#1ABC9C', sheetName: 'Chatziroussos' },
    { id: 'mpampe', name: 'Mpampe', color: '#E67E22', sheetName: 'Mpampe' }
  ];

  // Sample data for immediate use
  const sampleData = {
    total: {
      january: {
        revenue: { monthly: { actual: 85000, target: 90000 }, ytd: { actual: 85000, target: 90000 }, fy: { target: 1080000 } },
        viewings: { monthly: { actual: 145, target: 150 }, ytd: { actual: 145, target: 150 }, fy: { target: 1800 } },
        assets: { monthly: { actual: 28, target: 30 }, ytd: { actual: 28, target: 30 }, fy: { target: 360 } },
        brokers: { monthly: { actual: 3, target: 3 }, ytd: { actual: 3, target: 3 }, fy: { target: 36 } },
        propsPerView: { monthly: { actual: 3.8, target: 4.0 }, ytd: { actual: 3.8, target: 4.0 }, fy: { target: 4.0 } },
        deals: { monthly: 12, ytd: 12 },
        avgHours: { monthly: 8.5, ytd: 8.5 }
      },
      february: {
        revenue: { monthly: { actual: 92000, target: 90000 }, ytd: { actual: 177000, target: 180000 }, fy: { target: 1080000 } },
        viewings: { monthly: { actual: 155, target: 150 }, ytd: { actual: 300, target: 300 }, fy: { target: 1800 } },
        assets: { monthly: { actual: 32, target: 30 }, ytd: { actual: 60, target: 60 }, fy: { target: 360 } },
        brokers: { monthly: { actual: 2, target: 3 }, ytd: { actual: 5, target: 6 }, fy: { target: 36 } },
        propsPerView: { monthly: { actual: 4.1, target: 4.0 }, ytd: { actual: 3.95, target: 4.0 }, fy: { target: 4.0 } },
        deals: { monthly: 14, ytd: 26 },
        avgHours: { monthly: 8.6, ytd: 8.55 }
      }
    },
    aggelopoulos: {
      january: {
        revenue: { monthly: { actual: 12000, target: 13000 }, ytd: { actual: 12000, target: 13000 }, fy: { target: 156000 } },
        viewings: { monthly: { actual: 20, target: 22 }, ytd: { actual: 20, target: 22 }, fy: { target: 264 } },
        assets: { monthly: { actual: 4, target: 4 }, ytd: { actual: 4, target: 4 }, fy: { target: 48 } },
        brokers: { monthly: { actual: 0, target: 0 }, ytd: { actual: 0, target: 0 }, fy: { target: 4 } },
        propsPerView: { monthly: { actual: 3.5, target: 4.0 }, ytd: { actual: 3.5, target: 4.0 }, fy: { target: 4.0 } },
        deals: { monthly: 2, ytd: 2 },
        avgHours: { monthly: 8.2, ytd: 8.2 }
      }
    },
    koutris: {
      january: {
        revenue: { monthly: { actual: 11500, target: 13000 }, ytd: { actual: 11500, target: 13000 }, fy: { target: 156000 } },
        viewings: { monthly: { actual: 19, target: 22 }, ytd: { actual: 19, target: 22 }, fy: { target: 264 } },
        assets: { monthly: { actual: 3, target: 4 }, ytd: { actual: 3, target: 4 }, fy: { target: 48 } },
        brokers: { monthly: { actual: 1, target: 0 }, ytd: { actual: 1, target: 0 }, fy: { target: 4 } },
        propsPerView: { monthly: { actual: 4.2, target: 4.0 }, ytd: { actual: 4.2, target: 4.0 }, fy: { target: 4.0 } },
        deals: { monthly: 2, ytd: 2 },
        avgHours: { monthly: 8.7, ytd: 8.7 }
      }
    }
  };

  // Fetch data from Google Sheets
  // NOTE: In most browser deployments, the docs.google.com CSV endpoints do NOT send CORS headers.
  // That means `fetch()` from the browser often fails with: "TypeError: Failed to fetch".
  // The Google Sheets API (sheets.googleapis.com) DOES support CORS, but requires an API key.
  // This function supports BOTH methods and can automatically fall back to the API if CSV fails.
  const fetchGoogleSheetData = async () => {
    if (!googleSheetConfig.sheetId) {
      setError('Please enter your Google Sheet ID in the configuration panel');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const processedData = {};
      const hasApiKey = !!googleSheetConfig.apiKey?.trim();

      for (const manager of managers) {
        const sheetName = manager.sheetName;

        // Choose the most reliable method:
        // - If API key is provided -> Google Sheets API (best for web apps / avoids CORS)
        // - Else -> public CSV export (requires the sheet to be shared "Anyone with the link can view")
        const url = hasApiKey
          ? `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetConfig.sheetId}/values/${encodeURIComponent(sheetName)}?key=${googleSheetConfig.apiKey.trim()}`
          : `https://docs.google.com/spreadsheets/d/${googleSheetConfig.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          const hint = hasApiKey
            ? `Check: (1) Google Sheets API is enabled, (2) API key is valid + not over-restricted, (3) a tab named "${sheetName}" exists.`
            : `Check: (1) the sheet is shared "Anyone with the link can view", (2) a tab named "${sheetName}" exists.`;
          throw new Error(
            `Failed to fetch tab "${sheetName}" (${response.status} ${response.statusText}). ${hint}` +
            (detail ? ` Details: ${detail.slice(0, 200)}` : '')
          );
        }

        let rows;
        if (hasApiKey) {
          const json = await response.json();
          rows = json.values || [];
        } else {
          const text = await response.text();
          rows = parseCSV(text);
        }

        processedData[manager.id] = processSheetData(rows);
      }

      setData(processedData);
      setDataSource('sheets');
      setLastUpdated(new Date());
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching Google Sheets data:', err);
      setError(
        `${err.message || 'Unknown error'}

` +
        `If this is running in a browser and you're using the public CSV method, it may fail due to CORS. ` +
        `Fix: create a Google Sheets API key, enable the Google Sheets API, paste the key in Settings, and try again.`
      );
      setLoading(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    return lines.map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const processSheetData = (rows) => {
    const monthData = {};
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 7) continue;

      const month = row[0]?.toLowerCase();
      const metric = row[1];
      const monthlyActual = parseFloat(row[2]) || 0;
      const monthlyTarget = parseFloat(row[3]) || 0;
      const ytdActual = parseFloat(row[4]) || 0;
      const ytdTarget = parseFloat(row[5]) || 0;
      const fyTarget = parseFloat(row[6]) || 0;

      if (!month || !metric) continue;

      if (!monthData[month]) {
        monthData[month] = {};
      }

      let metricKey;
      if (metric.includes('Revenue')) metricKey = 'revenue';
      else if (metric.includes('Viewings')) metricKey = 'viewings';
      else if (metric.includes('Assets')) metricKey = 'assets';
      else if (metric.includes('Brokers')) metricKey = 'brokers';
      else if (metric.includes('per Viewing')) metricKey = 'propsPerView';
      else if (metric.includes('Deals')) metricKey = 'deals';
      else if (metric.includes('Hours')) metricKey = 'avgHours';
      else continue;

      if (metricKey === 'deals' || metricKey === 'avgHours') {
        monthData[month][metricKey] = {
          monthly: monthlyActual,
          ytd: ytdActual
        };
      } else {
        monthData[month][metricKey] = {
          monthly: { actual: monthlyActual, target: monthlyTarget },
          ytd: { actual: ytdActual, target: ytdTarget },
          fy: { target: fyTarget }
        };
      }
    }

    return monthData;
  };

  useEffect(() => {
    setMounted(true);
    
    // Load sample data initially
    if (dataSource === 'sample') {
      setData(sampleData);
      setLastUpdated(new Date());
    }

    const clockTimer = setInterval(() => setCurrentTime(new Date()), 60000);

    let refreshTimer;
    if (autoRefresh && dataSource === 'sheets' && googleSheetConfig.sheetId) {
      refreshTimer = setInterval(fetchGoogleSheetData, googleSheetConfig.autoRefreshInterval);
    }

    return () => {
      clearInterval(clockTimer);
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [autoRefresh, dataSource]);

  const calculatePercentage = (actual, target) => target > 0 ? (actual / target) * 100 : 0;
  
  const getStatusColor = (percentage) => {
    if (percentage >= 95) return '#10B981';
    if (percentage >= 80) return '#84CC16';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusEmoji = (percentage) => {
    if (percentage >= 95) return '🟢🟢';
    if (percentage >= 80) return '🟢';
    if (percentage >= 50) return '🟠';
    return '🔴';
  };

  const currentMonthData = data?.[selectedManager]?.[selectedMonth];
  const currentManager = managers.find(m => m.id === selectedManager);
  const currentMonthInfo = months.find(m => m.id === selectedMonth);

  const YTDProgressChart = ({ ytdActual, fyTarget, title, color }) => {
    const ytdPct = calculatePercentage(ytdActual, fyTarget);
    const remaining = Math.max(0, fyTarget - ytdActual);
    
    const chartData = [
      { name: 'YTD Actual', value: ytdActual, fill: color },
      { name: 'Remaining to FY', value: remaining, fill: '#374151' }
    ];

    return (
      <div className="ytd-chart">
        <div className="ytd-chart-header">
          <div className="ytd-chart-title">{title}</div>
          <div className="ytd-chart-percentage" style={{ color }}>
            {ytdPct.toFixed(1)}% of FY Target
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="ytd-chart-labels">
          <div className="ytd-label">
            <span className="ytd-label-value" style={{ color }}>{ytdActual.toLocaleString()}</span>
            <span className="ytd-label-text">YTD</span>
          </div>
          <div className="ytd-label">
            <span className="ytd-label-value">{fyTarget.toLocaleString()}</span>
            <span className="ytd-label-text">FY Target</span>
          </div>
        </div>
      </div>
    );
  };

  const MetricCard = ({ icon: Icon, title, metricData, isDecimal = false }) => {
    if (!metricData) return null;

    const monthlyPct = calculatePercentage(metricData.monthly.actual, metricData.monthly.target);
    const ytdPct = calculatePercentage(metricData.ytd.actual, metricData.ytd.target);
    const statusColor = getStatusColor(ytdPct);

    return (
      <div className="metric-card" style={{ '--status-color': statusColor }}>
        <div className="metric-header">
          <div className="metric-icon" style={{ background: `${statusColor}15`, color: statusColor }}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
          <div className="metric-title-section">
            <h3>{title}</h3>
            <div className="metric-status">{getStatusEmoji(ytdPct)}</div>
          </div>
        </div>

        <div className="metric-stats">
          <div className="stat-group">
            <div className="stat-label">Monthly Performance</div>
            <div className="stat-main">
              <span className="stat-value">
                {isDecimal ? metricData.monthly.actual.toFixed(1) : metricData.monthly.actual.toLocaleString()}
              </span>
              <span className="stat-target">
                / {isDecimal ? metricData.monthly.target.toFixed(1) : metricData.monthly.target.toLocaleString()}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ 
                width: `${Math.min(monthlyPct, 100)}%`,
                background: getStatusColor(monthlyPct)
              }}></div>
            </div>
            <div className="stat-percentage" style={{ color: getStatusColor(monthlyPct) }}>
              {monthlyPct.toFixed(1)}%
            </div>
          </div>

          <div className="stat-group">
            <div className="stat-label">Year to Date</div>
            <div className="stat-main">
              <span className="stat-value">
                {isDecimal ? metricData.ytd.actual.toFixed(1) : metricData.ytd.actual.toLocaleString()}
              </span>
              <span className="stat-target">
                / {isDecimal ? metricData.ytd.target.toFixed(1) : metricData.ytd.target.toLocaleString()}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ 
                width: `${Math.min(ytdPct, 100)}%`,
                background: getStatusColor(ytdPct)
              }}></div>
            </div>
            <div className="stat-percentage" style={{ color: getStatusColor(ytdPct) }}>
              {ytdPct.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="metric-divider"></div>
        
        <YTDProgressChart 
          ytdActual={metricData.ytd.actual}
          fyTarget={metricData.fy.target}
          title="YTD vs Full Year Target"
          color={statusColor}
        />
      </div>
    );
  };

  const calculateBonusScore = () => {
    if (!currentMonthData) return 0;
    
    const weights = { revenue: 0.60, viewings: 0.20, assets: 0.10, brokers: 0.05, propsPerView: 0.05 };
    let totalScore = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      const metric = currentMonthData[key];
      if (metric && metric.ytd) {
        const pct = calculatePercentage(metric.ytd.actual, metric.ytd.target);
        totalScore += (pct / 100) * weight;
      }
    });

    return totalScore * 100;
  };

  const bonusScore = calculateBonusScore();

  const ConfigPanel = () => (
    <div className="config-overlay" onClick={() => setShowConfig(false)}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="config-header">
          <h2>Google Sheets Configuration</h2>
          <button onClick={() => setShowConfig(false)} className="close-btn">×</button>
        </div>
        
        <div className="config-content">
          <div className="config-section">
            <label>Google Sheet ID</label>
            <input
              type="text"
              value={googleSheetConfig.sheetId}
              onChange={(e) => setGoogleSheetConfig({...googleSheetConfig, sheetId: e.target.value})}
              placeholder="Paste your Sheet ID here"
              className="config-input"
            />
            <p className="config-help">
              Find this in your Google Sheet URL between /d/ and /edit
            </p>
          </div>

          <div className="config-section">
            <label>API Key (Optional)</label>
            <input
              type="text"
              value={googleSheetConfig.apiKey}
              onChange={(e) => setGoogleSheetConfig({...googleSheetConfig, apiKey: e.target.value})}
              placeholder="Optional: Add Google API Key"
              className="config-input"
            />
            <p className="config-help">
              For better performance. Leave empty to use public URL method.
            </p>
          </div>

          <div className="config-section">
            <label>
              <input
                type="checkbox"
                checked={googleSheetConfig.usePublicUrl}
                onChange={(e) => setGoogleSheetConfig({...googleSheetConfig, usePublicUrl: e.target.checked})}
              />
              Use Public URL Method
            </label>
            <p className="config-help">
              Recommended: Keep this checked. Uncheck only if using API key.
            </p>
          </div>

          <div className="config-actions">
            <button 
              onClick={() => {
                if (googleSheetConfig.sheetId) {
                  fetchGoogleSheetData();
                  setShowConfig(false);
                }
              }}
              className="action-btn active"
              disabled={!googleSheetConfig.sheetId}
            >
              <Link size={18} />
              Connect to Google Sheets
            </button>
          </div>

          <div className="config-instructions">
            <h3>Quick Setup Instructions:</h3>
            <ol>
              <li>Open your Google Sheet</li>
              <li>Click Share → Anyone with link can view</li>
              <li>Copy the Sheet ID from the URL</li>
              <li>Paste it above and click "Connect"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

// Password gate (simple shared password)
if (!isAuthenticated) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)',
      color: '#E5E7EB',
      padding: 24,
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderRadius: 20,
        padding: 32,
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #C9A961 0%, #D4AF37 100%)',
            color: '#0A0E27',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 26,
            fontFamily: "'Bebas Neue', sans-serif"
          }}>
            GH
          </div>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 34,
              letterSpacing: 1.5,
              color: '#C9A961',
              lineHeight: 1
            }}>
              Golden Home Dashboard
            </div>
            <div style={{ marginTop: 6, color: '#9CA3AF', fontSize: 14 }}>
              Enter password to continue
            </div>
          </div>
        </div>

        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Password"
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 12,
            border: '2px solid rgba(255, 255, 255, 0.10)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#F3F4F6',
            fontSize: 15,
            outline: 'none'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLogin();
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px 16px',
            borderRadius: 12,
            border: '2px solid rgba(201, 169, 97, 0.3)',
            background: '#C9A961',
            color: '#0A0E27',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: 15
          }}
        >
          Unlock Dashboard
        </button>

        <div style={{ marginTop: 14, color: '#6B7280', fontSize: 12, lineHeight: 1.5 }}>
          Tip: After you log in once, this device will remember it.
        </div>
      </div>
    </div>
  );
}


  if (!currentMonthData) {
    return (
      <div className="error-screen">
        <Database size={48} color="#C9A961" />
        <h2>Welcome to Golden Home Dashboard</h2>
        <p>Currently showing sample data</p>
        <button onClick={() => setShowConfig(true)} className="action-btn active">
          <Link size={18} />
          Connect Google Sheets
        </button>
        <button onClick={() => {
          setData(sampleData);
          setDataSource('sample');
        }} className="action-btn">
          <Database size={18} />
          Continue with Sample Data
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #1C1F26;
          color: #E5E7EB;
          overflow-x: hidden;
        }

        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #1C1F26 0%, #23262F 100%);
          position: relative;
          overflow: hidden;
        }

        .dashboard::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle, rgba(201, 169, 97, 0.07) 0%, transparent 70%);
          pointer-events: none;
          animation: pulse 15s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }

        .dashboard::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(201, 169, 97, 0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 169, 97, 0.01) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 1;
        }

        .error-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 40px;
          text-align: center;
        }

        .error-screen h2 {
          font-size: 28px;
          color: #F3F4F6;
          margin-top: 10px;
        }

        .error-screen p {
          color: #9CA3AF;
          max-width: 500px;
        }

        .config-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .config-panel {
          background: linear-gradient(135deg, #1A1F3A 0%, #0A0E27 100%);
          border: 2px solid rgba(201, 169, 97, 0.3);
          border-radius: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .config-header {
          padding: 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .config-header h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 2px;
          color: #C9A961;
        }

        .close-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          font-size: 32px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s;
        }

        .close-btn:hover {
          color: #F3F4F6;
        }

        .config-content {
          padding: 30px;
        }

        .config-section {
          margin-bottom: 25px;
        }

        .config-section label {
          display: block;
          font-weight: 600;
          color: #F3F4F6;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .config-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #F3F4F6;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.3s;
        }

        .config-input:focus {
          outline: none;
          border-color: #C9A961;
          background: rgba(255, 255, 255, 0.08);
        }

        .config-help {
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 6px;
        }

        .config-actions {
          margin: 30px 0;
        }

        .config-instructions {
          background: rgba(201, 169, 97, 0.07);
          border: 1px solid rgba(201, 169, 97, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }

        .config-instructions h3 {
          font-size: 16px;
          color: #C9A961;
          margin-bottom: 12px;
        }

        .config-instructions ol {
          margin-left: 20px;
          color: #9CA3AF;
          font-size: 14px;
        }

        .config-instructions li {
          margin-bottom: 8px;
        }

        .container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 40px 30px;
          position: relative;
          z-index: 2;
        }

        .header {
          margin-bottom: 50px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #C9A961 0%, #D4AF37 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          color: #0A0E27;
          font-weight: bold;
          box-shadow: 0 10px 40px rgba(201, 169, 97, 0.3);
        }

        .title-section h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #C9A961 0%, #F4E4C1 50%, #C9A961 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .title-section .subtitle {
          font-size: 15px;
          color: #9CA3AF;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .data-source-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: ${dataSource === 'sheets' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(201, 169, 97, 0.07)'};
          border: 1px solid ${dataSource === 'sheets' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(201, 169, 97, 0.2)'};
          border-radius: 6px;
          font-size: 12px;
          color: ${dataSource === 'sheets' ? '#10B981' : '#C9A961'};
          font-weight: 600;
          margin-left: 10px;
        }

        .header-actions {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border: 2px solid rgba(201, 169, 97, 0.3);
          background: rgba(201, 169, 97, 0.07);
          color: #C9A961;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s;
          font-family: 'DM Sans', sans-serif;
        }

        .action-btn:hover {
          background: rgba(201, 169, 97, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(201, 169, 97, 0.2);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.active {
          background: #C9A961;
          color: #0A0E27;
          border-color: #C9A961;
        }

        .month-dropdown {
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #E5E7EB;
          font-weight: 600;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 180px;
        }

        .month-dropdown:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(201, 169, 97, 0.3);
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          background: ${dataSource === 'sheets' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(201, 169, 97, 0.07)'};
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid ${dataSource === 'sheets' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(201, 169, 97, 0.2)'};
        }

        .live-dot {
          width: 10px;
          height: 10px;
          background: ${dataSource === 'sheets' ? '#10B981' : '#C9A961'};
          border-radius: 50%;
          animation: blink 2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .live-text {
          font-size: 13px;
          font-weight: 600;
          color: ${dataSource === 'sheets' ? '#10B981' : '#C9A961'};
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .time-display {
          font-size: 14px;
          color: #6B7280;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .manager-selector {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding: 25px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .manager-btn {
          padding: 14px 24px;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.05);
          color: #E5E7EB;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .manager-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1));
          transform: translateX(-100%);
          transition: transform 0.3s;
        }

        .manager-btn:hover::before {
          transform: translateX(0);
        }

        .manager-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .manager-btn.active {
          border-color: var(--manager-color);
          background: var(--manager-color);
          color: #0A0E27;
          box-shadow: 0 10px 40px var(--manager-shadow);
        }

        .metrics-section {
          margin-top: 40px;
        }

        .section-header {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 2px;
          margin-bottom: 30px;
          color: #C9A961;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .section-header::after {
          content: '';
          flex: 1;
          height: 2px;
          background: linear-gradient(90deg, rgba(201, 169, 97, 0.5), transparent);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 30px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--status-color), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .metric-card:hover {
          transform: translateY(-8px);
          border-color: rgba(201, 169, 97, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .metric-card:hover::before {
          opacity: 1;
        }

        .metric-header {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 30px;
        }

        .metric-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-title-section {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-title-section h3 {
          font-size: 18px;
          font-weight: 700;
          color: #F3F4F6;
          letter-spacing: 0.5px;
        }

        .metric-status {
          font-size: 24px;
        }

        .metric-stats {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .stat-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #9CA3AF;
        }

        .stat-main {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #F9FAFB;
          font-variant-numeric: tabular-nums;
        }

        .stat-target {
          font-size: 18px;
          color: #6B7280;
          font-weight: 500;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .stat-percentage {
          font-size: 16px;
          font-weight: 700;
          text-align: right;
        }

        .metric-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          margin: 20px 0;
        }

        .ytd-chart {
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .ytd-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .ytd-chart-title {
          font-size: 13px;
          font-weight: 600;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .ytd-chart-percentage {
          font-size: 16px;
          font-weight: 700;
        }

        .ytd-chart-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }

        .ytd-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ytd-label-value {
          font-size: 18px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .ytd-label-text {
          font-size: 11px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bonus-section {
          margin-top: 50px;
          background: linear-gradient(135deg, rgba(201, 169, 97, 0.07) 0%, rgba(201, 169, 97, 0.05) 100%);
          border: 2px solid rgba(201, 169, 97, 0.2);
          border-radius: 30px;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }

        .bonus-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(201, 169, 97, 0.15) 0%, transparent 70%);
          animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .bonus-content {
          position: relative;
          z-index: 1;
        }

        .bonus-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 35px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .bonus-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 38px;
          letter-spacing: 2px;
          color: #C9A961;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .bonus-score-display {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(0, 0, 0, 0.3);
          padding: 20px 35px;
          border-radius: 20px;
          border: 2px solid rgba(201, 169, 97, 0.3);
        }

        .bonus-score-number {
          font-size: 56px;
          font-weight: 700;
          background: linear-gradient(135deg, #C9A961 0%, #F4E4C1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-variant-numeric: tabular-nums;
        }

        .bonus-score-emoji {
          font-size: 40px;
        }

        .bonus-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .bonus-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s;
        }

        .bonus-item:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-3px);
        }

        .bonus-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .bonus-item-name {
          font-weight: 600;
          color: #E5E7EB;
          font-size: 15px;
        }

        .bonus-item-weight {
          font-size: 13px;
          color: #C9A961;
          font-weight: 700;
        }

        .bonus-item-score {
          font-size: 24px;
          font-weight: 700;
          color: #F9FAFB;
        }

        .info-section {
          margin-top: 40px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 25px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s;
        }

        .info-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .info-icon {
          width: 50px;
          height: 50px;
          background: rgba(156, 163, 175, 0.15);
          color: #9CA3AF;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .info-content h4 {
          font-size: 13px;
          color: #9CA3AF;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .info-values {
          display: flex;
          gap: 15px;
          align-items: baseline;
        }

        .info-value {
          font-size: 28px;
          font-weight: 700;
          color: #F9FAFB;
        }

        .info-label {
          font-size: 12px;
          color: #6B7280;
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .title-section h1 {
            font-size: 32px;
          }
          
          .manager-selector {
            flex-direction: column;
          }
          
          .bonus-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      

        /* ================================
           Sugar White Theme Overrides
           ================================ */
        body {
          background: #F7F6F2;
          color: #111827;
        }

        .dashboard {
          background: linear-gradient(135deg, #F7F6F2 0%, #EEF2F7 100%);
          color: #111827;
        }

        .dashboard::before {
          background: radial-gradient(circle, rgba(201, 169, 97, 0.08) 0%, transparent 70%);
          opacity: 1;
        }

        .dashboard::after {
          background-image:
            linear-gradient(rgba(201, 169, 97, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 169, 97, 0.02) 1px, transparent 1px);
        }

        .title-section .subtitle { color: #4B5563; }
        .time-display { color: #6B7280; }

        .manager-selector {
          background: rgba(17, 24, 39, 0.02);
          border: 1px solid rgba(17, 24, 39, 0.06);
        }

        .manager-btn {
          background: rgba(17, 24, 39, 0.04);
          color: #111827;
        }

        .manager-btn:hover {
          box-shadow: 0 10px 30px rgba(17, 24, 39, 0.12);
        }

        .month-dropdown {
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(17, 24, 39, 0.12);
          color: #111827;
        }

        .month-dropdown:hover {
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(201, 169, 97, 0.35);
        }

        .metric-card {
          background: #FFFFFF;
          border: 1px solid rgba(17, 24, 39, 0.08);
          box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
        }

        .metric-title-section h3 { color: #111827; }
        .stat-label { color: #6B7280; }
        .stat-value { color: #111827; }
        .stat-target { color: #6B7280; }

        .progress-bar { background: rgba(17, 24, 39, 0.06); }

        .ytd-chart {
          background: rgba(17, 24, 39, 0.03);
          border: 1px solid rgba(17, 24, 39, 0.06);
        }

        .ytd-chart-title { color: #6B7280; }
        .ytd-label-text { color: #6B7280; }

        .bonus-item {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(17, 24, 39, 0.08);
        }

        .bonus-item-name { color: #111827; }
        .bonus-item-score { color: #111827; }

        .info-card {
          background: #FFFFFF;
          border: 1px solid rgba(17, 24, 39, 0.08);
        }

        .info-content h4 { color: #6B7280; }
        .info-value { color: #111827; }
        .info-label { color: #6B7280; }

        .info-icon {
          background: rgba(17, 24, 39, 0.06);
          color: #6B7280;
        }

        .error-screen h2 { color: #111827; }
        .error-screen p { color: #6B7280; }

        .config-panel {
          background: #FFFFFF;
          border: 2px solid rgba(201, 169, 97, 0.25);
        }

        .config-header { border-bottom: 1px solid rgba(17, 24, 39, 0.10); }
        .config-section label { color: #111827; }
        .config-help { color: #6B7280; }

        .config-input {
          background: rgba(17, 24, 39, 0.03);
          border: 2px solid rgba(17, 24, 39, 0.12);
          color: #111827;
        }

        .config-input:focus {
          border-color: #C9A961;
          background: rgba(17, 24, 39, 0.02);
        }

        .close-btn { color: #6B7280; }
        .close-btn:hover { color: #111827; }
`}</style>

      {showConfig && <ConfigPanel />}

      <div className="container">
        <header className="header">
          <div className="header-top">
            <div className="logo-section">
              <div className="logo">GH</div>
              <div className="title-section">
                <h1>Golden Home North</h1>
                <p className="subtitle">
                  Interactive Dashboard · {currentMonthInfo?.name}
                  <span className="data-source-badge">
                    {dataSource === 'sheets' ? <Link size={14} /> : <Database size={14} />}
                    {dataSource === 'sheets' ? 'Google Sheets' : 'Sample Data'}
                  </span>
                </p>
              </div>
            </div>
            <div className="header-actions">
              <select 
                className="month-dropdown"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map(month => (
                  <option key={month.id} value={month.id}>{month.name}</option>
                ))}
              </select>
              
              {dataSource === 'sheets' && (
                <>
                  <button className="action-btn" onClick={fetchGoogleSheetData} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                  <button 
                    className={`action-btn ${autoRefresh ? 'active' : ''}`}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    <Settings size={18} />
                    Auto {autoRefresh ? 'ON' : 'OFF'}
                  </button>
                </>
              )}

              <button className="action-btn" onClick={() => setShowConfig(true)}>
                <Settings size={18} />
                {dataSource === 'sheets' ? 'Settings' : 'Connect Sheets'}
              </button>

<button className="action-btn" onClick={handleLogout} title="Log out (this device)">
  <AlertCircle size={18} />
  Log out
</button>

              
              <div className="live-indicator">
                <div className="live-dot"></div>
                <div>
                  <div className="live-text">{dataSource === 'sheets' ? 'Live' : 'Sample'}</div>
                  {lastUpdated && (
                    <div className="time-display">
                      {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="manager-selector">
            {managers.map(manager => (
              <button
                key={manager.id}
                className={`manager-btn ${selectedManager === manager.id ? 'active' : ''}`}
                onClick={() => setSelectedManager(manager.id)}
                style={{
                  '--manager-color': manager.color,
                  '--manager-shadow': `${manager.color}40`
                }}
              >
                {manager.name}
              </button>
            ))}
          </div>
        </header>

        <main>
          <section className="metrics-section">
            <h2 className="section-header">
              <Target size={32} />
              Primary Performance Metrics
            </h2>
            <div className="metrics-grid">
              <MetricCard
                icon={TrendingUp}
                title="Revenue (€)"
                metricData={currentMonthData.revenue}
              />
              <MetricCard
                icon={Eye}
                title="Total Viewings"
                metricData={currentMonthData.viewings}
              />
              <MetricCard
                icon={Home}
                title="New Assets Listed"
                metricData={currentMonthData.assets}
              />
              <MetricCard
                icon={Users}
                title="Brokers Recruited"
                metricData={currentMonthData.brokers}
              />
              <MetricCard
                icon={Zap}
                title="Properties per Viewing"
                metricData={currentMonthData.propsPerView}
                isDecimal={true}
              />
            </div>
          </section>

          <section className="bonus-section">
            <div className="bonus-content">
              <div className="bonus-header">
                <h2 className="bonus-title">
                  <Award size={36} />
                  Bonus Performance Score
                </h2>
                <div className="bonus-score-display">
                  <div className="bonus-score-number">{bonusScore.toFixed(1)}%</div>
                  <div className="bonus-score-emoji">{getStatusEmoji(bonusScore)}</div>
                </div>
              </div>
              <div className="bonus-grid">
                {[
                  { name: 'Revenue', weight: 60, metric: currentMonthData.revenue },
                  { name: 'Viewings', weight: 20, metric: currentMonthData.viewings },
                  { name: 'New Assets', weight: 10, metric: currentMonthData.assets },
                  { name: 'Brokers', weight: 5, metric: currentMonthData.brokers },
                  { name: 'Props/View', weight: 5, metric: currentMonthData.propsPerView }
                ].map((item, idx) => {
                  const achievement = item.metric ? calculatePercentage(item.metric.ytd.actual, item.metric.ytd.target) : 0;
                  const weighted = (achievement / 100) * (item.weight / 100) * 100;
                  return (
                    <div key={idx} className="bonus-item">
                      <div className="bonus-item-header">
                        <div className="bonus-item-name">{item.name}</div>
                        <div className="bonus-item-weight">{item.weight}%</div>
                      </div>
                      <div className="bonus-item-score">{weighted.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {currentMonthData.deals && currentMonthData.avgHours && (
            <section className="info-section">
              <div className="info-card">
                <div className="info-icon">
                  <Award size={24} />
                </div>
                <div className="info-content">
                  <h4>Deals Closed</h4>
                  <div className="info-values">
                    <div>
                      <div className="info-value">{currentMonthData.deals.monthly}</div>
                      <div className="info-label">Monthly</div>
                    </div>
                    <div>
                      <div className="info-value">{currentMonthData.deals.ytd}</div>
                      <div className="info-label">YTD</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <Clock size={24} />
                </div>
                <div className="info-content">
                  <h4>Avg Hours Worked/Day</h4>
                  <div className="info-values">
                    <div>
                      <div className="info-value">{currentMonthData.avgHours.monthly.toFixed(1)}</div>
                      <div className="info-label">Monthly</div>
                    </div>
                    <div>
                      <div className="info-value">{currentMonthData.avgHours.ytd.toFixed(1)}</div>
                      <div className="info-label">YTD</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default HybridDashboard;
