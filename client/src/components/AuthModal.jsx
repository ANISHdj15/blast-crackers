import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Sparkles, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthModal = ({ isOpen, onClose, defaultTab = 'login', onSuccess }) => {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState(defaultTab); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    alt_phone: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        showToast(`Welcome back, ${res.user.name}! 🪔`, 'success');
        onClose();
        if (onSuccess) onSuccess(res.user);
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regForm.name || !regForm.email || !regForm.phone || !regForm.password) {
      setError('Please fill all required registration fields.');
      return;
    }
    if (regForm.phone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(regForm);
      if (res.success) {
        showToast('Account registered successfully! Welcome to Blast Crackers. 🎆', 'success');
        onClose();
        if (onSuccess) onSuccess(res.user);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo accounts
  const fillDemoAdmin = () => {
    setTab('login');
    setLoginEmail('admin@blastcrackers.com');
    setLoginPassword('Admin@123');
  };

  const fillDemoCustomer = () => {
    setTab('login');
    setLoginEmail('customer@gmail.com');
    setLoginPassword('Customer@123');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close authentication">
          <X size={20} />
        </button>

        {/* Modal Festive Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          color: '#ffffff',
          padding: '24px 24px 16px 24px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Sparkles size={22} color="#f59e0b" /> Blast Crackers
          </h2>
          <p style={{ color: '#d1fae5', fontSize: '0.84rem', marginTop: 4 }}>
            Direct Sivakasi factory access, order tracking & exclusive member discounts.
          </p>
        </div>

        {/* Tabs */}
        <div className="tab-nav" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <button
            className={`tab-nav-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
            style={{ flex: 1, textAlign: 'center' }}
          >
            Sign In
          </button>
          <button
            className={`tab-nav-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
            style={{ flex: 1, textAlign: 'center' }}
          >
            Create Account
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="form-input"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-proceed-checkout"
                style={{ width: '100%', height: 44, marginTop: 8 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Demo Credentials Helper */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Quick Demo Sign-In:
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={fillDemoAdmin}
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                  >
                    Admin Account
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={fillDemoCustomer}
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                  >
                    Customer Account
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  className="form-input"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number (For Delivery SMS) *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  className="form-input"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="form-input"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alternate Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="Secondary phone"
                  className="form-input"
                  value={regForm.alt_phone}
                  onChange={(e) => setRegForm({ ...regForm, alt_phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Create Password (Min 6 chars) *</label>
                <input
                  type="password"
                  required
                  placeholder="Create strong password"
                  className="form-input"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-proceed-checkout"
                style={{ width: '100%', height: 44, marginTop: 8 }}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
