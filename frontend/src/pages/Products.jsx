import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import QuantitySelector from "../components/QuantitySelector";
import Orders from "./Orders";

/* ===============================
   CLOUDINARY CONFIG
=============================== */
const CLOUD_NAME = "dntjt9qhl";
const buildImageUrl = (width, publicId) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;

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

  /* ===============================
     SYNC URL
  =============================== */
  useEffect(() => {
    setSearchParams({
      page,
      ...(sort && { sort }),
      ...(gender && { gender }),
      ...(category && { category })
    });
  }, [page, sort, gender, category, setSearchParams]);

  /* ===============================
     FETCH PRODUCTS
  =============================== */
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

  /* ===============================
     PRELOAD FIRST IMAGE
  =============================== */
  useEffect(() => {
    if (products.length > 0) {
      const firstImage = buildImageUrl(400, products[0].image_url);

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = firstImage;

      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [products]);

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
    <div className="home-layout">
      <div className="left-content">
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

          {totalProducts > 0 && (
            <p className="product-count">
              Showing {start}–{end} of {totalProducts} products
            </p>
          )}

          {loading && <p>Loading...</p>}
          {error && <p className="error-text">{error}</p>}

          {/* Product Grid */}
          <div className="product-grid">
            {products.map((p) => {
              const cartItem = cart.find(item => item.product_id === p.id);

              return (
                <div key={p.id} className="product-card">

                  <img
                    src={buildImageUrl(300, p.image_url)}
                    srcSet={`
                      ${buildImageUrl(200, p.image_url)} 200w,
                      ${buildImageUrl(400, p.image_url)} 400w,
                      ${buildImageUrl(800, p.image_url)} 800w
                    `}
                    sizes="(max-width: 600px) 200px, 300px"
                    alt={p.title}
                    className="product-image"
                    loading="lazy"
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

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}

        </div>
      </div>

      {localStorage.getItem("token") && (
        <div className="right-sidebar">
          <Orders />
        </div>
      )}
    </div>
  );
}