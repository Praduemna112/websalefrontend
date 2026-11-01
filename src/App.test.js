import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the login page with forgot password link', () => {
  window.history.replaceState({}, '', '/login');
  render(<App />);
  expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /forgot password\?/i })).toBeInTheDocument();
});

test('renders the forgot password page at /forgot-password', () => {
  window.history.replaceState({}, '', '/forgot-password');
  render(<App />);
  expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
});

test('renders the registration page at /register', () => {
  window.history.replaceState({}, '', '/register');
  render(<App />);
  expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
});
