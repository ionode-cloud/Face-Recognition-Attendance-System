import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import './index.css';

function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });
  const [lastUpdated, setLastUpdated] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  const updateTime = () => {
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase());
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      const data = response.data;
      setRecords(data);
      
      const total = data.length;
      const present = data.filter(r => r.attendance === 'Present' && !r.lateEntry).length;
      const late = data.filter(r => r.lateEntry).length;
      const absent = data.filter(r => r.attendance === 'Absent').length;
      
      setStats({ total, present, absent, late });
      updateTime();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to reach the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 60000);
    return () => clearInterval(interval);
  }, []);

  const [filter, setFilter] = useState('All');
  return (
    <div className="app-container">
      <header className="header">
        <h1>Attendance Records</h1>
        <p>Real-time attendance tracking and reporting</p>
      </header>


          <div className="stats-container">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value val-total">{stats.total}</div>
                <div className="stat-title">TOTAL RECORDS</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value val-present">{stats.present}</div>
                <div className="stat-title">PRESENT</div>
              </div>

              <div className="stat-card">
                <div className="stat-value val-late">{stats.late}</div>
                <div className="stat-title">LATE PRESENT</div>
              </div>

              <div className="stat-card">
                <div className="stat-value val-absent">{stats.absent}</div>
                <div className="stat-title">ABSENT</div>
              </div>
            </div>
          </div>

          <div className="controls-bar">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={fetchRecords} 
                className="refresh-btn"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
                Refresh Data
              </button>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '0.4rem 1rem' }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All Records</option>
                <option value="Present">Present (On Time)</option>
                <option value="Late Present">Late Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <span className="last-updated">
              {loading ? 'Updating...' : `Last updated: ${lastUpdated}`}
            </span>
          </div>

          <div className="table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>BRANCH</th>
                  <th>DATE</th>
                  <th>CLASS TIME</th>
                  <th>ENTRY TIME</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--danger)' }}>{error}</td>
                  </tr>
                ) : (() => {
                  const filteredRecords = records.filter(record => {
                    if (filter === 'All') return true;
                    if (filter === 'Present') return record.attendance === 'Present' && !record.lateEntry;
                    if (filter === 'Late Present') return record.lateEntry;
                    if (filter === 'Absent') return record.attendance === 'Absent';
                    return true;
                  });

                  if (filteredRecords.length === 0 && !loading) {
                    return (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center' }}>No records found.</td>
                      </tr>
                    );
                  }

                  return filteredRecords.map((record) => {
                    const dateObj = new Date(record.date);
                    const formattedDate = !isNaN(dateObj.getTime()) 
                      ? `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`
                      : record.date.replace(/-/g, '/');

                    return (
                      <tr key={record._id}>
                        <td>{record.name}</td>
                        <td>{record.branch}</td>
                        <td>{formattedDate}</td>
                        <td>{record.classTime || '22:00'}</td>
                        <td>{record.time}</td>
                        <td>
                          {record.attendance === 'Absent' ? (
                            <span className="badge badge-absent">
                              X ABSENT
                            </span>
                          ) : record.lateEntry ? (
                            <span className="badge badge-late">
                              ! LATE PRESENT
                            </span>
                          ) : (
                            <span className="badge badge-present">
                              ✓ PRESENT
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
                {loading && records.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
    </div>
  );
}

export default App;
