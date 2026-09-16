import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Package, 
  LogOut, 
  Plus, 
  Trash2, 
  Check, 
  Truck, 
  Phone, 
  Mail, 
  Shield, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CustomerAccountModal = ({ isOpen, onClose, onTrackOrder, onViewOrder, onOpenUpiPayment }) => {
  const { user, token, logout, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'addresses', 'profile'
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    alt_phone: user?.alt_phone || ''
  });

  // Address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressError, setAddressError] = useState('');

  const [addressForm, setAddressForm] = useState({
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
    is_default: 0
  });

  // Load orders & addresses
  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoadingOrders(true);
      const res = await fetch('/api/orders/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAddresses(data.addresses || []);
    } catch (err) {
      console.error('Fetch addresses error:', err);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchOrders();
      fetchAddresses();
    }
  }, [isOpen, token]);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const res = await updateProfile(profileForm);
    if (res.success) {
      showToast('Profile updated successfully.', 'success');
    } else {
      showToast(res.message || 'Failed to update profile.', 'error');
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressError('');
    setAddressForm({
      full_name: user.name || '',
      phone: user.phone || '',
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
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressError('');
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

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError('');

    const { full_name, phone, house_building, street_area, city, pincode } = addressForm;
    if (!full_name || !phone || !house_building || !street_area || !city || !pincode) {
      setAddressError('Please fill all required address fields.');
      return;
    }

    if (phone.replace(/[\s\-+]/g, '').length < 10) {
      setAddressError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setAddressError('Please enter a valid 6-digit postal pincode.');
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
      if (data.success) {
        showToast(editingAddressId ? 'Address updated.' : 'Address saved to address book.', 'success');
        setShowAddressForm(false);
        setEditingAddressId(null);
        fetchAddresses();
      } else {
        setAddressError(data.message || 'Failed to save address.');
      }
    } catch (err) {
      setAddressError('Network error saving address.');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const res = await fetch(`/api/addresses/${id}/default`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Default delivery address updated.', 'success');
        fetchAddresses();
      }
    } catch (err) {
      showToast('Error updating default address.', 'error');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Address deleted.', 'info');
        fetchAddresses();
      }
    } catch (err) {
      showToast('Failed to delete address.', 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 880 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close dashboard">
          <X size={20} />
        </button>

        {/* Dashboard Header Strip */}
        <div style={{
          background: 'var(--emerald-gradient)',
          color: '#ffffff',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 1, color: '#fef3c7', fontWeight: 700 }}>
              Customer Account
            </span>
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: '2px 0 0 0' }}>{user.name}</h2>
            <div style={{ fontSize: '0.82rem', color: '#d1fae5', display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 4 }}>
              <span><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />{user.email}</span>
              <span><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />{user.phone}</span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="quick-tag-btn"
            style={{ background: '#ffffff', color: '#dc2626', borderColor: '#ffffff', minHeight: 38, fontWeight: 700 }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-nav">
          <button
            className={`tab-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={16} style={{ display: 'inline', marginRight: 6 }} />
            My Orders ({orders.length})
          </button>
          <button
            className={`tab-nav-btn ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={16} style={{ display: 'inline', marginRight: 6 }} />
            Address Book ({addresses.length})
          </button>
          <button
            className={`tab-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} style={{ display: 'inline', marginRight: 6 }} />
            Profile Details
          </button>
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 1. ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading your orders...</div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <Package size={40} style={{ margin: '0 auto 12px auto', color: '#94a3b8' }} />
                  <h4>No orders placed yet.</h4>
                  <p style={{ fontSize: '0.86rem', marginTop: 4 }}>Your festival celebration orders will appear here!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {orders.map(order => (
                    <div
                      key={order.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 18,
                        background: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: '#064e3b' }}>
                            {order.order_number}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 10 }}>
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            textTransform: 'uppercase',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 999,
                            background: order.status === 'delivered' ? '#dcfce7' : (order.status === 'cancelled' ? '#fee2e2' : '#fef3c7'),
                            color: order.status === 'delivered' ? '#15803d' : (order.status === 'cancelled' ? '#b91c1c' : '#b45309')
                          }}>
                            {order.status.replace(/_/g, ' ')}
                          </span>

                          {order.payment_method === 'UPI' && onOpenUpiPayment && (
                            <button
                              className="quick-tag-btn"
                              onClick={() => {
                                onClose();
                                onOpenUpiPayment(order.order_number);
                              }}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                background: order.status === 'pending_payment' ? '#fef3c7' : '#ecfdf5',
                                color: order.status === 'pending_payment' ? '#b45309' : '#047857',
                                fontWeight: 700
                              }}
                            >
                              <Smartphone size={13} />
                              {order.status === 'pending_payment' ? 'Pay via UPI' : 'UPI Details'}
                            </button>
                          )}

                          {onViewOrder && (
                            <button
                              className="quick-tag-btn"
                              onClick={() => {
                                onClose();
                                onViewOrder(order.order_number);
                              }}
                              style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#f1f5f9', color: '#334155' }}
                            >
                              <FileText size={13} /> View Order
                            </button>
                          )}

                          <button
                            className="quick-tag-btn"
                            onClick={() => {
                              onClose();
                              onTrackOrder(order.order_number);
                            }}
                            style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#ecfdf5', color: '#047857' }}
                          >
                            <Truck size={13} /> Track
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                        {order.items?.map(it => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', padding: '3px 0' }}>
                            <span>{it.product_name} <strong>× {it.quantity}</strong></span>
                            <strong>₹{it.total_price}</strong>
                          </div>
                        ))}
                      </div>

                      {/* Footer info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: '#64748b' }}>
                          Delivery to: {order.parsed_address?.city || 'Address'} ({order.parsed_address?.pincode || ''})
                        </span>
                        <span>Total Paid: <strong style={{ color: '#064e3b', fontSize: '1.05rem' }}>₹{order.grand_total}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. ADDRESS BOOK TAB */}
          {activeTab === 'addresses' && (
            <div>
              {!showAddressForm ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', color: '#0f172a' }}>Saved Delivery Addresses</h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        Manage multiple delivery addresses for family, relatives, and festive events.
                      </p>
                    </div>

                    <button
                      className="btn-add-cart"
                      onClick={handleOpenAddAddress}
                      style={{ padding: '0 16px', height: 40, width: 'auto' }}
                    >
                      <Plus size={16} /> Add Address
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                      <MapPin size={38} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
                      <p>No saved addresses yet. Add your primary shipping address!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
                      {addresses.map(addr => (
                        <div
                          key={addr.id}
                          style={{
                            border: addr.is_default ? '2px solid #047857' : '1.5px solid #e2e8f0',
                            borderRadius: 14,
                            padding: 16,
                            background: addr.is_default ? '#f0fdf4' : '#ffffff',
                            position: 'relative'
                          }}
                        >
                          {addr.is_default === 1 && (
                            <span style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: '#15803d',
                              background: '#dcfce7',
                              padding: '2px 8px',
                              borderRadius: 999
                            }}>
                              DEFAULT
                            </span>
                          )}

                          <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{addr.full_name}</strong>
                          <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.45, marginTop: 6 }}>
                            <div>{addr.house_building || addr.street}</div>
                            <div>{addr.street_area}{addr.landmark ? `, Near ${addr.landmark}` : ''}</div>
                            <div>
                              {addr.city}, {addr.district ? `${addr.district}, ` : ''}{addr.state} - <strong>{addr.pincode}</strong>
                            </div>
                            <div style={{ marginTop: 6, color: '#64748b', fontSize: '0.8rem' }}>
                              Phone: <strong>{addr.phone}</strong>
                              {addr.alt_phone && <span> | Alt: {addr.alt_phone}</span>}
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 14,
                            paddingTop: 10,
                            borderTop: '1px solid #f1f5f9'
                          }}>
                            {addr.is_default !== 1 && (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                style={{ color: '#047857', fontSize: '0.78rem', fontWeight: 700 }}
                              >
                                Set as Default
                              </button>
                            )}

                            <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
                              <button
                                onClick={() => handleOpenEditAddress(addr)}
                                style={{ color: '#047857', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <Edit2 size={13} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                style={{ color: '#dc2626', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Add / Edit Address Form */
                <form onSubmit={handleSaveAddress} style={{ maxWidth: 640 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ fontSize: '1.1rem' }}>
                      {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                    </h4>
                    <button
                      type="button"
                      className="quick-tag-btn"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddressId(null);
                      }}
                    >
                      Back to Saved Addresses
                    </button>
                  </div>

                  {addressError && (
                    <div style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 14
                    }}>
                      <AlertCircle size={16} />
                      <span>{addressError}</span>
                    </div>
                  )}

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={addressForm.full_name}
                        onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Number (10 Digits) *</label>
                      <input
                        type="tel"
                        required
                        className="form-input"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">House / Flat / Building *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="House No / Building"
                        value={addressForm.house_building}
                        onChange={(e) => setAddressForm({ ...addressForm, house_building: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Street / Area / Locality *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Street Name, Area"
                        value={addressForm.street_area}
                        onChange={(e) => setAddressForm({ ...addressForm, street_area: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Landmark</label>
                      <input
                        type="text"
                        className="form-input"
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">District *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={addressForm.district}
                        onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode (6 Digits) *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alternate Phone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={addressForm.alt_phone}
                        onChange={(e) => setAddressForm({ ...addressForm, alt_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button type="submit" className="btn-add-cart" style={{ flex: 1, height: 44 }}>
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      className="quick-tag-btn"
                      onClick={() => setShowAddressForm(false)}
                      style={{ padding: '0 20px', height: 44 }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 3. PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} style={{ maxWidth: 440 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Account ID)</label>
                <input
                  type="email"
                  disabled
                  className="form-input"
                  value={user.email}
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Mobile Number</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alternate Contact Phone (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91..."
                  value={profileForm.alt_phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, alt_phone: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-add-cart" style={{ marginTop: 10, width: '100%', height: 44 }}>
                Save Profile Changes
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
