import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/products")
      .then(res => {
        setProducts(res.data.data || res.data);
      })
      .catch(err => {
        setError("Failed to load products");
        console.error(err);
      });
  }, []);

  const addToCart = async (id) => {
    try {
      await api.post("/cart", {
        productId: id,
        quantity: 1
      });
      alert("Added to cart");
    } catch (err) {
      alert("Login required");
    }
  };

  return (
    <div className="products-container">
      <h2 className="page-title">Products</h2>

      {error && <p className="error-text">{error}</p>}

      {products.length === 0 && !error && (
        <p className="empty-text">No products available</p>
      )}

      <div className="product-grid">
        {products.map(p => (
  <div key={p.id} className="product-card">

    <img
      src={`http://localhost:5000/uploads/${p.image_url}`}
      alt={p.title}
      className="product-image"
    />

    <h4 className="product-name">{p.title}</h4>

    <p className="product-price">₹{p.price}</p>

    <button
      className="primary-btn"
      onClick={() => addToCart(p.id)}
    >
      Add to Cart
    </button>

  </div>
))}
      </div>
    </div>
  );
}