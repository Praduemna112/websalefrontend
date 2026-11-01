import React, { useCallback, useEffect, useState } from 'react';
import { api, jsonBody, unwrapList } from '../services/api';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function AdminPage({ currentUserId, isSuperuser = false }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [productForm, setProductForm] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState('overview');

  const loadDashboard = useCallback(async () => {
    const [productData, categoryData, orderData, paymentData] = await Promise.all([
      api('/api/products/?page_size=100'),
      api('/api/categories/?page_size=100'),
      api('/api/orders/'),
      api('/api/payments/'),
    ]);
    setProducts(unwrapList(productData));
    setCategories(unwrapList(categoryData));
    setOrders(Array.isArray(orderData) ? orderData : orderData.results || []);
    setPayments(Array.isArray(paymentData) ? paymentData : paymentData.results || []);
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      setUsers(unwrapList(await api('/api/auth/users/')));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, [loadDashboard]);

  useEffect(() => {
    if (isSuperuser) loadUsers().catch((loadError) => setError(loadError.message));
  }, [isSuperuser, loadUsers]);

  async function refreshData() {
    await loadDashboard();
    if (isSuperuser) await loadUsers();
  }

  function editUser(userId, field, value) {
    setUsers((current) => current.map((user) => {
      if (user.id !== userId) return user;
      const updated = { ...user, [field]: value };
      if (field === 'is_superuser' && value) updated.is_staff = true;
      if (field === 'is_staff' && !value) updated.is_superuser = false;
      return updated;
    }));
  }

  async function saveUser(user) {
    setSavingUserId(user.id);
    setError('');
    setNotice('');
    try {
      const updatedUser = await api(`/api/auth/users/${user.id}/`, {
        method: 'PATCH',
        body: jsonBody({
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active,
          is_staff: user.is_staff,
          is_superuser: user.is_superuser,
        }),
      });
      setUsers((current) => current.map((item) => item.id === updatedUser.id ? updatedUser : item));
      setNotice(`User ${updatedUser.username} updated.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingUserId(null);
    }
  }

  function startProduct(product) {
    setReadingImage(false);
    setProductForm(product ? {
      id: product.id,
      name: product.name,
      category: product.category || '',
      description: product.description || '',
      price: product.price,
      original_price: product.original_price || '',
      stock: product.stock,
      image_url: product.image_url || '',
      image_mode: product.image_url?.startsWith('data:image/') ? 'upload' : 'url',
      is_active: product.is_active,
    } : {
      name: '',
      category: '',
      description: '',
      price: '',
      original_price: '',
      stock: 0,
      image_url: '',
      image_mode: 'url',
      is_active: true,
    });
    setError('');
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (productForm.image_error) {
      setError(productForm.image_error);
      return;
    }
    if (readingImage) {
      setError('Wait for the selected image to finish loading.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      ...productForm,
      category: productForm.category ? Number(productForm.category) : null,
      price: Number(productForm.price),
      original_price: productForm.original_price ? Number(productForm.original_price) : null,
      stock: Number(productForm.stock),
    };
    delete payload.image_mode;
    delete payload.image_error;
    const path = productForm.id ? `/api/products/${productForm.id}/` : '/api/products/';
    try {
      await api(path, { method: productForm.id ? 'PATCH' : 'POST', body: jsonBody(payload) });
      setProductForm(null);
      setNotice(productForm.id ? 'Product updated.' : 'Product created.');
      await loadDashboard();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function chooseProductImage(file) {
    if (!file) return;
    if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
      const message = 'Choose a JPEG, PNG, WebP, or GIF image.';
      setProductForm((current) => current && ({ ...current, image_error: message }));
      setError(message);
      return;
    }
    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      const message = 'Product images must be 5 MB or smaller.';
      setProductForm((current) => current && ({ ...current, image_error: message }));
      setError(message);
      return;
    }

    setReadingImage(true);
    setProductForm((current) => current && ({ ...current, image_error: '' }));
    const reader = new FileReader();
    reader.onload = () => {
      setProductForm((current) => current && ({
        ...current,
        image_mode: 'upload',
        image_url: String(reader.result || ''),
        image_error: '',
      }));
      setReadingImage(false);
      setError('');
    };
    reader.onerror = () => {
      const message = 'Could not read the selected image. Please try another file.';
      setProductForm((current) => current && ({ ...current, image_error: message }));
      setReadingImage(false);
      setError(message);
    };
    reader.readAsDataURL(file);
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete “${product.name}”?`)) return;
    setError('');
    try {
      await api(`/api/products/${product.id}/`, { method: 'DELETE' });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice('Product deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function createCategory(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await api('/api/categories/', { method: 'POST', body: jsonBody({ name: categoryName.trim() }) });
      setCategoryName('');
      setNotice('Category created.');
      await loadDashboard();
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function updateOrder(order, status) {
    setError('');
    setNotice('');
    try {
      const result = await api(`/api/orders/${encodeURIComponent(order.order_number)}/status/`, {
        method: 'PATCH',
        body: jsonBody({ status }),
      });
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
      setNotice(`Order ${order.order_number} updated.`);
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  const revenue = orders
    .filter((order) => order.status !== 'CANCELLED')
    .reduce((sum, order) => sum + Number(order.total_amount), 0);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <span className="eyebrow">YOUR STORE</span>
        <h1>Little by little,<br /><em>big things.</em></h1>
        <nav className="admin-nav" aria-label="Admin sections">
          {[['overview', 'Overview'], ['products', 'Products'], ['orders', 'Orders'], ['categories', 'Categories'], ...(isSuperuser ? [['users', 'Users']] : [])].map(([key, label]) => (
            <button type="button" className={section === key ? 'admin-nav-item active' : 'admin-nav-item'} key={key} onClick={() => setSection(key)}>
              <span>{label}</span><span>↗</span>
            </button>
          ))}
        </nav>
        <a className="admin-store-link" href="/">← Back to store</a>
      </aside>
      <section className="admin-content">
        <div className="admin-topbar"><div><span className="eyebrow">WEBSALE / ADMIN</span><h2>{section[0].toUpperCase() + section.slice(1)}</h2></div><button className="button button-outline" type="button" onClick={() => refreshData().catch((loadError) => setError(loadError.message))}>↻ Refresh data</button></div>
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        {notice && <div className="notice notice-success" role="status">{notice}</div>}
        {loading ? <p className="loading-state">Gathering your store data…</p> : (
          <>
            {section === 'overview' && (
              <>
                <div className="stat-grid">
                  <article className="stat-card"><span>Active products</span><strong>{products.filter((item) => item.is_active).length}</strong><small>Across {categories.length} categories</small></article>
                  <article className="stat-card"><span>All orders</span><strong>{orders.length}</strong><small>{orders.filter((item) => item.status === 'PENDING').length} need a look</small></article>
                  <article className="stat-card"><span>Order value</span><strong>{money(revenue)}</strong><small>Excludes cancelled orders</small></article>
                  <article className="stat-card"><span>Payments on file</span><strong>{payments.length}</strong><small>Customer payments</small></article>
                  {isSuperuser && <article className="stat-card"><span>Registered users</span><strong>{users.length}</strong><small>Active and inactive accounts</small></article>}
                </div>
                <section className="admin-panel">
                  <div className="panel-heading panel-heading-row"><div><span className="eyebrow">FRESH FROM THE SHOP</span><h3>Recent orders</h3></div><button className="text-link" onClick={() => setSection('orders')} type="button">All orders →</button></div>
                  <OrderTable orders={orders.slice(0, 6)} onUpdate={updateOrder} />
                </section>
                <section className="admin-panel">
                  <div className="panel-heading"><span className="eyebrow">KEEP AN EYE ON IT</span><h3>Stock watch</h3></div>
                  <div className="stock-watch">{products.filter((item) => item.stock < 5).slice(0, 6).map((product) => <div key={product.id}><span>{product.name}</span><strong className={product.stock === 0 ? 'stock-zero' : ''}>{product.stock} left</strong></div>)}
                    {!products.some((item) => item.stock < 5) && <p>Looking good—no low-stock products.</p>}
                  </div>
                </section>
              </>
            )}
            {section === 'products' && (
              <section className="admin-panel">
                <div className="panel-heading panel-heading-row"><div><span className="eyebrow">THE CATALOG</span><h3>Products <small>({products.length})</small></h3></div><button className="button button-primary" type="button" onClick={() => startProduct(null)}>+ Add product</button></div>
                {productForm && (
                  <form className="admin-form" onSubmit={saveProduct}>
                    <div className="panel-heading"><h3>{productForm.id ? 'Edit product' : 'New product'}</h3></div>
                    <div className="form-grid">
                      <label className="field">Product name<input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
                      <label className="field">Category<select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                      <label className="field">Price (₹)<input required type="number" min="0.01" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></label>
                      <label className="field">Original price (₹)<input type="number" min="0" step="0.01" value={productForm.original_price} onChange={(event) => setProductForm({ ...productForm, original_price: event.target.value })} /></label>
                      <label className="field">Stock<input required type="number" min="0" step="1" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} /></label>
                      <label className="field">Image source<select value={productForm.image_mode} onChange={(event) => { setProductForm({ ...productForm, image_mode: event.target.value, image_url: '', image_error: '' }); setError(''); }}><option value="url">Image URL</option><option value="upload">Upload image (saved as Base64)</option></select></label>
                      {productForm.image_mode === 'url' ? (
                        <label className="field">Image URL<input type="url" value={productForm.image_url.startsWith('data:') ? '' : productForm.image_url} onChange={(event) => setProductForm({ ...productForm, image_url: event.target.value })} placeholder="https://example.com/image.jpg" /></label>
                      ) : (
                        <label className="field">Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseProductImage(event.target.files[0])} /><small>JPEG, PNG, WebP, or GIF; up to 5 MB.</small></label>
                      )}
                      {productForm.image_url && <div className="product-image-preview"><img src={productForm.image_url} alt="Product preview" /></div>}
                      <label className="field full-field">Description<textarea rows="3" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label>
                      <label className="checkbox-field"><input type="checkbox" checked={productForm.is_active} onChange={(event) => setProductForm({ ...productForm, is_active: event.target.checked })} /> Visible in the shop</label>
                    </div>
                    <div className="form-actions"><button className="button button-primary" disabled={saving || readingImage} type="submit">{readingImage ? 'Loading image…' : saving ? 'Saving…' : 'Save product'}</button><button className="button button-outline" type="button" onClick={() => setProductForm(null)}>Cancel</button></div>
                  </form>
                )}
                <div className="table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>
                  {products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.category_name || '—'}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><span className={`status-pill ${product.is_active ? 'status-confirmed' : 'status-cancelled'}`}>{product.is_active ? 'Live' : 'Hidden'}</span></td><td><div className="table-actions"><button onClick={() => startProduct(product)} type="button">Edit</button><button className="danger-text" onClick={() => deleteProduct(product)} type="button">Delete</button></div></td></tr>)}
                  {!products.length && <tr><td colSpan="6">No products in the catalog yet.</td></tr>}
                </tbody></table></div>
              </section>
            )}
            {section === 'orders' && <section className="admin-panel"><div className="panel-heading"><span className="eyebrow">FROM YOUR CUSTOMERS</span><h3>Order management</h3></div><OrderTable orders={orders} onUpdate={updateOrder} /></section>}
            {section === 'categories' && (
              <section className="admin-panel">
                <div className="panel-heading"><span className="eyebrow">ORGANIZE THE GOOD STUFF</span><h3>Categories</h3></div>
                <form className="category-form" onSubmit={createCategory}><label className="field">New category<input required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Home & living" /></label><button className="button button-primary" type="submit">Add category</button></form>
                <div className="category-admin-list">{categories.map((category) => <div key={category.id}><div><strong>{category.name}</strong><span>{category.products_count || 0} products</span></div><span className="category-slug">{category.slug}</span></div>)}{!categories.length && <p>No categories yet.</p>}</div>
              </section>
            )}
            {section === 'users' && isSuperuser && (
              <section className="admin-panel">
                <div className="panel-heading panel-heading-row">
                  <div><span className="eyebrow">ACCOUNT ACCESS</span><h3>Users <small>({users.length} total)</small></h3></div>
                  <span className="user-count-note">{users.filter((user) => user.is_active).length} active</span>
                </div>
                <p className="user-admin-help">Only superusers can manage accounts. Superusers have full Django administration access; staff accounts can manage the store.</p>
                {usersLoading ? <p className="loading-state">Loading users…</p> : (
                  <div className="table-scroll"><table className="admin-table user-admin-table"><thead><tr>
                    <th>ID</th><th>Username</th><th>Email</th><th>First name</th><th>Last name</th><th>Joined</th><th>Last login</th><th>Active</th><th>Staff</th><th>Superuser</th><th>Actions</th>
                  </tr></thead><tbody>
                    {users.map((user) => {
                      const isCurrentUser = user.id === currentUserId;
                      return <tr key={user.id}>
                        <td>{user.id}</td>
                        <td><input aria-label={`Username for ${user.username}`} className="user-admin-input" value={user.username} onChange={(event) => editUser(user.id, 'username', event.target.value)} /></td>
                        <td><input aria-label={`Email for ${user.username}`} className="user-admin-input" type="email" value={user.email || ''} onChange={(event) => editUser(user.id, 'email', event.target.value)} /></td>
                        <td><input aria-label={`First name for ${user.username}`} className="user-admin-input" value={user.first_name || ''} onChange={(event) => editUser(user.id, 'first_name', event.target.value)} /></td>
                        <td><input aria-label={`Last name for ${user.username}`} className="user-admin-input" value={user.last_name || ''} onChange={(event) => editUser(user.id, 'last_name', event.target.value)} /></td>
                        <td>{user.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—'}</td>
                        <td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                        {['is_active', 'is_staff', 'is_superuser'].map((field) => (
                          <td key={field}><input
                            aria-label={`${field.replace('is_', '').replace('_', ' ')} for ${user.username}`}
                            type="checkbox"
                            checked={Boolean(user[field])}
                            // disabled={isCurrentUser}
                            onChange={(event) => editUser(user.id, field, event.target.checked)}
                          /></td>
                        ))}
                        <td><button className="table-action-button" type="button"  onClick={() => saveUser(user)}>{savingUserId === user.id ? 'Saving…' : 'Save'}</button></td>
                      </tr>;
                    })}
                    {!users.length && <tr><td colSpan="11">No users found.</td></tr>}
                  </tbody></table></div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function OrderTable({ orders, onUpdate }) {
  if (!orders.length) return <p className="empty-table">Nothing to see here yet. Orders will show up when customers check out.</p>;
  return (
    <div className="table-scroll"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
      {orders.map((order) => <tr key={order.id}>
        <td><strong>{order.order_number}</strong></td>
        <td>{order.shipping_name}</td>
        <td>{new Date(order.created_at).toLocaleDateString()}</td>
        <td>{money(order.total_amount)}</td>
        <td><span>{order.payment?.payment_method || '—'}</span><small className="table-subtext">{order.payment?.payment_status || ''}</small></td>
        <td><select aria-label={`Update status for ${order.order_number}`} value={order.status} onChange={(event) => onUpdate(order, event.target.value)}>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
      </tr>)}
    </tbody></table></div>
  );
}
