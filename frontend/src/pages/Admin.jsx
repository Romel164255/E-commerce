import { useState } from "react";
import api from "../api/axios";

export default function Admin() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const addProduct = async () => {
    try {
      await api.post("/products", { name, price });
      alert("Product added!");
    } catch (err) {
      alert("Not authorized");
    }
  };

  return (
    <div>
      <h2>Admin Panel</h2>

      <input
        placeholder="Product Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Price"
        onChange={(e) => setPrice(e.target.value)}
      />

      <button onClick={addProduct}>Add Product</button>
    </div>
  );
}