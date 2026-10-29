import React, { useEffect, useState } from 'react';
import { api, getStoredUser, jsonBody } from '../services/api';

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

const emptyAddress = {
  shipping_name: '',
  shipping_email: '',
  shipping_phone: '',
  shipping_address: '',
  shipping_city: '',
  shipping_state: '',
  shipping_postal_code: '',
  shipping_country: 'India',
  notes: '',
};

export default function CheckoutPage({ sessionId }) {
  const [cart, setCart] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user] = useState(getStoredUser);

  useEffect(() => {
    if (!user) {
      window.location.replace(`/login?next=${encodeURIComponent('/checkout')}`);
      return;
    }

    Promise.all([
      api(`/api/cart/?session_id=${encodeURIComponent(sessionId)}`),
      api('/api/auth/profile/'),
    ]).then(([cartData, profile]) => {
      setCart(cartData);
      setAddress({
        ...emptyAddress,
        shipping_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        shipping_email: profile.email || '',
        shipping_phone: profile.profile?.phone || '',
        shipping_address: profile.profile?.address || '',
        shipping_city: profile.profile?.city || '',
        shipping_state: profile.profile?.state || '',
        shipping_postal_code: profile.profile?.postal_code || '',
        shipping_country: profile.profile?.country || 'India',
      });
    }).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, [sessionId, user]);

  function updateField(event) {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function placeOrder(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await api('/api/orders/create/', {
        method: 'POST',
        body: jsonBody({ ...address, session_id: sessionId, payment_method: 'COD' }),
      });
      window.location.assign(`/account?placed=${encodeURIComponent(result.order.order_number)}`);
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  }

  if (!user) return <main className="narrow-page"><p className="loading-state">Taking you to sign in…</p></main>;
  if (loading) return <main className="narrow-page"><p className="loading-state">Preparing checkout…</p></main>;
  if (!cart?.items?.length) {
    return (
      <main className="narrow-page empty-state">
        <span className="eyebrow">CHECKOUT</span><h1>Your bag is empty.</h1>
        <p>Add a few favorites before checking out.</p><a className="button button-primary" href="/">Back to the shop</a>
      </main>
    );
  }

  return (
    <main className="section-wrap content-page">
      <div className="page-title-row"><div><span className="eyebrow">ALMOST YOURS</span><h1>Checkout</h1></div><a className="back-link" href="/cart">← Back to bag</a></div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={placeOrder}>
          <section className="checkout-section">
            <div className="checkout-heading"><span className="step-number">01</span><div><h2>Where should we send it?</h2><p>We’ll use these details for your delivery.</p></div></div>
            <div className="form-grid">
              <label className="field full-field">Full name<input required name="shipping_name" value={address.shipping_name} onChange={updateField} autoComplete="name" /></label>
              <label className="field">Email address<input required type="email" name="shipping_email" value={address.shipping_email} onChange={updateField} autoComplete="email" /></label>
              <label className="field">Phone number<input required type="tel" name="shipping_phone" value={address.shipping_phone} onChange={updateField} autoComplete="tel" /></label>
              <label className="field full-field">Street address<textarea required name="shipping_address" rows="2" value={address.shipping_address} onChange={updateField} autoComplete="street-address" /></label>
              <label className="field">City<input required name="shipping_city" value={address.shipping_city} onChange={updateField} autoComplete="address-level2" /></label>
              <label className="field">State<input required name="shipping_state" value={address.shipping_state} onChange={updateField} autoComplete="address-level1" /></label>
              <label className="field">PIN code<input required name="shipping_postal_code" value={address.shipping_postal_code} onChange={updateField} autoComplete="postal-code" /></label>
              <label className="field">Country<input required name="shipping_country" value={address.shipping_country} onChange={updateField} autoComplete="country-name" /></label>
              <label className="field full-field">Delivery note <span className="optional">(optional)</span><textarea name="notes" rows="2" value={address.notes} onChange={updateField} /></label>
            </div>
          </section>
          <section className="checkout-section payment-section">
            <div className="checkout-heading"><span className="step-number">02</span><div><h2>How would you like to pay?</h2><p>Simple, safe, and no card details needed.</p></div></div>
            <label className="payment-choice">
              <input type="radio" name="payment" value="COD" checked readOnly />
              <span className="payment-icon">₹</span><span><strong>Cash on delivery</strong><small>Pay in cash when your order arrives.</small></span><span className="payment-check">✓</span>
            </label>
          </section>
          <button className="button button-primary full-button place-order-button" type="submit" disabled={submitting}>
            {submitting ? 'Placing your order…' : 'Place order'} <span>→</span>
          </button>
        </form>
        <aside className="order-summary checkout-summary">
          <span className="eyebrow">IN YOUR BAG</span>
          {cart.items.map((item) => (
            <div className="checkout-item" key={item.id}>
              <span className="checkout-item-quantity">{item.quantity}</span>
              <span>{item.product.name}</span><strong>{money(item.subtotal)}</strong>
            </div>
          ))}
          <div className="summary-line"><span>Subtotal</span><span>{money(cart.total_amount)}</span></div>
          <div className="summary-line"><span>Delivery</span><span className="free-label">On us</span></div>
          <div className="summary-total"><span>Total due on delivery</span><strong>{money(cart.total_amount)}</strong></div>
          <p className="summary-note">Your order is reserved when placed. Payment is collected by the courier on delivery.</p>
        </aside>
      </div>
    </main>
  );
}
