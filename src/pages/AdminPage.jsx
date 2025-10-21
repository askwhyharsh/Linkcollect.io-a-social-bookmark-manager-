import { useState, useEffect } from 'react';
import {
  getUsers,
  getUserStats,
  updateSubscription,
} from '../api-services/adminService';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getUsers(searchQuery, page, pageSize);
      setUsers(data.users || data);
    } catch (err) {
      setError('Failed to fetch users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleViewStats = async userId => {
    try {
      setError('');
      const { data } = await getUserStats(userId);
      setUserStats(data);
      setSelectedUser(userId);
    } catch (err) {
      setError('Failed to fetch user stats: ' + err.message);
    }
  };

  const handleTogglePremium = async (userId, currentStatus) => {
    try {
      setError('');
      await updateSubscription(userId, !currentStatus);
      alert('Subscription updated successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to update subscription: ' + err.message);
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="search-section">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="users-section">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Premium</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.isPremium ? '✓' : '✗'}</td>
                  <td>
                    <button onClick={() => handleViewStats(user._id)}>
                      View Stats
                    </button>
                    <button
                      onClick={() =>
                        handleTogglePremium(user._id, user.isPremium)
                      }
                    >
                      {user.isPremium ? 'Remove Premium' : 'Make Premium'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={users.length < pageSize}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {userStats && (
        <div className="stats-modal">
          <div className="stats-content">
            <h2>User Statistics</h2>
            <button onClick={() => setUserStats(null)}>Close</button>
            <pre>{JSON.stringify(userStats, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
