import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (p = 1) => {
    const { data } = await api.get(`/admin/products?page=${p}`);
    setProducts(data.data);
    setTotalPages(data.totalPages);
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const updateStock = async (id, stock) => {
    await api.patch(`/admin/products/${id}`, { stock });
    fetchProducts(page);
  };

  const uploadCSV = async (e) => {
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    await api.post("/admin/products/upload", formData);
    fetchProducts(page);
  };

  return (
  <div>
    <h2>Products</h2>

    <div className="file-upload-wrapper">
      <label htmlFor="csvUpload" className="file-upload-label">
        📁 Upload CSV
      </label>
      <input
        id="csvUpload"
        type="file"
        accept=".csv"
        onChange={uploadCSV}
        className="file-upload-input"
      />
    </div>

    <table className="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Update</th>
        </tr>
      </thead>
      <tbody>
        {products.map(p => (
          <tr key={p.id}>
            <td>{p.id}</td>
            <td>{p.title}</td>
            <td>₹{p.price}</td>
            <td>{p.stock}</td>
            <td>
              <button onClick={() => updateStock(p.id, p.stock + 1)}>+1</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="pagination">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
      <span>{page} / {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  </div>
);
}