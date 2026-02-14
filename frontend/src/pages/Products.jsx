import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import QuantitySelector from "../components/QuantitySelector";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get("page")) || 1;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  const { cart, addToCart, updateQuantity } = useCart();

  const limit = 14;

  // Sync state to URL
  useEffect(() => {
    setSearchParams({
      page,
      ...(sort && { sort }),
      ...(gender && { gender }),
      ...(category && { category })
    });
  }, [page, sort, gender, category]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page,
          ...(sort && { sort }),
          ...(gender && { gender }),
          ...(category && { category })
        });

        const res = await api.get(`/products?${params.toString()}`);

        setProducts(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotalProducts(res.data.total);
      } catch {
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, sort, gender, category]);

  const start = totalProducts === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalProducts);

  const getPageNumbers = () => {
    const pages = [];
    const windowSize = 2;

    const startPage = Math.max(1, page - windowSize);
    const endPage = Math.min(totalPages, page + windowSize);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="products-container">
      <h2 className="page-title">Products</h2>

      {/* Filters */}
      <div className="filter-bar">
        <select value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }}>
          <option value="">Sort</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>

        <select value={gender} onChange={(e) => { setPage(1); setGender(e.target.value); }}>
          <option value="">All Genders</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Boys">Boys</option>
          <option value="Girls">Girls</option>
        </select>

        <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
          <option value="">All Categories</option>
          <option value="Apparel">Apparel</option>
          <option value="Footwear">Footwear</option>
        </select>
      </div>

      {/* Count */}
      {totalProducts > 0 && (
        <p className="product-count">
          Showing {start}–{end} of {totalProducts} products
        </p>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* Grid */}
      <div className="product-grid">
        {products.map((p) => {
          const cartItem = cart.find(
            (item) => item.product_id === p.id
          );

          return (
            <div key={p.id} className="product-card">
              <img
                src={`http://localhost:5000/uploads/${p.image_url}`}
                alt={p.title}
                className="product-image"
              />

              <h4>{p.title}</h4>
              <p className="product-price">₹{p.price}</p>

              {cartItem ? (
                <QuantitySelector
                  quantity={cartItem.quantity}
                  onDecrease={() =>
                    updateQuantity(cartItem.id, cartItem.quantity - 1)
                  }
                  onIncrease={() =>
                    updateQuantity(cartItem.id, cartItem.quantity + 1)
                  }
                />
              ) : (
                <button
                  className="primary-btn"
                  onClick={() => addToCart(p)}
                >
                  Add to Cart
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>

          {getPageNumbers().map((num) => (
            <button
              key={num}
              className={page === num ? "active-page" : ""}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}

          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}