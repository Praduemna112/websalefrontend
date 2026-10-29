import React, { useState } from 'react';
import './UserAuth.css';
import { api, getCartSessionId, jsonBody } from '../../services/api';

export default function UserRegister({ onSuccess }) {
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get('password') !== formData.get('confirm-password')) {
      setHasError(true);
      setNotice('Your passwords do not match. Please check and try again.');
      return;
    }
    setIsSubmitting(true);
    setNotice('');
    setHasError(false);
    try {
      const result = await api('/api/auth/register/', {
        method: 'POST',
        body: jsonBody({
          username: formData.get('username').trim(),
          email: formData.get('email').trim(),
          first_name: formData.get('first_name').trim(),
          last_name: formData.get('last_name').trim(),
          password: formData.get('password'),
          session_id: getCartSessionId(),
        }),
      });
      onSuccess(result);
    } catch (error) {
      setHasError(true);
      setNotice(error.message || 'Unable to create your account. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase" aria-label="Welcome to WebSale">
        <a className="auth-brand" href="/"><span className="auth-brand-icon" aria-hidden="true">W</span>WebSale</a>
        <div className="showcase-content">
          <span className="showcase-kicker"><span /> YOUR NEXT FAVORITE AWAITS</span>
          <h1>Make a little room for things you’ll love.</h1>
          <p>Make an account to keep your favorites, check out, and follow every order.</p>
          <div className="showcase-art" aria-hidden="true">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-star">✳</div>
            <div className="art-card art-card-one"><span className="art-card-dot" /><i /><i /><i /></div>
            <div className="art-card art-card-two"><span className="art-avatar">W</span><span>Your own little corner<br /><small>Ready when you are</small></span><b>✓</b></div>
            <div className="art-card art-card-three"><span className="art-chart"><i /><i /><i /><i /><i /></span><span>Let’s get started</span></div>
          </div>
        </div>
        <div className="showcase-footer"><span>Thoughtful finds, delivered to your door.</span><span>© WebSale</span></div>
      </section>
      <section className="auth-main">
        <div className="auth-form-wrap register-form-wrap">
          <div className="mobile-brand"><span className="auth-brand-icon" aria-hidden="true">W</span>WebSale</div>
          <div className="form-heading">
            <span className="form-eyebrow">COME ON IN</span>
            <h2>Create your account</h2>
            <p>It only takes a moment to get started.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid auth-register-grid">
              <label className="field">First name<input name="first_name" autoComplete="given-name" /></label>
              <label className="field">Last name<input name="last_name" autoComplete="family-name" /></label>
            </div>
            <label htmlFor="register-username">Username</label>
            <input id="register-username" name="username" type="text" placeholder="Choose a username" autoComplete="username" required />
            <label htmlFor="register-email">Email address</label>
            <input id="register-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
            <label htmlFor="register-password">Password</label>
            <input id="register-password" name="password" type="password" placeholder="At least 6 characters" autoComplete="new-password" minLength="6" required />
            <label htmlFor="confirm-password">Confirm password</label>
            <input id="confirm-password" name="confirm-password" type="password" placeholder="Enter your password again" autoComplete="new-password" required />
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'} <span aria-hidden="true">→</span>
            </button>
            {notice && <p className={`auth-notice${hasError ? ' error' : ''}`} role={hasError ? 'alert' : 'status'}>{notice}</p>}
          </form>
          <div className="auth-switch">Already have an account? <a href="/login">Sign in</a></div>
        </div>
      </section>
    </main>
  );
}
