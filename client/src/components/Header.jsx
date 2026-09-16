import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  ShoppingCart, 
  User, 
  ShieldCheck, 
  Compass, 
  Menu, 
  X, 
  LogOut, 
  Package, 
  Settings, 
  Flame 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Header = ({ 
  searchQuery, 
  setSearchQuery, 
  onOpenAuth, 
  onOpenAccount, 
  onOpenAdmin, 
  onOpenTracking,
  onSelectCategory,
  onResetFilters,
  onOpenLegal
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="site-header">
      {/* Top Festive Announcement Strip */}
      <div className="announcement-bar">
        <div>
          🪔 <strong>SIVAKASI FACTORY DIRECT 2026</strong> — Flat 50% Early Bird Discount + Extra ₹200 OFF with coupon
          <span className="coupon-pill">DIWALI2026</span>
        </div>
        <div className="announcement-links">
          <button onClick={onOpenTracking} className="announcement-link">
            📦 Track Order
          </button>
          <span style={{ opacity: 0.4 }}>|</span>
          <button 
            onClick={() => onOpenLegal && onOpenLegal('safety')} 
            className="announcement-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
          >
            🛡️ 100% Genuine Green Crackers & Safety Guide
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="header-container">
        {/* Brand Logo */}
        <div 
          className="brand-logo-wrap" 
          onClick={() => {
            if (onResetFilters) onResetFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="brand-icon-box">
            <Flame size={26} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              BLAST <span className="accent">CRACKERS</span>
            </div>
            <span className="brand-tagline">Sivakasi Premium Fireworks</span>
          </div>
        </div>

        {/* Live Search Input (Desktop Only) */}
        <div className="header-search desktop-only">
          <div className="search-input-wrapper">
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Search 1000 wala, sparklers, flower pots, sky rockets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation & User Actions */}
        <div className="header-actions nav-desktop-links">
          <button 
            className="nav-link-btn" 
            onClick={() => {
              if (onResetFilters) onResetFilters();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Sparkles size={16} color="#d97706" />
            <span>Store</span>
          </button>

          <button className="nav-link-btn" onClick={onOpenTracking}>
            <Package size={16} color="#047857" />
            <span>Track Order</span>
          </button>

          <button className="nav-link-btn" onClick={() => onOpenLegal && onOpenLegal('safety')} title="Safety Guidelines & Legal Terms">
            <ShieldCheck size={16} color="#059669" />
            <span>Safety</span>
          </button>

          {isAdmin && (
            <button className="nav-link-btn" onClick={onOpenAdmin} style={{ color: '#b45309' }}>
              <Settings size={16} />
              <span>Admin Portal</span>
            </button>
          )}

          {isAuthenticated ? (
            <button className="nav-link-btn" onClick={onOpenAccount}>
              <User size={16} color="#064e3b" />
              <span>{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button className="nav-link-btn" onClick={onOpenAuth}>
              <User size={16} />
              <span>Login / Register</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button 
            className="cart-trigger-btn" 
            onClick={() => setIsCartOpen(true)}
            aria-label="View Cart"
          >
            <ShoppingCart size={18} />
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </button>
        </div>

        {/* Mobile Header Actions (Visible on screens <= 768px) */}
        <div className="mobile-header-actions">
          {/* Mobile Search Toggle */}
          <button 
            className="mobile-icon-btn mobile-search-toggle"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle search bar"
          >
            <Search size={20} />
          </button>

          {/* Mobile Direct Cart Trigger */}
          <button 
            className="mobile-icon-btn mobile-cart-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="View Cart"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </button>

          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-icon-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile navigation menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="mobile-search-bar open">
          <div className="search-input-wrapper">
            <Search size={18} color="#64748b" />
            <input
              type="text"
              autoFocus
              placeholder="Search 1000 wala, rockets, gift box..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button 
              onClick={() => setMobileSearchOpen(false)}
              style={{ padding: '0 8px', color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            <div className="mobile-nav-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame size={20} color="#f59e0b" />
                <strong style={{ fontSize: '1rem', letterSpacing: 0.5 }}>BLAST CRACKERS</strong>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: '#ffffff', padding: 4 }}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mobile-nav-content">
              <button 
                className="nav-link-btn" 
                onClick={() => {
                  if (onResetFilters) onResetFilters();
                  setMobileMenuOpen(false);
                }}
              >
                <Sparkles size={18} color="#d97706" />
                <span>Browse All Fireworks</span>
              </button>

              <button 
                className="nav-link-btn" 
                onClick={() => {
                  onOpenTracking();
                  setMobileMenuOpen(false);
                }}
              >
                <Package size={18} color="#047857" />
                <span>Track My Order</span>
              </button>

              <button 
                className="nav-link-btn" 
                onClick={() => {
                  if (onOpenLegal) onOpenLegal('safety');
                  setMobileMenuOpen(false);
                }}
              >
                <ShieldCheck size={18} color="#059669" />
                <span>Safety Guidelines & Terms</span>
              </button>

              {isAdmin && (
                <button 
                  className="nav-link-btn" 
                  onClick={() => {
                    onOpenAdmin();
                    setMobileMenuOpen(false);
                  }}
                  style={{ color: '#b45309' }}
                >
                  <Settings size={18} />
                  <span>Admin Management Portal</span>
                </button>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />

              {isAuthenticated ? (
                <>
                  <button 
                    className="nav-link-btn" 
                    onClick={() => {
                      onOpenAccount();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <User size={18} color="#064e3b" />
                    <span>My Profile & Saved Addresses</span>
                  </button>
                  <button 
                    className="nav-link-btn" 
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    style={{ color: '#dc2626' }}
                  >
                    <LogOut size={18} />
                    <span>Sign Out ({user.name})</span>
                  </button>
                </>
              ) : (
                <button 
                  className="nav-link-btn" 
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                >
                  <User size={18} />
                  <span>Customer Login / Register</span>
                </button>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                <button 
                  className="btn-proceed-checkout" 
                  onClick={() => {
                    setIsCartOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  style={{ width: '100%', height: 46 }}
                >
                  <ShoppingCart size={18} />
                  <span>Open Shopping Cart ({totalItems})</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
