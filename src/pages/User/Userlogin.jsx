import React, { useState } from 'react';
import './UserAuth.css';
import { api, getCartSessionId, jsonBody } from '../../services/api';

export default function Userlogin({ onSuccess }) {
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice('');
    setHasError(false);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await api('/api/auth/login/', {
        method: 'POST',
        body: jsonBody({
          username: formData.get('username').trim(),
          password: formData.get('password'),
          session_id: getCartSessionId(),
        }),
      });
      onSuccess(result);
    } catch (error) {
      setHasError(true);
      setNotice(error.message || 'Unable to sign in. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase" aria-label="Welcome to WebSale">
        <a className="auth-brand" href="/"><span className="auth-brand-icon" aria-hidden="true">W</span>WebSale</a>
        <div className="showcase-content">
          <span className="showcase-kicker"><span /> LITTLE THINGS, PICKED WELL</span>
          <h1>Good things happen when you find just the right thing.</h1>
          <p>Everyday favorites and thoughtful discoveries, all in one happy little shop.</p>
          <div className="showcase-art" aria-hidden="true">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-star">✳</div>
            <div className="art-card art-card-one"><span className="art-card-dot" /><i /><i /><i /></div>
            <div className="art-card art-card-two"><span className="art-avatar">W</span><span>A little something<br /><small>just for you</small></span><b>✓</b></div>
            <div className="art-card art-card-three"><span className="art-chart"><i /><i /><i /><i /><i /></span><span>Good finds ahead</span></div>
          </div>
        </div>
        <div className="showcase-footer"><span>Thoughtful finds, delivered to your door.</span><span>© WebSale</span></div>
      </section>
      <section className="auth-main">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><span className="auth-brand-icon" aria-hidden="true">W</span>WebSale</div>
          <div className="form-heading">
            <span className="form-eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Your next favorite is just around the corner.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-username">Username</label>
            <input id="login-username" name="username" type="text" placeholder="Enter your username" autoComplete="username" required />
            <label htmlFor="login-password">Password</label>
            <input id="login-password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" required />
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">→</span>
            </button>
            {notice && <p className={`auth-notice${hasError ? ' error' : ''}`} role={hasError ? 'alert' : 'status'}>{notice}</p>}
          </form>
          <div className="auth-switch">New to WebSale? <a href="/register">Create an account</a></div>
          <div className="auth-legal"><a href="/">Browse the shop</a> · Pay on delivery at checkout.</div>
        </div>
      </section>
    </main>
  );
}
