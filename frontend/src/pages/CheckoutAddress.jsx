import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./CheckoutAddress.css";

export default function CheckoutAddress() {
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address_line: ""
  });

  const autocompleteRef = useRef(null);
  const navigate = useNavigate();

  /* ==============================
     INITIAL LOAD
  ============================== */

  useEffect(() => {
    loadAddresses();
    loadGoogleScript();
  }, []);

  /* ==============================
     LOAD SAVED ADDRESSES
  ============================== */

  const loadAddresses = async () => {
    try {
      const res = await api.get("/addresses");
      setAddresses(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  /* ==============================
     LOAD GOOGLE SCRIPT DYNAMICALLY
  ============================== */

  const loadGoogleScript = () => {
    if (window.google) {
      setGoogleLoaded(true);
      initAutocomplete();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setGoogleLoaded(true);
      initAutocomplete();
    };

    document.body.appendChild(script);
  };

  /* ==============================
     INIT AUTOCOMPLETE
  ============================== */

  const initAutocomplete = () => {
    if (!window.google || !autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      autocompleteRef.current,
      {
        types: ["geocode"],
        componentRestrictions: { country: "in" }
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.formatted_address) return;

      setForm(prev => ({
        ...prev,
        address_line: place.formatted_address
      }));
    });
  };

  /* ==============================
     SAVE ADDRESS
  ============================== */

  const saveAddress = async () => {
    if (!form.address_line || !form.full_name || !form.phone) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);

      await api.post("/addresses", form);

      setForm({
        full_name: "",
        phone: "",
        address_line: ""
      });

      await loadAddresses();

    } catch (err) {
      alert(err.response?.data?.error || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     CONTINUE TO PAYMENT
  ============================== */

  const continueToPayment = async () => {
    if (!selected) {
      alert("Select address");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/orders/checkout", {
        addressId: selected
      });

      navigate(`/checkout/payment?orderId=${res.data.orderId}`);
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     UI
  ============================== */

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h2 className="checkout-title">Select Address</h2>

        {/* ================= ADDRESS FORM ================= */}

        <div className="address-form">
          <input
            ref={autocompleteRef}
            className="input-field"
            placeholder="Enter Full Address"
            value={form.address_line}
            onChange={e =>
              setForm({ ...form, address_line: e.target.value })
            }
          />

          <input
            className="input-field"
            placeholder="Full Name"
            value={form.full_name}
            onChange={e =>
              setForm({ ...form, full_name: e.target.value })
            }
          />

          <input
            className="input-field"
            placeholder="Phone"
            value={form.phone}
            onChange={e =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <button
            className="btn-primary"
            onClick={saveAddress}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Address"}
          </button>
        </div>

        <hr className="divider" />

        {/* ================= SAVED ADDRESSES ================= */}

        <div className="saved-addresses">
          {addresses.length === 0 && (
            <p>No saved addresses yet</p>
          )}

          {addresses.map(addr => (
            <label key={addr.id} className="address-item">
              <input
                type="radio"
                name="address"
                onChange={() => setSelected(addr.id)}
              />
              <div>
                <strong>{addr.full_name}</strong>
                <p>{addr.address_line}</p>
                <span>
                  {addr.city}, {addr.state}
                </span>
              </div>
            </label>
          ))}
        </div>

        <button
          className="btn-success"
          onClick={continueToPayment}
          disabled={loading}
        >
          {loading ? "Processing..." : "Continue to Payment"}
        </button>
      </div>
    </div>
  );
}