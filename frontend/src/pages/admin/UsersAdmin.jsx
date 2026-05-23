import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    const { data } = await api.get("/admin/users");
    setUsers(data.data);
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/admin/users");
        if (isMounted) {
          setUsers(data.data);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load users");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateRole = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    await fetchUsers();
  };

  return (
    <div>
      <h2>Users</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Change</th>
          </tr>
        </thead>

        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
