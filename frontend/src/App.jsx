import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import "./App.css";

const Products = lazy(() => import("./pages/Products"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Auth = lazy(() => import("./pages/Auth"));
const OAuthHandler = lazy(() => import("./pages/OAuthHandler"));
const CheckoutAddress = lazy(() => import("./pages/CheckoutAddress"));
const CheckoutPayment = lazy(() => import("./pages/CheckoutPayment"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductsAdmin = lazy(() => import("./pages/admin/ProductsAdmin"));
const UsersAdmin = lazy(() => import("./pages/admin/UsersAdmin"));
const OrdersAdmin = lazy(() => import("./pages/admin/OrdersAdmin"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const TicketsAdmin = lazy(() => import("./pages/admin/TicketsAdmin"));
const AdminTicketDetail = lazy(() => import("./pages/admin/AdminTicketDetail"));
const Tickets = lazy(() => import("./pages/Tickets"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));

function RouteFallback() {
  return <p>Loading...</p>;
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="oauth" element={<OAuthHandler />} />
          <Route index element={<Products />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="auth" element={<Auth />} />
          <Route path="checkout/address" element={<CheckoutAddress />} />
          <Route path="checkout/payment" element={<CheckoutPayment />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="tickets" element={<TicketsAdmin />} />
            <Route path="tickets/:id" element={<AdminTicketDetail />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
