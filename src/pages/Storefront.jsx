import React, { useEffect, useState } from 'react';
import { api, unwrapList } from '../services/api';

function ProductCard({ product, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  async function addToBag() {
    setAdding(true);
    setMessage('');
    try {
      await onAdd(product);
      setMessage('Added to your bag');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="product-card">
      <div className="product-image" aria-label={product.name}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-monogram">{product.name.slice(0, 1)}</span>
        )}
        {product.original_price && Number(product.original_price) > Number(product.price) && (
          <span className="sale-tag">ON SALE</span>
        )}
      </div>
      <div className="product-info">
        <span className="product-category">{product.category_name || 'WebSale edit'}</span>
        <h2>{product.name}</h2>
        <p className="product-description">{product.description || 'A considered choice for everyday living.'}</p>
        <div className="product-buy-row">
          <span className="product-price">
            ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <del>₹{Number(product.original_price).toLocaleString('en-IN')}</del>
            )}
          </span>
          <button className="add-button" type="button" onClick={addToBag} disabled={adding || !product.stock}>
            {adding ? 'Adding…' : product.stock ? 'Add +' : 'Sold out'}
          </button>
        </div>
        {message && <p className="inline-message" role="status">{message}</p>}
      </div>
    </article>
  );
}

export default function Storefront({ sessionId, onCartChange }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (query) params.set('search', query);
        if (category) params.set('category', category);
        const productPath = `/api/products/${params.size ? `?${params.toString()}` : ''}`;
        const [productData, categoryData] = await Promise.all([
          api(productPath),
          api('/api/categories/'),
        ]);
        if (active) {
          setProducts(unwrapList(productData));
          setCategories(unwrapList(categoryData));
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [category, query]);

  async function addToCart(product) {
    await api('/api/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ product_id: product.id, quantity: 1, session_id: sessionId }),
    });
    await onCartChange();
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">THE WEBSALE COLLECTION</span>
          <h1>Find your next<br /><em>favorite thing.</em></h1>
          <p>Everyday essentials and little discoveries, picked with you in mind.</p>
          <a className="button button-light" href="#collection">Explore the collection <span>↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-circle circle-one" />
          <div className="hero-circle circle-two" />
          <div className="hero-sun" />
          <span className="hero-sticker">GOOD<br />FINDS<br />ONLY</span>
          <div className="hero-orbit-label">A little something special</div>
        </div>
        <span className="hero-index">EST. 2026&nbsp; · &nbsp;MADE FOR EVERY DAY</span>
      </section>

      <section className="collection section-wrap" id="collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SHOP THE EDIT</span>
            <h2>Good things, right this way.</h2>
          </div>
          <form className="search-form" onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}>
            <input aria-label="Search products" placeholder="Search the collection" value={search} onChange={(event) => setSearch(event.target.value)} />
            <button type="submit" aria-label="Search">⌕</button>
          </form>
        </div>
        <div className="category-row" aria-label="Filter by category">
          <button className={!category ? 'category-chip selected' : 'category-chip'} onClick={() => setCategory('')} type="button">Everything</button>
          {categories.map((item) => (
            <button className={category === String(item.id) ? 'category-chip selected' : 'category-chip'} key={item.id} onClick={() => setCategory(String(item.id))} type="button">
              {item.name}
            </button>
          ))}
        </div>
        {error && <div className="notice notice-error" role="alert">Couldn’t load products: {error}</div>}
        {loading ? (
          <p className="loading-state">Finding the good stuff…</p>
        ) : products.length ? (
          <div className="product-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
          </div>
        ) : (
          <div className="empty-state collection-empty">
            <h3>No products found just yet.</h3>
            <p>Try a different search or category.</p>
          </div>
        )}
      </section>
      <section className="promise-strip">
        <span>✳ &nbsp; Thoughtfully picked</span><span>✳ &nbsp; Easy, secure checkout</span><span>✳ &nbsp; Pay on delivery</span>
      </section>
    </main>
  );
}
