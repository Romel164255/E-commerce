import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";

import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import CheckoutAddress from "./pages/CheckoutAddress";
import CheckoutPayment from "./pages/CheckoutPayment";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>

        <Route index element={<Products />} />
        <Route path="cart" element={<Cart />} />
        <Route path="orders" element={<Orders />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="admin" element={<Admin />} />
        <Route path="checkout/address" element={<CheckoutAddress />} />
        <Route path="checkout/payment" element={<CheckoutPayment />} />

      </Route>
    </Routes>
  );
}

export default App;