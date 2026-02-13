import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
  let url = "/products?";

  if (sort) url += `sort=${sort}&`;
  if (gender) url += `gender=${gender}&`;
  if (category) url += `category=${category}&`;

  api.get(url)
    .then(res => setProducts(res.data.data))
    .catch(err => {
      setError("Failed to load products");
      console.error(err);
    });

}, [sort, gender, category]);
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
      <div className="filter-bar">

  <select onChange={(e) => setSort(e.target.value)}>
    <option value="">Sort</option>
    <option value="price_asc">Price: Low to High</option>
    <option value="price_desc">Price: High to Low</option>
  </select>

  <select onChange={(e) => setGender(e.target.value)}>
    <option value="">All Genders</option>
    <option value="Men">Men</option>
    <option value="Women">Women</option>
    <option value="Boys">Boys</option>
    <option value="Girls">Girls</option>
  </select>

  <select onChange={(e) => setCategory(e.target.value)}>
    <option value="">All Categories</option>
    <option value="Apparel">Apparel</option>
    <option value="Footwear">Footwear</option>
  </select>

</div>

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