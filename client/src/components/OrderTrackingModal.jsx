import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Truck, 
  CheckCircle, 
  Clock, 
  Package, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  Ban,
  Calendar
} from 'lucide-react';

export const OrderTrackingModal = ({ isOpen, onClose, initialOrderNumber }) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');

  const fetchTracking = async (numberToTrack) => {
    if (!numberToTrack) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/orders/track/${encodeURIComponent(numberToTrack.trim())}`);
      const data = await res.json();
      if (data.success && data.order) {
        setTrackingData(data);
      } else {
        setError(data.message || 'Order number not found. Please verify and try again.');
        setTrackingData(null);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Failed to track order. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
      fetchTracking(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTracking(orderNumber);
  };

  const isCancelled = trackingData?.order?.status === 'cancelled';

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close tracking">
          <X size={20} />
        </button>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <Truck size={24} color="#064e3b" /> Track Fireworks Consignment
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: 4, marginBottom: 0 }}>
            Enter your order reference (e.g. BLAST-2026-7841) to inspect real-time Sivakasi dispatch and delivery status.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, textTransform: 'uppercase', fontWeight: 600 }}
              placeholder="e.g. BLAST-2026-7841"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-add-cart"
              style={{ padding: '0 20px', flex: 'none' }}
            >
              <Search size={16} />
              <span>{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </form>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: 14,
              borderRadius: 10,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {trackingData && trackingData.order && (
            <div>
              {/* Cancelled Banner if applicable */}
              {isCancelled && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16
                }}>
                  <Ban size={22} color="#dc2626" />
                  <div>
                    <strong style={{ color: '#991b1b', fontSize: '0.92rem' }}>Order Cancelled</strong>
                    <div style={{ fontSize: '0.82rem', color: '#7f1d1d', marginTop: 2 }}>
                      {trackingData.order.cancellation_reason || 'This order was cancelled and inventory restored.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Meta Bar */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Order Number</div>
                  <strong style={{ fontSize: '1rem', color: '#064e3b' }}>
                    {trackingData.order.order_number}
                  </strong>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Status</div>
                  <span style={{
                    textTransform: 'uppercase',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: isCancelled ? '#fee2e2' : (trackingData.order.status === 'delivered' ? '#dcfce7' : '#fef3c7'),
                    color: isCancelled ? '#b91c1c' : (trackingData.order.status === 'delivered' ? '#15803d' : '#b45309')
                  }}>
                    {trackingData.order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Tracking ID</div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {trackingData.order.tracking_number || 'N/A'}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Amount</div>
                  <strong style={{ fontSize: '1rem', color: '#064e3b' }}>
                    ₹{trackingData.order.grand_total}
                  </strong>
                </div>
              </div>

              {/* Step Timeline (Only if not cancelled) */}
              {!isCancelled && (
                <>
                  <h4 style={{ fontSize: '0.92rem', marginBottom: 12, color: '#334155', fontWeight: 700 }}>
                    Delivery Progress:
                  </h4>

                  <div className="tracking-timeline" style={{ marginBottom: 24 }}>
                    {trackingData.timeline.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
                      >
                        <div className="step-indicator">
                          {step.completed ? <CheckCircle size={18} /> : (idx + 1)}
                        </div>
                        <div className="step-details">
                          <h4 style={{ color: step.completed || step.active ? '#0f172a' : '#94a3b8', fontSize: '0.88rem' }}>
                            {step.stage}
                          </h4>
                          <p style={{ fontSize: '0.8rem' }}>{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Database Real Events Timeline */}
              {trackingData.events && trackingData.events.length > 0 && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <div style={{
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <Clock size={16} color="#064e3b" />
                    <span>Real-Time Audit Event Log</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {trackingData.events.map((evt, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: '0.82rem'
                      }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: evt.status === 'cancelled' ? '#dc2626' : '#059669',
                          marginTop: 6,
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <strong style={{ color: '#1e293b' }}>{evt.title}</strong>
                            <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                              {new Date(evt.created_at).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {evt.description && (
                            <div style={{ color: '#64748b', marginTop: 2 }}>
                              {evt.description}
                            </div>
                          )}
                          <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 2 }}>
                            Logged by: {evt.created_by}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Destination Address */}
              {trackingData.order.parsed_address && (
                <div style={{ paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginBottom: 4 }}>
                    DESTINATION SHIPPING ADDRESS:
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#1e293b' }}>
                    {trackingData.order.parsed_address.fullName}, {trackingData.order.parsed_address.houseBuilding || trackingData.order.parsed_address.street},{' '}
                    {trackingData.order.parsed_address.streetArea ? `${trackingData.order.parsed_address.streetArea}, ` : ''}
                    {trackingData.order.parsed_address.city}, {trackingData.order.parsed_address.state} -{' '}
                    {trackingData.order.parsed_address.pincode}
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
