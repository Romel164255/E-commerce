import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const { data } = await api.get("/admin/users");
    setUsers(data.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    fetchUsers();
  };

  return (
    <div>
      <h2>Users</h2>

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