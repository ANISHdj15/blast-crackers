import React from 'react';
import { 
  CheckCircle, 
  Sparkles, 
  Package, 
  Copy, 
  ArrowRight, 
  Truck, 
  MapPin, 
  X 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const OrderConfirmationModal = ({ order, items, onClose, onTrackOrder }) => {
  const { showToast } = useToast();
  if (!order) return null;

  const address = order.address_snapshot ? JSON.parse(order.address_snapshot) : {};

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    showToast(`Order number ${order.order_number} copied!`, 'info');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close confirmation">
          <X size={20} />
        </button>

        {/* Festive Celebration Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #d97706 100%)',
          color: '#ffffff',
          padding: '36px 28px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#ffffff',
            color: '#047857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <Sparkles size={34} color="#d97706" />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: 6 }}>
            Boom! Order Confirmed! 🎆
          </h2>
          <p style={{ color: '#d1fae5', fontSize: '0.92rem' }}>
            Thank you for choosing Blast Crackers. Your festive celebration package is booked!
          </p>
        </div>

        {/* Details Content */}
        <div style={{ padding: '24px 28px' }}>
          {/* Order Reference Box */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Order Tracking ID
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064e3b', letterSpacing: 0.5 }}>
                {order.order_number}
              </div>
            </div>

            <button
              onClick={copyOrderNumber}
              className="quick-tag-btn"
              style={{ background: '#ffffff' }}
              title="Copy Order Number"
            >
              <Copy size={14} /> Copy ID
            </button>
          </div>

          {/* Shipping Address */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#047857" /> Shipping To:
            </h4>
            <p style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 600 }}>
              {address.fullName} ({address.phone})
            </p>
            <p style={{ fontSize: '0.84rem', color: '#475569' }}>
              {address.street}{address.landmark ? `, ${address.landmark}` : ''}, {address.city}, {address.state} - {address.pincode}
            </p>
          </div>

          {/* Amount Paid */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#ecfdf5',
            borderRadius: 10,
            marginBottom: 24,
            fontWeight: 700
          }}>
            <span style={{ color: '#065f46' }}>Total Amount:</span>
            <span style={{ color: '#047857', fontSize: '1.1rem' }}>₹{order.grand_total}</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn-proceed-checkout"
              onClick={() => {
                onClose();
                onTrackOrder(order.order_number);
              }}
              style={{ flex: 1, background: '#047857' }}
            >
              <Truck size={18} />
              <span>Track Live Delivery</span>
            </button>

            <button
              className="quick-tag-btn"
              onClick={onClose}
              style={{ padding: '12px 20px', fontWeight: 700 }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
