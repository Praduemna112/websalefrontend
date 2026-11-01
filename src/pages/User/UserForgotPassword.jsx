import React, { useState } from 'react';
import './UserAuth.css';
import { api, jsonBody } from '../../services/api';

export default function UserForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setHasError(true);
      setNotice('The new passwords do not match. Please check and try again.');
      return;
    }
    setIsSubmitting(true);
    setNotice('');
    setHasError(false);
    try {
      const result = await api('/api/auth/forgot-password/', {
        method: 'POST',
        body: jsonBody({
          email: email.trim(),
          new_password: newPassword,
          confirm_password: confirmPassword,
          currect_password: confirmPassword,
        }),
      });
      setIsSuccess(true);
      setHasError(false);
      setNotice(result.message || result.detail || 'Password reset successfully. You can now sign in with your new password.');
    } catch (error) {
      setHasError(true);
      setNotice(error.message || 'Unable to reset password. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase" aria-label="Welcome to WebSale">
        <a className="auth-brand" href="/"><span className="auth-brand-icon" aria-hidden="true">W</span>WebSale</a>
        <div className="showcase-content">
          <span className="showcase-kicker"><span /> ACCOUNT RECOVERY</span>
          <h1>Reset your password and get right back in.</h1>
          <p>Enter your registered email address and set a fresh password to secure your account.</p>
          <div className="showcase-art" aria-hidden="true">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-star">✳</div>
            <div className="art-card art-card-one"><span className="art-card-dot" /><i /><i /><i /></div>
            <div className="art-card art-card-two"><span className="art-avatar">W</span><span>Back in a snap<br /><small>Safe & secure</small></span><b>✓</b></div>
            <div className="art-card art-card-three"><span className="art-chart"><i /><i /><i /><i /><i /></span><span>Good finds ahead</span></div>
          </div>
        </div>
        <div className="showcase-footer"><span>Thoughtful finds, delivered to your door.</span><span>© WebSale</span></div>
      </section>
      <section className="auth-main">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><span className="auth-brand-icon" aria-hidden="true">W</span>WebSale</div>
          <div className="form-heading">
            <span className="form-eyebrow">RESET PASSWORD</span>
            <h2>Forgot password</h2>
            <p>Enter your email and create a new password to regain access.</p>
          </div>
          {isSuccess ? (
            <div className="auth-form">
              <p className="auth-notice" role="status">{notice}</p>
              <a href="/login" className="auth-submit" style={{ textDecoration: 'none', marginTop: '16px' }}>
                Back to sign in <span aria-hidden="true">→</span>
              </a>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="forgot-email">Email address</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                placeholder="Enter your registered email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="forgot-new-password">New password</label>
              <input
                id="forgot-new-password"
                name="new_password"
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                autoComplete="new-password"
                minLength="6"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <label htmlFor="forgot-confirm-password">Confirm new password</label>
              <input
                id="forgot-confirm-password"
                name="confirm_password"
                type="password"
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                minLength="6"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting password…' : 'Reset password'} <span aria-hidden="true">→</span>
              </button>
              {notice && <p className={`auth-notice${hasError ? ' error' : ''}`} role={hasError ? 'alert' : 'status'}>{notice}</p>}
            </form>
          )}
          <div className="auth-switch">Remember your password? <a href="/login">Sign in</a></div>
          <div className="auth-legal"><a href="/">Browse the shop</a> · Pay on delivery at checkout.</div>
        </div>
      </section>
    </main>
  );
}
