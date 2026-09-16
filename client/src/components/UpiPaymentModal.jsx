import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  Truck, 
  RefreshCw,
  QrCode,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const UpiPaymentModal = ({ 
  isOpen, 
  onClose, 
  orderNumber, 
  initialOrder, 
  initialUpiDetails, 
  onPaymentSubmitted, 
  onTrackOrder 
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(!initialOrder);
  const [order, setOrder] = useState(initialOrder || null);
  const [payment, setPayment] = useState(null);
  const [upiDetails, setUpiDetails] = useState(initialUpiDetails || null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  
  // Timer & expiry states
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // UTR submission state
  const [showUtrDialog, setShowUtrDialog] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation state
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Copy feedback state
  const [copiedField, setCopiedField] = useState(null);

  // Fetch payment details idempotently (never duplicates orders)
  const fetchPaymentData = async () => {
    if (!orderNumber) return;
    try {
      setLoading(true);
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/orders/${orderNumber}/payment`, { headers });
      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
        setPayment(data.payment);
        setUpiDetails(data.upi_details);

        if (data.payment && (data.payment.status === 'submitted' || data.payment.status === 'under_verification')) {
          setSubmittedSuccess(true);
        }
      } else {
        showToast(data.message || 'Failed to load payment information.', 'error');
      }
    } catch (err) {
      console.error('Fetch payment data error:', err);
      showToast('Network error while loading payment details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderNumber) {
      setSubmittedSuccess(false);
      setShowUtrDialog(false);
      setUtrNumber('');
      setUtrError('');
      fetchPaymentData();
    }
  }, [isOpen, orderNumber]);

  // Generate dynamic QR Code whenever UPI URI is resolved
  useEffect(() => {
    if (!upiDetails?.upi_uri) return;

    let isMounted = true;
    QRCode.toDataURL(upiDetails.upi_uri, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(err => {
        console.error('QR code generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiDetails?.upi_uri]);

  // Countdown timer for payment expiry
  useEffect(() => {
    if (!upiDetails?.expires_at) return;

    const calculateTimeLeft = () => {
      const difference = new Date(upiDetails.expires_at).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        return false;
      }
      setTimeLeft(Math.floor(difference / 1000));
      setIsExpired(false);
      return true;
    };

    calculateTimeLeft();
    const interval = setInterval(() => {
      const active = calculateTimeLeft();
      if (!active) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [upiDetails?.expires_at]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName === 'upi' ? 'UPI ID' : 'Amount'} to clipboard!`, 'info');
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  // Customer clicks [ I HAVE COMPLETED PAYMENT ]
  const handleInitiateCompletion = () => {
    if (isExpired) {
      showToast('Payment window has expired. Please contact support.', 'error');
      return;
    }
    setShowUtrDialog(true);
  };

  // Submit UTR & Payment details to backend
  const handleSubmitPayment = async (e) => {
    e?.preventDefault();
    setUtrError('');

    const requireUtr = upiDetails?.require_utr;
    const cleanUtr = utrNumber.trim();

    if (requireUtr && !cleanUtr) {
      setUtrError('Please enter the 12-digit UPI Transaction ID / UTR number.');
      return;
    }

    if (cleanUtr) {
      if (cleanUtr.length !== 12 || !/^[A-Za-z0-9]{12}$/.test(cleanUtr)) {
        setUtrError('Invalid UTR format. Please enter exactly 12 alphanumeric characters or numbers.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/orders/${orderNumber}/submit-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transaction_reference: cleanUtr || null
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Payment submitted for verification!', 'success');
        setSubmittedSuccess(true);
        setShowUtrDialog(false);
        setOrder(data.order);
        setPayment(data.payment);
        if (onPaymentSubmitted) {
          onPaymentSubmitted(data.order, data.payment);
        }
      } else {
        setUtrError(data.message || 'Failed to submit payment details.');
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      setUtrError('Network error while submitting payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedAmount = order?.grand_total ? Number(order.grand_total).toFixed(2) : '0.00';
  const shopUpiId = upiDetails?.shop_upi_id || 'YOUR_UPI_ID@upi';
  const shopName = upiDetails?.shop_name || 'Blast Crackers Sivakasi';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: 540, padding: 0, overflow: 'hidden', borderRadius: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Strip */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              <Sparkles size={14} color="#f59e0b" />
              <span>Instant UPI Payment</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 0 0', color: '#ffffff' }}>
              Blast Crackers Checkout
            </h2>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close payment modal"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', background: '#f8fafc', maxHeight: '80vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px auto' }} />
              <p style={{ color: '#64748b', fontSize: '0.92rem' }}>Generating secure dynamic UPI QR code...</p>
            </div>
          ) : submittedSuccess ? (
            /* ====================================================================
               SCREEN 2: SUBMITTED / UNDER VERIFICATION CONFIRMATION
               ==================================================================== */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: 72,
                height: 72,
                background: '#ecfdf5',
                color: '#059669',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 0 0 8px #d1fae5'
              }}>
                <CheckCircle2 size={40} />
              </div>

              <h3 style={{ fontSize: '1.35rem', color: '#0f172a', fontWeight: 800, marginBottom: 6 }}>
                Payment Details Submitted!
              </h3>
              <p style={{ color: '#047857', fontWeight: 600, fontSize: '0.92rem', marginBottom: 18 }}>
                Payment details submitted successfully.
              </p>

              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '18px 20px',
                textAlign: 'left',
                marginBottom: 20,
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Order Number</span>
                  <strong style={{ color: '#064e3b', fontSize: '0.95rem' }}>{order?.order_number || orderNumber}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Amount Payable</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>₹{formattedAmount}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Payment Method</span>
                  <strong style={{ color: '#334155', fontSize: '0.9rem' }}>UPI Dynamic QR</strong>
                </div>

                {payment?.transaction_reference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '0.88rem' }}>UTR / Reference</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      {payment.transaction_reference}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 4px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Payment Status</span>
                  <span style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #fde68a'
                  }}>
                    Under Verification
                  </span>
                </div>
              </div>

              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: '0.85rem',
                color: '#1e40af',
                marginBottom: 24,
                lineHeight: 1.5
              }}>
                ℹ️ <strong>Your order will be confirmed after payment verification.</strong> Our Sivakasi accounts team verifies your bank credit reference before handing over fireworks to licensed transport.
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onTrackOrder) onTrackOrder(order?.order_number || orderNumber);
                  }}
                  className="btn-proceed-checkout"
                  style={{ flex: '1 1 180px', height: 46 }}
                >
                  <Truck size={18} />
                  <span>Track Consignment</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="quick-tag-btn"
                  style={{ flex: '1 1 120px', padding: '0 20px', height: 46, fontWeight: 700 }}
                >
                  Back to Store
                </button>
              </div>
            </div>
          ) : (
            /* ====================================================================
               SCREEN 1: DYNAMIC UPI QR SCAN & PAY INTERFACE
               ==================================================================== */
            <div>
              {/* Order & Amount Badge Strip */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 20,
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    Payment for Order #{order?.order_number || orderNumber}
                  </span>

                  {/* Timer Badge */}
                  {timeLeft !== null && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: timeLeft < 120 ? '#fee2e2' : '#f1f5f9',
                      color: timeLeft < 120 ? '#dc2626' : '#475569'
                    }}>
                      <Clock size={13} />
                      <span>{isExpired ? 'Expired' : formatTimer(timeLeft)}</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                      Amount Payable
                    </span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#064e3b', lineHeight: 1.1 }}>
                      ₹{formattedAmount}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(formattedAmount, 'amount')}
                    className="quick-tag-btn"
                    style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    title="Copy amount for your UPI app"
                  >
                    {copiedField === 'amount' ? (
                      <>
                        <Check size={12} color="#15803d" />
                        <span style={{ color: '#15803d' }}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Amount</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic QR Code Box */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 16,
                padding: '20px 16px',
                textAlign: 'center',
                marginBottom: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <div 
                  className="upi-qr-container"
                  style={{
                    background: '#f8fafc',
                    border: '2px dashed #94a3b8',
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt={`UPI Payment QR for Order ${order?.order_number || orderNumber}`}
                      style={{ maxWidth: '100%', height: 'auto', aspectRatio: '1', display: 'block', borderRadius: 6 }}
                    />
                  ) : (
                    <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <QrCode size={48} />
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: 700, marginBottom: 4 }}>
                  Scan with GPay, PhonePe, Paytm or any UPI App
                </div>

                <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 360, margin: '0 auto 12px auto' }}>
                  This dynamic QR is tied strictly to Order #{order?.order_number || orderNumber} with the exact payable amount ₹{formattedAmount}.
                </p>

                {/* Mobile Intent Button: Open UPI App directly */}
                {upiDetails?.upi_uri && (
                  <a
                    href={upiDetails.upi_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-add-cart"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      maxWidth: 240,
                      margin: '0 auto 12px auto',
                      height: 40,
                      fontSize: '0.86rem',
                      textDecoration: 'none',
                      background: '#047857'
                    }}
                  >
                    <Smartphone size={16} />
                    <span>Open in UPI App</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              {/* UPI ID Details & Copy */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 20
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Payee UPI ID ({shopName})
                  </span>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {shopUpiId}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(shopUpiId, 'upi')}
                  className="quick-tag-btn"
                  style={{ padding: '6px 12px', fontWeight: 700, minHeight: 38 }}
                >
                  {copiedField === 'upi' ? (
                    <>
                      <Check size={14} color="#15803d" />
                      <span style={{ color: '#15803d' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy UPI ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Assurance Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.78rem',
                color: '#047857',
                background: '#ecfdf5',
                padding: '8px 14px',
                borderRadius: 999,
                marginBottom: 22
              }}>
                <ShieldCheck size={16} />
                <span>Zero gateway markup • Direct merchant UPI transfer • CSIR-NEERI Certified</span>
              </div>

              {/* Primary Action Button: [ I HAVE COMPLETED PAYMENT ] */}
              <div>
                <button
                  type="button"
                  onClick={handleInitiateCompletion}
                  disabled={isExpired}
                  className="btn-proceed-checkout"
                  style={{
                    width: '100%',
                    height: 52,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    background: isExpired ? '#94a3b8' : 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
                    boxShadow: isExpired ? 'none' : '0 4px 14px rgba(4, 120, 87, 0.35)'
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span>I HAVE COMPLETED PAYMENT</span>
                </button>

                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    I will complete payment later (View order in My Account)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* UTR Entry Dialog Overlay */}
        {showUtrDialog && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 10
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '24px 26px',
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                  Payment Confirmation
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUtrDialog(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 16, lineHeight: 1.45 }}>
                {upiDetails?.require_utr
                  ? 'Please enter the 12-digit UPI Reference / UTR Number generated in your payment app (Google Pay, PhonePe, Paytm, BHIM).'
                  : 'You may optionally provide the 12-digit UPI Reference / UTR Number to expedite verification.'}
              </p>

              {utrError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{utrError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitPayment}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">
                    UPI Transaction ID / UTR Number {upiDetails?.require_utr ? <span style={{ color: '#dc2626' }}>*</span> : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    className="form-input"
                    placeholder="e.g. 428178129012"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '1.05rem',
                      letterSpacing: 2,
                      fontWeight: 700
                    }}
                    autoFocus
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                    Standard 12-digit reference visible on your UPI app transaction receipt.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowUtrDialog(false)}
                    disabled={isSubmitting}
                    className="quick-tag-btn"
                    style={{ flex: '1 1 100px', height: 44, fontWeight: 700 }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-proceed-checkout"
                    style={{ flex: '1.5 1 160px', height: 44, background: isSubmitting ? '#94a3b8' : '#047857' }}
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Submit for Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
