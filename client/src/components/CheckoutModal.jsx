import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Plus, 
  AlertCircle, 
  Smartphone, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Package, 
  Sparkles, 
  Clock, 
  Check, 
  Minus 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const CheckoutModal = ({ isOpen, onClose, onOrderSuccess }) => {
  const { user, token, isAuthenticated } = useAuth();
  const { 
    items, 
    subtotal, 
    mrpTotal, 
    savings, 
    coupon, 
    couponDiscount, 
    deliveryCharge, 
    grandTotal, 
    updateQuantity, 
    removeFromCart, 
    applyCoupon, 
    removeCoupon 
  } = useCart();
  const { showToast } = useToast();

  // Stepper state: 1: Address, 2: Review, 3: Payment
  const [currentStep, setCurrentStep] = useState(1);

  // Address book states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Address form fields
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    alt_phone: '',
    house_building: '',
    street_area: '',
    landmark: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    is_default: 0
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch customer's addresses
  const fetchAddresses = async () => {
    if (!token) return;
    try {
      setLoadingAddresses(true);
      const res = await fetch('/api/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.addresses) {
        setAddresses(data.addresses);
        // Select default address if none selected
        if (data.addresses.length > 0) {
          const defaultAddr = data.addresses.find(a => a.is_default === 1) || data.addresses[0];
          setSelectedAddressId(prev => prev || defaultAddr.id);
          setShowAddressForm(false);
        } else {
          setShowAddressForm(true);
        }
      }
    } catch (err) {
      console.error('Fetch addresses error:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrorMessage('');
      if (token) {
        fetchAddresses();
      } else {
        setShowAddressForm(true);
      }
    }
  }, [isOpen, token]);

  // Pre-fill form when user info is available
  useEffect(() => {
    if (user && !editingAddressId && (!addressForm.full_name || !addressForm.phone)) {
      setAddressForm(prev => ({
        ...prev,
        full_name: prev.full_name || user.name || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user, editingAddressId]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  // Start editing existing address
  const startEditAddress = (addr, e) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setAddressForm({
      full_name: addr.full_name,
      phone: addr.phone,
      alt_phone: addr.alt_phone || '',
      house_building: addr.house_building || addr.street || '',
      street_area: addr.street_area || addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city,
      district: addr.district || addr.city,
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode,
      is_default: addr.is_default
    });
    setShowAddressForm(true);
  };

  // Delete address
  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    if (!token) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Address removed.', 'info');
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
        }
        fetchAddresses();
      }
    } catch (err) {
      showToast('Failed to delete address.', 'error');
    }
  };

  // Save address action (saveOnly: boolean, if true just saves, if false saves & selects)
  const handleSaveAddress = async (saveAndUse = false) => {
    setErrorMessage('');
    const {
      full_name,
      phone,
      house_building,
      street_area,
      city,
      district,
      state,
      pincode
    } = addressForm;

    if (!full_name || !phone || !house_building || !street_area || !city || !pincode) {
      setErrorMessage('Please fill in all required address fields.');
      return;
    }

    const cleanPhone = phone.replace(/[\s\-+]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorMessage('Please enter a valid 6-digit postal pincode.');
      return;
    }

    if (!token) {
      // Guest mode - use directly
      setShowAddressForm(false);
      if (saveAndUse) {
        setCurrentStep(2);
      }
      return;
    }

    try {
      let url = '/api/addresses';
      let method = 'POST';

      if (editingAddressId) {
        url = `/api/addresses/${editingAddressId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });

      const data = await res.json();
      if (data.success && data.address) {
        showToast(editingAddressId ? 'Address updated!' : 'Address saved to address book!', 'success');
        setEditingAddressId(null);
        setShowAddressForm(false);
        await fetchAddresses();

        if (saveAndUse) {
          setSelectedAddressId(data.address.id);
          setCurrentStep(2); // Advance to Review
        }
      } else {
        setErrorMessage(data.message || 'Failed to save address.');
      }
    } catch (err) {
      setErrorMessage('Network error while saving address.');
    }
  };

  // Selected address object
  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || (
    !token && addressForm.full_name ? addressForm : null
  );

  // Advance from Step 1 (Address) to Step 2 (Review)
  const handleProceedToReview = () => {
    setErrorMessage('');
    if (!selectedAddressId && (!addressForm.full_name || !addressForm.house_building)) {
      setErrorMessage('Please select or add a delivery address to proceed.');
      return;
    }
    setCurrentStep(2);
  };

  // Advance from Step 2 (Review) to Step 3 (Payment)
  const handleProceedToPayment = () => {
    setErrorMessage('');
    if (items.length === 0) {
      setErrorMessage('Your shopping cart is empty.');
      return;
    }
    // Verify all items are in stock
    const outOfStockItem = items.find(i => i.quantity > i.stock);
    if (outOfStockItem) {
      setErrorMessage(`Item "${outOfStockItem.name}" exceeds available stock (Only ${outOfStockItem.stock} left).`);
      return;
    }
    setCurrentStep(3);
  };

  // Submit Final Order (Step 3 -> Confirmation)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        payment_method: paymentMethod,
        coupon_code: coupon ? coupon.code : undefined,
        notes: orderNotes
      };

      if (token && selectedAddressId) {
        payload.address_id = selectedAddressId;
      } else {
        payload.address_data = addressForm;
      }

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['x-session-id'] = localStorage.getItem('blast_session_id');
      }

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.order) {
        showToast(paymentMethod === 'UPI' ? 'Order created! Please scan UPI QR code.' : 'Boom! Order placed successfully! 🎆', 'success');
        onClose();
        onOrderSuccess(data.order, data.items || [], data.upi_details);
      } else {
        setErrorMessage(data.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage('Network error while placing order. Your cart and address remain saved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput) return;
    const ok = applyCoupon(couponInput);
    if (ok) setCouponInput('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: 940, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close checkout">
          <X size={20} />
        </button>

        {/* Top Stepper Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          color: '#ffffff',
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={22} color="#f59e0b" /> Checkout & Express Dispatch
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 600 }}>
              Sivakasi Factory Direct
            </span>
          </div>

          {/* Visual Step Progress Bar (Desktop) */}
          <div className="checkout-stepper-desktop">
            {/* Step 1 */}
            <div 
              onClick={() => setCurrentStep(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                opacity: currentStep === 1 ? 1 : 0.75
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentStep >= 1 ? '#f59e0b' : '#065f46',
                color: '#000000',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {currentStep > 1 ? <Check size={16} color="#000" /> : '1'}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                1. Delivery Address
              </span>
            </div>

            <ChevronRight size={16} color="#6ee7b7" />

            {/* Step 2 */}
            <div 
              onClick={() => {
                if (selectedAddressId || addressForm.full_name) setCurrentStep(2);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: selectedAddressId ? 'pointer' : 'default',
                opacity: currentStep === 2 ? 1 : (currentStep > 2 ? 0.9 : 0.6)
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentStep >= 2 ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                color: currentStep >= 2 ? '#000000' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {currentStep > 2 ? <Check size={16} color="#000" /> : '2'}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                2. Order Review
              </span>
            </div>

            <ChevronRight size={16} color="#6ee7b7" />

            {/* Step 3 */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: currentStep === 3 ? 1 : 0.6
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentStep === 3 ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                color: currentStep === 3 ? '#000000' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                3
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                3. Payment Method
              </span>
            </div>
          </div>

          {/* Compact Step Progress Bar (Mobile) */}
          <div className="checkout-stepper-mobile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>
                Step {currentStep} of 3: {currentStep === 1 ? 'Delivery Address' : currentStep === 2 ? 'Order Review' : 'Payment Method'}
              </span>
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  style={{ background: 'none', border: 'none', color: '#a7f3d0', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, padding: '2px 4px' }}
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ flex: 1, background: currentStep >= 1 ? '#f59e0b' : 'transparent', transition: 'background 0.3s' }} />
              <div style={{ flex: 1, background: currentStep >= 2 ? '#f59e0b' : 'transparent', transition: 'background 0.3s' }} />
              <div style={{ flex: 1, background: currentStep >= 3 ? '#f59e0b' : 'transparent', transition: 'background 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div style={{
            background: '#fee2e2',
            borderBottom: '1px solid #fecaca',
            color: '#991b1b',
            padding: '10px 24px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step Body Content */}
        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
          {/* ========================================================
              STEP 1: DELIVERY ADDRESS SELECTION & MANAGEMENT
              ======================================================== */}
          {currentStep === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Delivery Address</h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Where should we safely dispatch your Sivakasi fireworks package?
                  </p>
                </div>

                {!showAddressForm && (
                  <button
                    className="quick-tag-btn"
                    onClick={() => {
                      setEditingAddressId(null);
                      setAddressForm({
                        full_name: user?.name || '',
                        phone: user?.phone || '',
                        alt_phone: '',
                        house_building: '',
                        street_area: '',
                        landmark: '',
                        city: '',
                        district: '',
                        state: 'Tamil Nadu',
                        pincode: '',
                        is_default: addresses.length === 0 ? 1 : 0
                      });
                      setShowAddressForm(true);
                    }}
                    style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                  >
                    <Plus size={16} /> Add New Address
                  </button>
                )}
              </div>

              {/* Show Existing Address Cards */}
              {!showAddressForm && addresses.length > 0 && (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 14,
                    marginBottom: 20
                  }}>
                    {addresses.map(addr => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          style={{
                            border: isSelected ? '2px solid #047857' : '1.5px solid #e2e8f0',
                            background: isSelected ? '#f0fdf4' : '#ffffff',
                            borderRadius: 14,
                            padding: 16,
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(4, 120, 87, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                type="radio"
                                name="addressSelection"
                                checked={isSelected}
                                onChange={() => setSelectedAddressId(addr.id)}
                                style={{ accentColor: '#047857', width: 16, height: 16 }}
                              />
                              <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>
                                {addr.full_name}
                              </strong>
                            </div>

                            {addr.is_default === 1 && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: '#dcfce7',
                                color: '#15803d',
                                padding: '2px 8px',
                                borderRadius: 999
                              }}>
                                DEFAULT
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.45, paddingLeft: 24 }}>
                            <div>{addr.house_building || addr.street}</div>
                            <div>{addr.street_area}{addr.landmark ? `, Near ${addr.landmark}` : ''}</div>
                            <div>
                              {addr.city}, {addr.district ? `${addr.district}, ` : ''}{addr.state} - <strong>{addr.pincode}</strong>
                            </div>
                            <div style={{ marginTop: 6, color: '#64748b', fontSize: '0.8rem' }}>
                              Mobile: <strong>{addr.phone}</strong>
                              {addr.alt_phone && <span> | Alt: {addr.alt_phone}</span>}
                            </div>
                          </div>

                          {/* Card bottom actions */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: '1px solid #f1f5f9',
                            paddingLeft: 24
                          }}>
                            <button
                              type="button"
                              onClick={(e) => startEditAddress(addr, e)}
                              style={{ color: '#047857', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit2 size={13} /> Edit
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              style={{ color: '#dc2626', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Proceed CTA */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <button
                      type="button"
                      className="btn-proceed-checkout"
                      onClick={handleProceedToReview}
                      style={{ maxWidth: 280, height: 46 }}
                    >
                      <span>Proceed to Order Review</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Add New / Edit Address Form */}
              {showAddressForm && (
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 16,
                  padding: 24
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                      {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                    </h4>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        className="quick-tag-btn"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddressId(null);
                        }}
                      >
                        Cancel & View Saved Addresses
                      </button>
                    )}
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        placeholder="Receiver's name"
                        className="form-input"
                        value={addressForm.full_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number (For Dispatch SMS) *</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="10-digit mobile"
                        className="form-input"
                        value={addressForm.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">House / Flat / Plot / Building *</label>
                      <input
                        type="text"
                        name="house_building"
                        placeholder="Flat 3B, Sri Murugan Towers"
                        className="form-input"
                        value={addressForm.house_building}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Street / Area / Locality *</label>
                      <input
                        type="text"
                        name="street_area"
                        placeholder="Gandhi Road, South Cross"
                        className="form-input"
                        value={addressForm.street_area}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Landmark (Optional)</label>
                      <input
                        type="text"
                        name="landmark"
                        placeholder="Near Temple / Petrol Bunk"
                        className="form-input"
                        value={addressForm.landmark}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">City / Town *</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        className="form-input"
                        value={addressForm.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">District *</label>
                      <input
                        type="text"
                        name="district"
                        placeholder="District"
                        className="form-input"
                        value={addressForm.district}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input
                        type="text"
                        name="state"
                        className="form-input"
                        value={addressForm.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        placeholder="6-digit PIN"
                        className="form-input"
                        value={addressForm.pincode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Alternate Phone (Optional)</label>
                      <input
                        type="tel"
                        name="alt_phone"
                        placeholder="Secondary contact"
                        className="form-input"
                        value={addressForm.alt_phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 20px 0' }}>
                    <input
                      type="checkbox"
                      id="addr_default"
                      name="is_default"
                      checked={addressForm.is_default === 1}
                      onChange={handleInputChange}
                      style={{ accentColor: '#047857', width: 16, height: 16 }}
                    />
                    <label htmlFor="addr_default" style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                      Set as my default shipping address
                    </label>
                  </div>

                  {/* Dual Action Buttons */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleSaveAddress(true)}
                      className="btn-proceed-checkout"
                      style={{ flex: 1, height: 46 }}
                    >
                      <CheckCircle2 size={18} />
                      <span>{editingAddressId ? 'Update & Use This Address' : 'Save & Use This Address'}</span>
                    </button>

                    {token && (
                      <button
                        type="button"
                        onClick={() => handleSaveAddress(false)}
                        className="quick-tag-btn"
                        style={{ padding: '0 20px', height: 46, fontWeight: 700 }}
                      >
                        Save Address Only
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              STEP 2: ORDER REVIEW WITH PRODUCT THUMBNAILS & STOCK
              ======================================================== */}
          {currentStep === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Order Review</h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Confirm your crackers selection and delivery details before payment.
                  </p>
                </div>

                <button
                  type="button"
                  className="quick-tag-btn"
                  onClick={() => setCurrentStep(1)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <Edit2 size={12} /> Change Delivery Address
                </button>
              </div>

              {/* Delivery Address Pill Summary */}
              {selectedAddress && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: 12,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20
                }}>
                  <MapPin size={22} color="#15803d" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.86rem', color: '#166534', flex: 1 }}>
                    <strong>Delivering to: </strong>
                    {selectedAddress.full_name} ({selectedAddress.phone}) —{' '}
                    {selectedAddress.house_building}, {selectedAddress.street_area}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                  </div>
                </div>
              )}

              {/* Items List with Thumbnails, Unit Price & Quantity Stepper */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                overflow: 'hidden',
                marginBottom: 20
              }}>
                <div 
                  className="checkout-review-header"
                  style={{
                    background: '#f8fafc',
                    padding: '10px 18px',
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#64748b'
                  }}
                >
                  <span>PRODUCT</span>
                  <span style={{ textAlign: 'center' }}>UNIT PRICE</span>
                  <span style={{ textAlign: 'center' }}>QUANTITY</span>
                  <span style={{ textAlign: 'right' }}>SUBTOTAL</span>
                </div>

                <div style={{ padding: '8px 18px' }}>
                  {items.map(it => {
                    const exceedsStock = it.quantity > it.stock;
                    return (
                      <div
                        key={it.product_id}
                        className="checkout-review-row"
                      >
                        {/* Product Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={it.image_url || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'}
                            alt={it.name}
                            style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', background: '#f1f5f9', flexShrink: 0 }}
                          />
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>{it.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {it.piece_count} pcs/{it.unit} • {it.sound_level} Sound
                            </span>
                            {exceedsStock && (
                              <div style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, marginTop: 2 }}>
                                ⚠️ Only {it.stock} available in stock
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pricing & Stepper Row */}
                        <div className="checkout-row-pricing">
                          {/* Unit Price */}
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#064e3b' }}>₹{it.price}</span>
                            {it.mrp > it.price && (
                              <div style={{ fontSize: '0.74rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{it.mrp}</div>
                            )}
                          </div>

                          {/* Quantity Stepper */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="qty-stepper" style={{ height: 32 }}>
                              <button
                                className="stepper-btn"
                                style={{ width: 26, height: 32 }}
                                onClick={() => updateQuantity(it.product_id, it.quantity - 1)}
                                disabled={it.quantity <= 1}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="stepper-value" style={{ width: 28, fontSize: '0.84rem' }}>
                                {it.quantity}
                              </span>
                              <button
                                className="stepper-btn"
                                style={{ width: 26, height: 32 }}
                                onClick={() => updateQuantity(it.product_id, it.quantity + 1)}
                                disabled={it.quantity >= it.stock}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{it.item_total}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coupon Bar & Bill Breakdown */}
              <div className="checkout-bill-grid">
                {/* Coupon applicator */}
                <div>
                  <label className="form-label" style={{ marginBottom: 6 }}>Festive Promo Code</label>
                  {!coupon ? (
                    <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="e.g. DIWALI2026"
                        className="form-input"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        style={{ textTransform: 'uppercase', fontWeight: 700 }}
                      />
                      <button type="submit" className="quick-tag-btn" style={{ background: '#d97706', color: '#000', fontWeight: 800 }}>
                        Apply
                      </button>
                    </form>
                  ) : (
                    <div style={{
                      background: '#fef3c7',
                      border: '1px dashed #d97706',
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#92400e' }}>
                        🎉 {coupon.label} (-₹{coupon.discount})
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
                    💡 Code <strong>DIWALI2026</strong> gives flat ₹200 OFF on orders above ₹1,500!
                  </div>
                </div>

                {/* Totals Breakdown */}
                <div>
                  <div className="bill-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {savings > 0 && (
                    <div className="bill-row" style={{ color: '#15803d' }}>
                      <span>Factory MRP Savings</span>
                      <span>-₹{savings}</span>
                    </div>
                  )}
                  {coupon && (
                    <div className="bill-row" style={{ color: '#b45309', fontWeight: 600 }}>
                      <span>Coupon Discount</span>
                      <span>-₹{coupon.discount}</span>
                    </div>
                  )}
                  <div className="bill-row">
                    <span>Fragile Delivery Fee</span>
                    <span>{deliveryCharge === 0 ? <strong style={{ color: '#15803d' }}>FREE</strong> : `₹${deliveryCharge}`}</span>
                  </div>
                  <div className="bill-row total-row" style={{ marginTop: 8, paddingTop: 8 }}>
                    <span>Grand Total</span>
                    <span style={{ color: '#064e3b', fontSize: '1.25rem' }}>₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Navigation CTAs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="quick-tag-btn"
                  onClick={() => setCurrentStep(1)}
                  style={{ height: 44, padding: '0 18px', minWidth: 140 }}
                >
                  <ChevronLeft size={16} /> Back to Address
                </button>

                <button
                  type="button"
                  className="btn-proceed-checkout"
                  onClick={handleProceedToPayment}
                  style={{ minWidth: 200, height: 44 }}
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 3: PAYMENT METHOD & FINAL ORDER PLACEMENT
              ======================================================== */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Payment Method</h3>
                <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Choose your preferred payment method. 100% secure pyrotechnic transaction.
                </p>
              </div>

              <div className="payment-options-list" style={{ marginBottom: 20 }}>
                {/* COD Option */}
                <div
                  className={`payment-option-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <Truck size={24} color={paymentMethod === 'COD' ? '#d97706' : '#64748b'} />
                  <span style={{ fontSize: '0.92rem' }}>Cash / UPI on Delivery</span>
                  <small style={{ color: '#64748b' }}>Inspect safety pack, then pay cash or UPI</small>
                </div>

                {/* UPI Instant */}
                <div
                  className={`payment-option-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('UPI')}
                >
                  <Smartphone size={24} color={paymentMethod === 'UPI' ? '#d97706' : '#64748b'} />
                  <span style={{ fontSize: '0.92rem' }}>UPI Instant (GPay / PhonePe / QR)</span>
                  <small style={{ color: '#64748b' }}>Direct UPI confirmation & priority dispatch</small>
                </div>

                {/* Card */}
                <div
                  className={`payment-option-card ${paymentMethod === 'CARD' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <CreditCard size={24} color={paymentMethod === 'CARD' ? '#d97706' : '#64748b'} />
                  <span style={{ fontSize: '0.92rem' }}>Credit / Debit Card</span>
                  <small style={{ color: '#64748b' }}>Visa, MasterCard, RuPay</small>
                </div>

                {/* NetBanking */}
                <div
                  className={`payment-option-card ${paymentMethod === 'NETBANKING' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('NETBANKING')}
                >
                  <ShieldCheck size={24} color={paymentMethod === 'NETBANKING' ? '#d97706' : '#64748b'} />
                  <span style={{ fontSize: '0.92rem' }}>Net Banking</span>
                  <small style={{ color: '#64748b' }}>SBI, HDFC, ICICI, Axis & more</small>
                </div>
              </div>

              {/* Order Notes */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Delivery Instructions (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  placeholder="e.g. Call before arrival, leave with security, handle with care"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              {/* Final Payable Strip */}
              <div style={{
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                borderRadius: 12,
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Payable Amount:
                  </span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#064e3b' }}>
                    ₹{grandTotal}
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#047857', textAlign: 'right' }}>
                  <span>{items.length} fireworks products</span> • <span>Includes all taxes</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="quick-tag-btn"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  style={{ height: 46, padding: '0 18px', minWidth: 140 }}
                >
                  <ChevronLeft size={16} /> Back to Review
                </button>

                <button
                  type="button"
                  className="btn-proceed-checkout"
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  style={{ minWidth: 260, flex: '1 1 auto', height: 48, fontSize: '1.02rem', background: isSubmitting ? '#94a3b8' : '#047857' }}
                >
                  {isSubmitting ? (
                    <span>Processing Order...</span>
                  ) : paymentMethod === 'UPI' ? (
                    <>
                      <Smartphone size={18} />
                      <span>Proceed to UPI QR Payment (₹{grandTotal})</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Confirm & Place Order (₹{grandTotal})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
