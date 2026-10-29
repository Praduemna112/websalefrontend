import React, { useEffect, useState } from 'react';
import { api, jsonBody } from '../services/api';

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function AccountPage({ user, onProfileChange }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const placedOrder = new URLSearchParams(window.location.search).get('placed');

  useEffect(() => {
    Promise.all([api('/api/auth/profile/'), api('/api/orders/')])
      .then(([profileData, orderData]) => {
        setProfile({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          ...profileData.profile,
        });
        setOrders(Array.isArray(orderData) ? orderData : orderData.results || []);
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  function updateField(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const result = await api('/api/auth/profile/', { method: 'PUT', body: jsonBody(profile) });
      onProfileChange(result.user);
      setNotice('Your details have been saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder(orderNumber) {
    if (!window.confirm(`Cancel order ${orderNumber}?`)) return;
    setError('');
    try {
      const result = await api(`/api/orders/${encodeURIComponent(orderNumber)}/cancel/`, { method: 'POST' });
      setOrders((current) => current.map((order) => order.order_number === orderNumber ? result.order : order));
    } catch (cancelError) {
      setError(cancelError.message);
    }
  }

  return (
    <main className="section-wrap content-page">
      {placedOrder && (
        <div className="order-success">
          <span className="success-icon">✓</span>
          <div><span className="eyebrow">IT’S OFFICIAL</span><h2>Your order is in!</h2><p>Order <strong>{placedOrder}</strong> is placed with cash on delivery.</p></div>
        </div>
      )}
      <div className="page-title-row"><div><span className="eyebrow">YOUR LITTLE CORNER</span><h1>Hello, {user.first_name || user.username}.</h1></div></div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {notice && <div className="notice notice-success" role="status">{notice}</div>}
      <div className="account-layout">
        <section className="account-panel">
          <div className="panel-heading"><span className="eyebrow">THE ESSENTIALS</span><h2>Your details</h2></div>
          {profile ? (
            <form className="account-form" onSubmit={saveProfile}>
              <div className="form-grid">
                <label className="field">First name<input name="first_name" value={profile.first_name} onChange={updateField} /></label>
                <label className="field">Last name<input name="last_name" value={profile.last_name} onChange={updateField} /></label>
                <label className="field full-field">Email<input required type="email" name="email" value={profile.email} onChange={updateField} /></label>
                <label className="field">Phone<input name="phone" value={profile.phone || ''} onChange={updateField} /></label>
                <label className="field">Country<input name="country" value={profile.country || 'India'} onChange={updateField} /></label>
                <label className="field full-field">Street address<textarea name="address" rows="2" value={profile.address || ''} onChange={updateField} /></label>
                <label className="field">City<input name="city" value={profile.city || ''} onChange={updateField} /></label>
                <label className="field">State<input name="state" value={profile.state || ''} onChange={updateField} /></label>
                <label className="field">PIN code<input name="postal_code" value={profile.postal_code || ''} onChange={updateField} /></label>
              </div>
              <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save my details'}</button>
            </form>
          ) : !error ? <p className="loading-state">Loading your details…</p> : null}
        </section>
        <section className="account-panel orders-panel">
          <div className="panel-heading"><span className="eyebrow">THE GOOD STUFF</span><h2>Your orders</h2></div>
          {orders.length ? (
            <div className="orders-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-top">
                    <div><span className="order-number">{order.order_number}</span><span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span></div>
                    <span className={`status-pill status-${order.status?.toLowerCase()}`}>{order.status}</span>
                  </div>
                  <div className="order-card-items">
                    {order.items.map((item) => <span key={item.id}>{item.quantity} × {item.product_name}</span>)}
                  </div>
                  <div className="order-card-bottom">
                    <span>{order.payment?.payment_method === 'COD' ? 'Cash on delivery' : order.payment?.payment_method}</span>
                    <strong>{money(order.total_amount)}</strong>
                  </div>
                  {order.status === 'PENDING' && <button className="remove-link" onClick={() => cancelOrder(order.order_number)} type="button">Cancel order</button>}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-orders"><p>No orders yet. Your next favorite is waiting.</p><a className="text-link" href="/">Explore the shop →</a></div>
          )}
        </section>
      </div>
    </main>
  );
}
