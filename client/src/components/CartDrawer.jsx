import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Sparkles, 
  Tag, 
  ArrowRight, 
  CheckCircle2, 
  Truck 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer = ({ onProceedToCheckout }) => {
  const {
    items,
    subtotal,
    mrpTotal,
    savings,
    totalItems,
    coupon,
    couponDiscount,
    deliveryCharge,
    grandTotal,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput) return;
    const ok = applyCoupon(couponInput);
    if (ok) setCouponInput('');
  };

  const freeDeliveryThreshold = 1999;
  const awayFromFreeDelivery = Math.max(0, freeDeliveryThreshold - (subtotal - couponDiscount));

  return (
    <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <h3>
            <ShoppingBag size={22} color="#064e3b" />
            <span>Your Festive Cart ({totalItems})</span>
          </h3>
          <button 
            className="modal-close-btn" 
            style={{ position: 'static' }}
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {items.length > 0 && (
          <div style={{
            background: deliveryCharge === 0 ? '#ecfdf5' : '#fffbeb',
            borderBottom: '1px solid #e2e8f0',
            padding: '10px 14px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            color: deliveryCharge === 0 ? '#065f46' : '#92400e',
            fontWeight: 600
          }}>
            <Truck size={16} style={{ flexShrink: 0 }} />
            {deliveryCharge === 0 ? (
              <span>🎉 Congratulations! You unlocked <strong>FREE Fragile Express Delivery</strong>!</span>
            ) : (
              <span>Add <strong>₹{awayFromFreeDelivery}</strong> more to qualify for <strong>FREE Delivery</strong>!</span>
            )}
          </div>
        )}

        {/* Items List or Empty State */}
        {items.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 30,
            textAlign: 'center'
          }}>
            <ShoppingBag size={56} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Your Festive Cart is Empty</h4>
            <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: 280, margin: '0 auto 20px' }}>
              Add authentic Sivakasi sparklers, sound crackers, and gift boxes to prepare for Diwali!
            </p>
            <button 
              className="quick-tag-btn" 
              onClick={() => setIsCartOpen(false)}
              style={{ background: '#064e3b', color: '#ffffff', borderColor: '#064e3b', padding: '10px 20px', minHeight: 44 }}
            >
              <Sparkles size={16} /> Explore Crackers Catalog
            </button>
          </div>
        ) : (
          <div className="cart-items-list">
            {items.map(item => (
              <div key={item.id || item.cart_item_id} className="cart-item-card">
                <img 
                  src={item.image_url || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=80'} 
                  alt={item.name} 
                  className="cart-item-img"
                />
                <div className="cart-item-info">
                  <h4 className="cart-item-title">{item.name}</h4>
                  
                  <div className="cart-item-price-row">
                    <span className="cart-item-price">₹{item.price}</span>
                    {item.mrp > item.price && (
                      <span className="cart-item-mrp">₹{item.mrp}</span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>
                      Total: ₹{item.item_total}
                    </span>
                  </div>

                  <div className="cart-item-controls">
                    <div className="qty-stepper" style={{ height: 36 }}>
                      <button 
                        className="stepper-btn" 
                        style={{ width: 34, height: 36 }}
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="stepper-value" style={{ width: 32, fontSize: '0.88rem' }}>
                        {item.quantity}
                      </span>
                      <button 
                        className="stepper-btn" 
                        style={{ width: 34, height: 36 }}
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      style={{
                        color: '#94a3b8',
                        padding: '6px 10px',
                        borderRadius: 6,
                        minHeight: 36,
                        minWidth: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer & Checkout Breakdown */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Coupon Code Section */}
            {!coupon ? (
              <form onSubmit={handleApplyCoupon} className="coupon-input-wrap">
                <input 
                  type="text" 
                  placeholder="Enter Coupon (e.g. DIWALI2026)" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                />
                <button type="submit">Apply</button>
              </form>
            ) : (
              <div style={{
                background: '#fef3c7',
                border: '1px dashed #d97706',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
                fontSize: '0.84rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontWeight: 700 }}>
                  <Tag size={16} />
                  <span>{coupon.label} (-₹{coupon.discount})</span>
                </div>
                <button 
                  onClick={removeCoupon} 
                  style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.78rem' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Bill Summary */}
            <div className="bill-row">
              <span>Total MRP Value</span>
              <span style={{ textDecoration: 'line-through' }}>₹{mrpTotal}</span>
            </div>

            <div className="bill-row" style={{ color: '#15803d' }}>
              <span>Festive Discount</span>
              <span>-₹{savings}</span>
            </div>

            {coupon && (
              <div className="bill-row" style={{ color: '#b45309' }}>
                <span>Coupon ({coupon.code})</span>
                <span>-₹{coupon.discount}</span>
              </div>
            )}

            <div className="bill-row">
              <span>Fragile Delivery Charge</span>
              <span>{deliveryCharge === 0 ? <strong style={{ color: '#15803d' }}>FREE</strong> : `₹${deliveryCharge}`}</span>
            </div>

            <div className="bill-row total-row">
              <span>Grand Total</span>
              <span style={{ color: '#064e3b' }}>₹{grandTotal}</span>
            </div>

            <button 
              className="btn-proceed-checkout" 
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
