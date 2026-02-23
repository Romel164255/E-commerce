import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";

import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import CheckoutAddress from "./pages/CheckoutAddress";
import CheckoutPayment from "./pages/CheckoutPayment";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import Analytics from "./pages/admin/Analytics";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>

         <Route index element={<Products />} />
         <Route path="cart" element={<Cart />} />
         <Route path="orders" element={<Orders />} />
         <Route path="auth" element={<Auth />} />
         <Route path="checkout/address" element={<CheckoutAddress />} />
         <Route path="checkout/payment" element={<CheckoutPayment />} />

  {/* ADMIN ROUTES */}
         <Route path="admin" element={<AdminLayout />}>
         <Route index element={<Dashboard />} />
         <Route path="dashboard" element={<Dashboard />} />
         <Route path="products" element={<ProductsAdmin />} />
         <Route path="users" element={<UsersAdmin />} />
         <Route path="orders" element={<OrdersAdmin />} />
         <Route path="analytics" element={<Analytics />} />
  </Route>

</Route>
    </Routes>
  );
}

export default App;