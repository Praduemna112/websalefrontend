import React, { useEffect, useState } from 'react';
import { api, unwrapList } from '../services/api';

function ProductCard({ product, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
  const discountPercent = product.discount_percentage || (hasDiscount
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : 0);

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
        {hasDiscount && discountPercent > 0 && (
          <span className="sale-tag">{discountPercent}% OFF</span>
        )}
      </div>
      <div className="product-info">
        <span className="product-category">{product.category_name || 'WebSale edit'}</span>
        <h2>{product.name}</h2>
        <p className="product-description">{product.description || 'A considered choice for everyday living.'}</p>
        {product.stock > 0 && product.stock < 6 && (
          <div className={`stock-warning${product.stock === 1 ? ' stock-critical' : ''}`}>
            <span className="stock-dot" />
            {product.stock === 1 ? 'Only 1 left!' : `Only ${product.stock} remaining`}
          </div>
        )}
        <div className="product-buy-row">
          <span className="product-price">
            ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            {hasDiscount && (
              <>
                <del>₹{Number(product.original_price).toLocaleString('en-IN')}</del>
                <span className="discount-tag">({discountPercent}% OFF)</span>
              </>
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
          const loadedCategories = unwrapList(categoryData).filter((c) => c.is_active !== false);
          const loadedProducts = unwrapList(productData).filter((p) => {
            if (p.is_active === false) return false;
            if (p.category_is_active === false) return false;
            if (p.category && loadedCategories.length > 0) {
              const catExists = loadedCategories.some((c) => c.id === p.category);
              if (!catExists) return false;
            }
            return true;
          });
          setCategories(loadedCategories);
          setProducts(loadedProducts);
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

  useEffect(() => {
    if (category && categories.length && !categories.some((c) => String(c.id) === String(category))) {
      setCategory('');
    }
  }, [categories, category]);

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
