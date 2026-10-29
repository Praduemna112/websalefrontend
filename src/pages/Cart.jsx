import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function CartPage({ sessionId, onCartChange }) {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadCart = useCallback(async () => {
    const result = await api(`/api/cart/?session_id=${encodeURIComponent(sessionId)}`);
    setCart(result);
    setError('');
  }, [sessionId]);

  useEffect(() => {
    loadCart().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, [loadCart]);

  async function changeItem(itemId, method, quantity) {
    setUpdatingId(itemId);
    setError('');
    try {
      const result = await api(`/api/cart/items/${itemId}/?session_id=${encodeURIComponent(sessionId)}`, {
        method,
        ...(method === 'PUT' ? { body: JSON.stringify({ quantity }) } : {}),
      });
      setCart(result.cart);
      await onCartChange();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <main className="narrow-page"><p className="loading-state">Opening your bag…</p></main>;
  if (error && !cart) return <main className="narrow-page"><div className="notice notice-error">{error}</div></main>;

  return (
    <main className="section-wrap content-page">
      <div className="page-title-row">
        <div><span className="eyebrow">YOUR PICKS</span><h1>Your bag <span className="muted-count">({cart?.total_items || 0})</span></h1></div>
        <a className="back-link" href="/">← Keep browsing</a>
      </div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {cart?.items?.length ? (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-image">
                  {item.product.image_url ? <img src={item.product.image_url} alt="" /> : <span>{item.product.name.slice(0, 1)}</span>}
                </div>
                <div className="cart-item-details">
                  <span className="product-category">{item.product.category_name || 'WebSale edit'}</span>
                  <h2>{item.product.name}</h2>
                  <span className="cart-unit-price">{money(item.product.price)} each</span>
                  <div className="quantity-control">
                    <button disabled={updatingId === item.id || item.quantity <= 1} onClick={() => changeItem(item.id, 'PUT', item.quantity - 1)} type="button" aria-label="Decrease quantity">−</button>
                    <span>{item.quantity}</span>
                    <button disabled={updatingId === item.id || item.quantity >= item.product.stock} onClick={() => changeItem(item.id, 'PUT', item.quantity + 1)} type="button" aria-label="Increase quantity">+</button>
                    <button className="remove-link" disabled={updatingId === item.id} onClick={() => changeItem(item.id, 'DELETE')} type="button">Remove</button>
                  </div>
                </div>
                <strong className="cart-subtotal">{money(item.subtotal)}</strong>
              </article>
            ))}
          </div>
          <aside className="order-summary">
            <span className="eyebrow">ORDER SUMMARY</span>
            <div className="summary-line"><span>Subtotal</span><span>{money(cart.total_amount)}</span></div>
            <div className="summary-line"><span>Delivery</span><span className="free-label">On us</span></div>
            <div className="summary-total"><span>Total</span><strong>{money(cart.total_amount)}</strong></div>
            <p className="summary-note">Pay in cash when your order arrives.</p>
            <a className="button button-primary full-button" href="/checkout">Continue to checkout <span>→</span></a>
          </aside>
        </div>
      ) : (
        <div className="empty-state cart-empty">
          <div className="empty-bag">♡</div>
          <h2>Your bag is taking a little break.</h2>
          <p>When you find something you love, it’ll be waiting here.</p>
          <a className="button button-primary" href="/">Explore the shop</a>
        </div>
      )}
    </main>
  );
}
