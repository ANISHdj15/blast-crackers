// client/src/components/OrderDetailModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Truck,
  RotateCcw,
  Ban
} from 'lucide-react';

export const OrderDetailModal = ({ isOpen, onClose, orderNumber, onOrderCancelled, onTrackOrder }) => {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const fetchOrderDetail = async () => {
    if (!orderNumber) return;
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber.trim())}/detail`, { headers });
      const data = await res.json();

      if (data.success && data.order) {
        setOrderData(data.order);
      } else {
        setError(data.message || 'Unable to retrieve order details.');
      }
    } catch (err) {
      console.error('Fetch order detail error:', err);
      setError('Network error while loading order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderNumber) {
      fetchOrderDetail();
      setShowCancelPrompt(false);
      setCancelReason('');
      setCancelError('');
    }
  }, [isOpen, orderNumber]);

  if (!isOpen) return null;

  const handleCancelOrder = async () => {
    if (!orderData) return;
    try {
      setCancelling(true);
      setCancelError('');
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`/api/orders/${encodeURIComponent(orderData.order_number)}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: cancelReason.trim() || 'Customer requested cancellation' })
      });

      const data = await res.json();
      if (data.success) {
        setShowCancelPrompt(false);
        await fetchOrderDetail();
        if (onOrderCancelled) onOrderCancelled(orderData.order_number);
      } else {
        setCancelError(data.message || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      setCancelError('Network error while requesting cancellation.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    let bg = '#e2e8f0';
    let color = '#334155';

    if (s === 'delivered') {
      bg = '#dcfce7';
      color = '#15803d';
    } else if (['confirmed', 'shipped', 'out_for_delivery'].includes(s)) {
      bg = '#dbeafe';
      color = '#1d4ed8';
    } else if (['pending_payment', 'payment_verification'].includes(s)) {
      bg = '#fef3c7';
      color = '#b45309';
    } else if (s === 'cancelled') {
      bg = '#fee2e2';
      color = '#b91c1c';
    }

    return (
      <span style={{
        background: bg,
        color,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: 999
      }}>
        {s.replace(/_/g, ' ')}
      </span>
    );
  };

  const isCancellable = orderData && ['pending_payment', 'payment_verification', 'confirmed'].includes(orderData.status);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: 840, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Order #{orderData ? orderData.order_number : orderNumber}
              </h2>
              {orderData && getStatusBadge(orderData.status)}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
              Placed on {orderData ? new Date(orderData.created_at).toLocaleString('en-IN') : '...'}
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <Clock className="spin" size={32} style={{ margin: '0 auto 12px' }} />
              <div>Loading order details...</div>
            </div>
          )}

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: 14,
              borderRadius: 8,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16
            }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {orderData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Order Cancellation Banner if Cancelled */}
              {orderData.status === 'cancelled' && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12
                }}>
                  <Ban size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: '#991b1b', fontSize: '0.95rem' }}>This order has been cancelled</strong>
                    <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: 2 }}>
                      Reason: {orderData.cancellation_reason || 'Order cancelled'}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Track Order & Cancel Order */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {onTrackOrder && (
                  <button
                    onClick={() => {
                      onClose();
                      onTrackOrder(orderData.order_number);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#064e3b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Truck size={16} />
                    <span>Track Live Status</span>
                  </button>
                )}

                {isCancellable && !showCancelPrompt && (
                  <button
                    onClick={() => setShowCancelPrompt(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#fff',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              {/* Cancel Prompt Dialog */}
              {showCancelPrompt && (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 10,
                  padding: 16
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#9a3412', marginBottom: 6 }}>
                    Confirm Order Cancellation
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#7c2d12', margin: '0 0 10px 0' }}>
                    Are you sure you want to cancel this order? Reserved firecracker stock will be returned to inventory.
                  </p>

                  <input
                    type="text"
                    placeholder="Reason for cancellation (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      marginBottom: 10
                    }}
                  />

                  {cancelError && (
                    <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: 10 }}>
                      {cancelError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                    <button
                      onClick={() => setShowCancelPrompt(false)}
                      disabled={cancelling}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Keep Order
                    </button>
                  </div>
                </div>
              )}

              {/* Items & Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Items Ordered */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <Package size={18} color="#064e3b" />
                    <span>Items Ordered ({orderData.items ? orderData.items.length : 0})</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 260, overflowY: 'auto' }}>
                    {orderData.items && orderData.items.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 10,
                        borderBottom: idx < orderData.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }}
                            />
                          ) : (
                            <div style={{
                              width: 44,
                              height: 44,
                              background: '#e2e8f0',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Package size={20} color="#94a3b8" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
                              {item.product_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              ₹{item.price} × {item.quantity}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                          ₹{item.total_price}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748b', marginBottom: 4 }}>
                      <span>Subtotal</span>
                      <span>₹{orderData.subtotal}</span>
                    </div>
                    {orderData.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#16a34a', marginBottom: 4 }}>
                        <span>Discount ({orderData.coupon_code || 'Promo'})</span>
                        <span>-₹{orderData.discount}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748b', marginBottom: 6 }}>
                      <span>Delivery Charge</span>
                      <span>{orderData.delivery_charge === 0 ? 'FREE' : `₹${orderData.delivery_charge}`}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: '#064e3b',
                      paddingTop: 8,
                      borderTop: '1px dashed #cbd5e1'
                    }}>
                      <span>Total</span>
                      <span>₹{orderData.grand_total}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Payment Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Delivery Address */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16
                  }}>
                    <div style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <MapPin size={18} color="#064e3b" />
                      <span>Delivery Address</span>
                    </div>

                    {orderData.parsed_address ? (
                      <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                          {orderData.parsed_address.fullName}
                        </strong>
                        <div>Phone: {orderData.parsed_address.phone} {orderData.parsed_address.altPhone ? `| Alt: ${orderData.parsed_address.altPhone}` : ''}</div>
                        <div>{orderData.parsed_address.houseBuilding || orderData.parsed_address.street}</div>
                        {orderData.parsed_address.streetArea && <div>{orderData.parsed_address.streetArea}</div>}
                        {orderData.parsed_address.landmark && <div>Landmark: {orderData.parsed_address.landmark}</div>}
                        <div>
                          {orderData.parsed_address.city}, {orderData.parsed_address.state} - {orderData.parsed_address.pincode}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>No address snapshot available</div>
                    )}
                  </div>

                  {/* Payment Details */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16
                  }}>
                    <div style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <CreditCard size={18} color="#064e3b" />
                      <span>Payment Information</span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Method:</span>
                        <strong>{orderData.payment?.payment_method || orderData.payment_method || 'COD'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Payment Status:</span>
                        <strong style={{ textTransform: 'capitalize' }}>
                          {orderData.payment?.payment_status || orderData.payment_status || 'Pending'}
                        </strong>
                      </div>
                      {orderData.payment?.transaction_reference && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>UPI UTR Ref:</span>
                          <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                            {orderData.payment.transaction_reference}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              {orderData.timeline && orderData.timeline.length > 0 && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <Clock size={18} color="#064e3b" />
                    <span>Order Lifecycle Timeline</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {orderData.timeline.map((evt, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        position: 'relative',
                        paddingLeft: 4
                      }}>
                        <div style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: evt.status === 'cancelled' ? '#dc2626' : '#059669',
                          marginTop: 5,
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.86rem', color: '#1e293b' }}>{evt.title}</strong>
                            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                              {new Date(evt.created_at).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {evt.description && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                              {evt.description}
                            </div>
                          )}
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                            By: {evt.created_by}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
