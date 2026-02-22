import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const { data } = await api.get("/admin/products");
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const updateStock = async (id, stock) => {
    await api.patch(`/admin/products/${id}`, { stock });
    fetchProducts();
  };

  return (
    <div>
      <h2>Products</h2>

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
                <button onClick={() => updateStock(p.id, p.stock + 1)}>
                  +1
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}