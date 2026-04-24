import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Clock, UserCheck, UserX, Users, LogIn, LogOut, Trash2 } from 'lucide-react';
import './index.css';

function App() {
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [stats, setStats]               = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [lastUpdated, setLastUpdated]   = useState('');
  const [filter, setFilter]             = useState('All');
  const [searchTerm, setSearchTerm]     = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting]         = useState(false);
  const [deleteMsg, setDeleteMsg]       = useState(null);
  const [activeTab, setActiveTab]       = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime]   = useState(new Date());

  // ── API base URL ─────────────────────────────────────────────────────────
  const defaultBase = import.meta.env.DEV
    ? 'http://localhost:5000'
    : 'https://face-recognition-attendance-system-4evl.onrender.com';
  let baseURL = (import.meta.env.VITE_API_URL || defaultBase)
    .replace(/\/$/, '')
    .replace(/\/api\/attendance$/, '');
  const API_URL = `${baseURL}/api/attendance`;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateTime = () => {
    setLastUpdated(
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
    );
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr.replace(/-/g, '/');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hr     = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  // ── Fetch records ─────────────────────────────────────────────────────────
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(API_URL);
      setRecords(data);

      const total   = data.length;
      const present = data.filter(r => r.status === 'Present').length;
      const late    = data.filter(r => r.status === 'Late Present').length;
      const absent  = data.filter(r => r.status === 'Absent').length;
      setStats({ total, present, late, absent });
      updateTime();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to reach the backend server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // ── Delete All handler ────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const { data } = await axios.delete(`${API_URL}/all`);
      setDeleteMsg({ type: 'success', text: data.message });
      setRecords([]);
      setStats({ total: 0, present: 0, late: 0, absent: 0 });
    } catch (err) {
      setDeleteMsg({ type: 'error', text: 'Failed to delete records. Please try again.' });
    } finally {
      setDeleting(false);
      setDeleteConfirmText('');
      setTimeout(() => {
        setShowDeleteModal(false);
        setDeleteMsg(null);
      }, 2000);
    }
  };

  // ── Filtered records ──────────────────────────────────────────────────────
  const filteredRecords = records.filter(r => {
    const matchesFilter = (filter === 'All') 
      ? true 
      : r.status === filter;
    
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.rollNumber.toString().toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // ── Status badge ──────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    if (status === 'Present')      return <span className="badge badge-present">✓ PRESENT</span>;
    if (status === 'Late Present') return <span className="badge badge-late">⏱ LATE PRESENT</span>;
    return                                <span className="badge badge-absent">✗ ABSENT</span>;
  };

  // ── Exit eligibility chip ─────────────────────────────────────────────────
  const ExitChip = ({ entryTime, exitTime }) => {
    if (exitTime) {
      return <span className="exit-chip exit-done"><LogOut size={12} /> {formatTime(exitTime)}</span>;
    }
    if (!entryTime) return <span className="exit-chip exit-na">—</span>;

    const [eh, em] = entryTime.split(':').map(Number);
    const eligibleMins = eh * 60 + em + 60;
    const eligH = Math.floor(eligibleMins / 60).toString().padStart(2, '0');
    const eligM = (eligibleMins % 60).toString().padStart(2, '0');
    return (
      <span className="exit-chip exit-pending">
        <Clock size={11} /> Punch after 1 hour (at {formatTime(`${eligH}:${eligM}`)})
      </span>
    );
  };

  return (
    <div className="app-container">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>📋 Attendance System</h1>
            <p>Advanced Day-wise Tracking & Reporting</p>
          </div>
          <div className="header-right">
            <div className="real-time-clock">
              <Clock size={18} />
              <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
            </div>
            <div className="header-date">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      {/* <div className="tabs-nav">
        <button 
          className={`tab-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Users size={16} /> Live Dashboard
        </button>
        <button 
          className={`tab-link ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={16} /> Daily Reports
        </button>
      </div> */}
      {activeTab === 'dashboard' && (
        <>
          {/* ── Punch Rules Info ───────────────────────────────────────────── */}
          <div className="rules-footer">
            <div className="rule-item"><span className="dot dot-present" /> <b>Present</b>: Punch between 10:00 AM – 11:00 AM</div>
            <div className="rule-item"><span className="dot dot-late" /> <b>Late Present</b>: Punch after 11:00 AM</div>
            <div className="rule-item"><span className="dot dot-absent" /> <b>Absent</b>: No punch recorded for the day</div>
            <div className="rule-item"><span className="dot dot-exit" /> <b>Exit</b>: Allowed only after 1 hour from entry</div>
          </div>

          {/* ── Stats ──────────────────────────────────────────────────────── */}
          <div className="stats-container">
            <div className="stats-grid">
              <div className="stat-card">
                <Users size={20} className="stat-icon icon-total" />
                <div className="stat-value val-total">{stats.total}</div>
                <div className="stat-title">Total Records</div>
              </div>
              <div className="stat-card">
                <UserCheck size={20} className="stat-icon icon-present" />
                <div className="stat-value val-present">{stats.present}</div>
                <div className="stat-title">Present</div>
              </div>
              <div className="stat-card">
                <Clock size={20} className="stat-icon icon-late" />
                <div className="stat-value val-late">{stats.late}</div>
                <div className="stat-title">Late Present</div>
              </div>
              <div className="stat-card">
                <UserX size={20} className="stat-icon icon-absent" />
                <div className="stat-value val-absent">{stats.absent}</div>
                <div className="stat-title">Absent</div>
              </div>
            </div>
          </div>

          {/* ── Controls ───────────────────────────────────────────────────── */}
          <div className="controls-bar">
            <div className="controls-left">
              <button onClick={fetchRecords} className="refresh-btn" disabled={loading} id="refresh-btn">
                <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
                Refresh
              </button>
              <select
                id="status-filter"
                className="form-control filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="All">All Records</option>
                <option value="Present">Present (On Time)</option>
                <option value="Late Present">Late Present</option>
                <option value="Absent">Absent</option>
              </select>
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search name or roll..."
                  className="form-control search-input"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="controls-right">
              <span className="last-updated">
                {loading ? 'Updating…' : `Last updated: ${lastUpdated}`}
              </span>
              <button
                id="delete-all-btn"
                className="delete-all-btn"
                onClick={() => { setShowDeleteModal(true); setDeleteMsg(null); setDeleteConfirmText(''); }}
                disabled={records.length === 0}
              >
                <Trash2 size={14} />
                Delete All Records
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="history-container">
          <div className="history-header">
            <div className="date-picker-group">
              <label htmlFor="report-date">Select Attendance Date:</label>
              <div className="input-with-icon">
                <input 
                  type="date" 
                  id="report-date" 
                  className="form-control date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
            <div className="history-summary">
              Showing records for: <strong>{formatDate(selectedDate)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete All Confirmation Modal ───────────────────────────────── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h2 className="modal-title">Delete All Records?</h2>
            <p className="modal-desc">
              This will permanently delete <strong>all {records.length} attendance records</strong> from the database.
              This action <strong>cannot be undone</strong>.
            </p>
            {deleteMsg ? (
              <div className={`modal-result ${deleteMsg.type}`}>
                {deleteMsg.type === 'success' ? '✅' : '❌'} {deleteMsg.text}
              </div>
            ) : (
              <>
                <p className="modal-confirm-label">Type <code>DELETE</code> to confirm:</p>
                <input
                  id="delete-confirm-input"
                  className="modal-input"
                  type="text"
                  placeholder="Type DELETE here"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  autoFocus
                />
                <div className="modal-actions">
                  <button
                    className="modal-cancel-btn"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-confirm-btn"
                    onClick={handleDeleteAll}
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                  >
                    {deleting ? 'Deleting…' : 'Yes, Delete All'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>#</th>
              <th><LogIn size={13} style={{ marginRight: 4 }} />ROLL NO.</th>
              <th>NAME</th>
              <th>BRANCH</th>
              <th>DATE</th>
              <th>ENTRY TIME</th>
              <th>EXIT TIME</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan="8" className="table-msg error-msg">{error}</td>
              </tr>
            )}

            {!error && loading && records.length === 0 && (
              <tr>
                <td colSpan="8" className="table-msg">
                  <span className="loader-dots"><span /><span /><span /></span> Loading…
                </td>
              </tr>
            )}

            {!error && !loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan="8" className="table-msg">No records found for the selected filter.</td>
              </tr>
            )}

            {!error && filteredRecords
              .filter(r => activeTab === 'dashboard' ? true : r.date === selectedDate)
              .map((record, idx) => (
              <tr key={record._id} className="table-row">
                <td className="row-num">{idx + 1}</td>
                <td className="roll-cell">{record.rollNumber}</td>
                <td>{record.name}</td>
                <td><span className="branch-chip">{record.branch}</span></td>
                <td>{formatDate(record.date)}</td>
                <td>
                  <span className="time-inner">
                    {record.entryTime
                      ? <><LogIn size={12} className="time-icon entry-icon" /> {formatTime(record.entryTime)}</>
                      : <span className="empty-dash">—</span>}
                  </span>
                </td>
                <td>
                  <ExitChip entryTime={record.entryTime} exitTime={record.exitTime} />
                </td>
                <td className="status-cell">
                  <StatusBadge status={record.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
