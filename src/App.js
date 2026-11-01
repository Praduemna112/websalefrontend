import React, { useCallback, useEffect, useState } from 'react';
import './Store.css';
import { api, getCartSessionId, getStoredUser, clearAuth, storeAuth } from './services/api';
import Userlogin from './pages/User/Userlogin';
import UserRegister from './pages/User/UserRegister';
import UserForgotPassword from './pages/User/UserForgotPassword';
import Storefront from './pages/Storefront';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import AccountPage from './pages/Account';
import AdminPage from './pages/Admin';

function Header({ user, cartCount, onSignOut }) {
  return (
    <header className="site-header">
      <a className="site-brand" href="/">
        <span className="brand-mark">W</span>
        <span>websale<span className="brand-period">.</span></span>
      </a>
      <nav className="site-nav" aria-label="Main navigation">
        <a href="/">Shop</a>
        {user && <a href="/account">My account</a>}
        {user?.is_staff && <a href="/admin">Store admin</a>}
      </nav>
      <div className="header-actions">
        <a className="cart-link" href="/cart" aria-label={`Cart, ${cartCount} items`}>
          Bag <span>{cartCount}</span>
        </a>
        {user ? (
          <button className="text-button" type="button" onClick={onSignOut}>Sign out</button>
        ) : (
          <a className="header-signin" href="/login">Sign in</a>
        )}
      </div>
    </header>
  );
}

function App() {
  const [user, setUser] = useState(getStoredUser);
  const [cartCount, setCartCount] = useState(0);
  const [appError, setAppError] = useState('');
  const sessionId = getCartSessionId();
  const route = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const isAuthPage = route === '/login' || route === '/register' || route === '/forgot-password';
  const userId = user?.id;

  const refreshCartCount = useCallback(async () => {
    try {
      const cart = await api(`/api/cart/?session_id=${encodeURIComponent(sessionId)}`);
      setCartCount(cart.total_items || 0);
      setAppError('');
    } catch (error) {
      setAppError(error.message);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isAuthPage) refreshCartCount();
  }, [refreshCartCount, isAuthPage]);

  useEffect(() => {
    if (route !== '/admin' || !userId) return;
    api('/api/auth/profile/')
      .then((currentUser) => {
        storeAuth({ user: currentUser, token: localStorage.getItem('websale-token') });
        setUser(currentUser);
      })
      .catch((error) => setAppError(error.message));
  }, [route, userId]);

  function signOut() {
    clearAuth();
    setUser(null);
    window.location.assign('/');
  }

  function authComplete(data) {
    storeAuth(data);
    setUser(data?.user || null);
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.assign(next || (data?.user?.is_staff ? '/admin' : '/account'));
  }

  let page;
  if (route === '/login') {
    page = <Userlogin onSuccess={authComplete} />;
  } else if (route === '/register') {
    page = <UserRegister onSuccess={authComplete} />;
  } else if (route === '/forgot-password') {
    page = <UserForgotPassword />;
  } else if (route === '/cart') {
    page = <CartPage sessionId={sessionId} onCartChange={refreshCartCount} />;
  } else if (route === '/checkout') {
    page = <CheckoutPage sessionId={sessionId} />;
  } else if (route === '/account') {
    page = user
      ? <AccountPage user={user} onProfileChange={(updatedUser) => {
        storeAuth({ user: updatedUser, token: localStorage.getItem('websale-token') });
        setUser(updatedUser);
      }} />
      : <SignInPrompt />;
  } else if (route === '/admin') {
    page = user?.is_staff
      ? <AdminPage currentUserId={user.id} isSuperuser={user.is_superuser} />
      : <SignInPrompt adminOnly />;
  } else {
    page = <Storefront sessionId={sessionId} onCartChange={refreshCartCount} />;
  }

  return (
    <>
      {!isAuthPage && (
        <Header user={user} cartCount={cartCount} onSignOut={signOut} />
      )}
      {appError && !isAuthPage && (
        <div className="app-alert" role="alert">
          Could not reach the store API: {appError}. Start Django on port 8000 and refresh.
        </div>
      )}
      {page}
      {!isAuthPage && <footer className="site-footer">Thoughtful finds, delivered to your door.</footer>}
    </>
  );
}

function SignInPrompt({ adminOnly = false }) {
  return (
    <main className="narrow-page empty-state">
      <span className="eyebrow">{adminOnly ? 'STAFF ACCESS' : 'YOUR ACCOUNT'}</span>
      <h1>{adminOnly ? 'Sign in with a staff account' : 'Sign in to continue'}</h1>
      <p>{adminOnly ? 'Store administration is available to staff accounts only.' : 'Sign in to view your account, orders, and checkout.'}</p>
      <a className="button button-primary" href={`/login?next=${encodeURIComponent(window.location.pathname)}`}>Sign in</a>
    </main>
  );
}

export default App;
