// client/src/components/AdminDashboardModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  BarChart3, 
  Package, 
  Layers, 
  ShoppingBag, 
  Plus, 
  Save, 
  Trash2, 
  AlertTriangle, 
  Truck, 
  CheckCircle, 
  Edit3,
  QrCode,
  CheckCircle2,
  XCircle,
  Settings as SettingsIcon,
  Clock,
  CreditCard,
  Check,
  Copy,
  Smartphone,
  Users,
  MapPin,
  Tag,
  Warehouse,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Ban,
  ArrowUpRight,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminDashboardModal = ({ isOpen, onClose, onRefreshStore }) => {
  const { token, isAdmin } = useAuth();
  const { showToast } = useToast();

  // 10 Modules: 'dashboard', 'products', 'categories', 'inventory', 'orders', 'payments', 'customers', 'addresses', 'coupons', 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Core Data Stores
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [settings, setSettings] = useState({});

  // Filters & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Interactive Modals & Actions
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [orderStatusChangeTarget, setOrderStatusChangeTarget] = useState(null);
  const [targetNextStatus, setTargetNextStatus] = useState('');
  const [targetTrackingNumber, setTargetTrackingNumber] = useState('');
  const [targetStatusNotes, setTargetStatusNotes] = useState('');
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [copiedPaymentId, setCopiedPaymentId] = useState(null);

  // Forms
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    sku: '',
    price: '',
    mrp: '',
    stock: 50,
    unit: 'Box',
    piece_count: 5,
    sound_level: 'Medium',
    duration: '45 sec',
    safety_distance: '5 Meters',
    short_desc: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    is_featured: false,
    is_latest: false,
    is_offer: false,
    is_active: true
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'Sparkles',
    sort_order: 0,
    is_active: true
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    expires_at: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    store_name: '',
    store_phone: '',
    store_email: '',
    store_address: '',
    shop_upi_id: 'YOUR_UPI_ID@upi',
    shop_name: 'Blast Crackers Sivakasi',
    payment_instructions: '',
    require_utr: true,
    payment_expiry_minutes: 15,
    low_stock_threshold: 20,
    min_order_amount: 500,
    shipping_fee: 150,
    free_shipping_threshold: 1999
  });

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {
      console.error('Fetch stats error:', e);
    }
  };

  // Fetch Products (admin endpoint retrieves all including inactive)
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products/admin/all', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch (e) {
      console.error('Fetch products error:', e);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories/admin/all', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCategories(data.categories || []);
    } catch (e) {
      console.error('Fetch categories error:', e);
    }
  };

  // Fetch Orders with filters
  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (orderStatusFilter && orderStatusFilter !== 'all') params.append('status', orderStatusFilter);
      if (orderPaymentFilter && orderPaymentFilter !== 'all') params.append('payment_status', orderPaymentFilter);
      if (orderSearchQuery.trim()) params.append('search', orderSearchQuery.trim());
      if (orderDateFrom) params.append('date_from', orderDateFrom);
      if (orderDateTo) params.append('date_to', orderDateTo);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (e) {
      console.error('Fetch orders error:', e);
    }
  };

  // Fetch Payments
  const fetchPayments = async () => {
    try {
      const url = paymentFilter !== 'all' ? `/api/admin/payments?status=${paymentFilter}` : '/api/admin/payments';
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPayments(data.payments || []);
    } catch (e) {
      console.error('Fetch payments error:', e);
    }
  };

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
    } catch (e) {
      console.error('Fetch customers error:', e);
    }
  };

  // Fetch Addresses
  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/admin/addresses', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAddresses(data.addresses || []);
    } catch (e) {
      console.error('Fetch addresses error:', e);
    }
  };

  // Fetch Coupons
  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCoupons(data.coupons || []);
    } catch (e) {
      console.error('Fetch coupons error:', e);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setSettingsForm({
          store_name: data.settings.store_name || 'Blast Crackers Sivakasi',
          store_phone: data.settings.store_phone || '+91 98765 43210',
          store_email: data.settings.store_email || 'orders@blastcrackers.com',
          store_address: data.settings.store_address || '124 Sparkle Way, Sivakasi, Tamil Nadu 626123',
          shop_upi_id: data.settings.shop_upi_id || 'YOUR_UPI_ID@upi',
          shop_name: data.settings.shop_name || 'Blast Crackers Sivakasi',
          payment_instructions: data.settings.payment_instructions || '',
          require_utr: data.settings.require_utr === 'true',
          payment_expiry_minutes: parseInt(data.settings.payment_expiry_minutes || '15', 10),
          low_stock_threshold: parseInt(data.settings.low_stock_threshold || '20', 10),
          min_order_amount: parseInt(data.settings.min_order_amount || '500', 10),
          shipping_fee: parseInt(data.settings.shipping_fee || '150', 10),
          free_shipping_threshold: parseInt(data.settings.free_shipping_threshold || '1999', 10)
        });
      }
    } catch (e) {
      console.error('Fetch settings error:', e);
    }
  };

  useEffect(() => {
    if (!isOpen || !isAdmin || !token) return;
    setLoading(true);
    Promise.all([
      fetchStats(),
      fetchProducts(),
      fetchCategories(),
      fetchOrders(),
      fetchPayments(),
      fetchCustomers(),
      fetchAddresses(),
      fetchCoupons(),
      fetchSettings()
    ]).finally(() => setLoading(false));
  }, [isOpen, isAdmin, token]);

  // Refetch orders on filter changes
  useEffect(() => {
    if (isOpen && isAdmin && token) {
      fetchOrders();
    }
  }, [orderStatusFilter, orderPaymentFilter, orderDateFrom, orderDateTo]);

  // Refetch payments on paymentFilter change
  useEffect(() => {
    if (isOpen && isAdmin && token) {
      fetchPayments();
    }
  }, [paymentFilter]);

  // ==================== PRODUCT HANDLERS ====================
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category_id: categories[0]?.id || 1,
      sku: '',
      price: '',
      mrp: '',
      stock: 50,
      unit: 'Box',
      piece_count: 5,
      sound_level: 'Medium',
      duration: '45 sec',
      safety_distance: '5 Meters',
      short_desc: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
      is_featured: false,
      is_latest: false,
      is_offer: false,
      is_active: true
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      category_id: prod.category_id || '',
      sku: prod.sku || '',
      price: prod.price || '',
      mrp: prod.mrp || '',
      stock: prod.stock || 0,
      unit: prod.unit || 'Box',
      piece_count: prod.piece_count || 1,
      sound_level: prod.sound_level || 'Medium',
      duration: prod.duration || '30 sec',
      safety_distance: prod.safety_distance || '5 Meters',
      short_desc: prod.short_desc || '',
      description: prod.description || '',
      image_url: prod.primary_image || prod.image_url || '',
      is_featured: Boolean(prod.is_featured),
      is_latest: Boolean(prod.is_latest),
      is_offer: Boolean(prod.is_offer),
      is_active: Boolean(prod.is_active)
    });
    setShowProductModal(true);
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    setIsUploadingImage(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        setProductForm(prev => ({ ...prev, image_url: data.url }));
        showToast('Image uploaded successfully! 📸', 'success');
      } else {
        setUploadError(data.message || 'Image upload failed.');
        showToast(data.message || 'Failed to upload image.', 'error');
      }
    } catch (err) {
      setUploadError(err.message || 'Network error during upload.');
      showToast('Network error while uploading image.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingProduct ? 'Product updated successfully.' : 'New product created! 🎇', 'success');
        setShowProductModal(false);
        fetchProducts();
        fetchStats();
        if (onRefreshStore) onRefreshStore();
      } else {
        showToast(data.message || 'Failed to save product.', 'error');
      }
    } catch (err) {
      showToast('Error saving product.', 'error');
    }
  };

  const handleToggleProductActive = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchProducts();
        fetchStats();
        if (onRefreshStore) onRefreshStore();
      }
    } catch (e) {
      showToast('Error updating product status.', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate/archive this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Product archived.', 'info');
        fetchProducts();
        fetchStats();
        if (onRefreshStore) onRefreshStore();
      }
    } catch (e) {
      showToast('Error archiving product.', 'error');
    }
  };

  // Quick stock update in Inventory table
  const handleQuickStockUpdate = async (productId, newStock) => {
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Inventory stock updated.', 'success');
        fetchProducts();
        fetchStats();
        if (onRefreshStore) onRefreshStore();
      }
    } catch (e) {
      showToast('Error updating stock.', 'error');
    }
  };

  // ==================== CATEGORY HANDLERS ====================
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', icon: 'Sparkles', sort_order: 0, is_active: true });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      description: cat.description || '',
      icon: cat.icon || 'Sparkles',
      sort_order: cat.sort_order || 0,
      is_active: Boolean(cat.is_active)
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingCategory ? 'Category updated.' : 'Category created.', 'success');
        setShowCategoryModal(false);
        fetchCategories();
        if (onRefreshStore) onRefreshStore();
      } else {
        showToast(data.message || 'Failed to save category.', 'error');
      }
    } catch (e) {
      showToast('Error saving category.', 'error');
    }
  };

  const handleToggleCategoryActive = async (id) => {
    try {
      const res = await fetch(`/api/categories/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchCategories();
        if (onRefreshStore) onRefreshStore();
      }
    } catch (e) {
      showToast('Error updating category status.', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Associated products may need reassignment.')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Category deleted.', 'info');
        fetchCategories();
        if (onRefreshStore) onRefreshStore();
      }
    } catch (e) {
      showToast('Error deleting category.', 'error');
    }
  };

  // ==================== ORDER HANDLERS ====================
  const handleOpenStatusModal = (order) => {
    setOrderStatusChangeTarget(order);
    setTargetNextStatus(order.status);
    setTargetTrackingNumber(order.tracking_number || '');
    setTargetStatusNotes('');
  };

  const handleSaveOrderStatus = async () => {
    if (!orderStatusChangeTarget) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderStatusChangeTarget.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: targetNextStatus,
          tracking_number: targetTrackingNumber,
          notes: targetStatusNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setOrderStatusChangeTarget(null);
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to update order status.', 'error');
      }
    } catch (e) {
      showToast('Error updating order status.', 'error');
    }
  };

  const handleAdminCancelOrder = async () => {
    if (!cancelOrderTarget) return;
    try {
      const res = await fetch(`/api/admin/orders/${cancelOrderTarget.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReasonText.trim() || 'Cancelled by store administration' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setCancelOrderTarget(null);
        setCancelReasonText('');
        fetchOrders();
        fetchStats();
        fetchProducts(); // Stock was restored!
      } else {
        showToast(data.message || 'Failed to cancel order.', 'error');
      }
    } catch (e) {
      showToast('Error cancelling order.', 'error');
    }
  };

  // ==================== PAYMENT HANDLERS ====================
  const handleVerifyPayment = async (paymentId) => {
    setActionInProgressId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchPayments();
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to verify payment.', 'error');
      }
    } catch (e) {
      showToast('Network error while verifying payment.', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const reason = window.prompt(
      'Enter reason for rejecting this payment (e.g. UTR not matched on bank statement):',
      'UTR reference not found on merchant bank statement'
    );
    if (reason === null) return;

    setActionInProgressId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'info');
        fetchPayments();
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to reject payment.', 'error');
      }
    } catch (e) {
      showToast('Network error while rejecting payment.', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const copyUtr = (utr, pId) => {
    if (!utr) return;
    navigator.clipboard.writeText(utr);
    setCopiedPaymentId(pId);
    showToast('Copied UTR number!', 'info');
    setTimeout(() => setCopiedPaymentId(null), 2500);
  };

  // ==================== COUPON HANDLERS ====================
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(couponForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setShowCouponModal(false);
        setCouponForm({
          code: '',
          description: '',
          discount_type: 'percent',
          discount_value: '',
          min_order_amount: '',
          max_discount_amount: '',
          expires_at: ''
        });
        fetchCoupons();
      } else {
        showToast(data.message || 'Failed to create coupon.', 'error');
      }
    } catch (e) {
      showToast('Error creating coupon.', 'error');
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchCoupons();
      }
    } catch (e) {
      showToast('Error toggling coupon.', 'error');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Coupon removed.', 'info');
        fetchCoupons();
      }
    } catch (e) {
      showToast('Error deleting coupon.', 'error');
    }
  };

  // ==================== SETTINGS HANDLER ====================
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Store settings updated successfully!', 'success');
        fetchSettings();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to update settings.', 'error');
      }
    } catch (e) {
      showToast('Error updating settings.', 'error');
    }
  };

  if (!isOpen || !isAdmin) return null;

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCat = productCatFilter === 'all' || String(p.category_id) === String(productCatFilter);
    return matchesSearch && matchesCat;
  });

  // Filtered Inventory
  const filteredInventory = products.filter(p => {
    const threshold = stats?.low_stock_threshold || 20;
    const matchesSearch = !inventorySearch || p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(inventorySearch.toLowerCase()));
    let matchesStatus = true;
    if (inventoryStatusFilter === 'in_stock') matchesStatus = p.stock > threshold;
    if (inventoryStatusFilter === 'low_stock') matchesStatus = p.stock > 0 && p.stock <= threshold;
    if (inventoryStatusFilter === 'out_of_stock') matchesStatus = p.stock <= 0;
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusBadge = (st) => {
    const s = (st || '').toLowerCase();
    let bg = '#e2e8f0';
    let color = '#334155';
    if (s === 'delivered') { bg = '#dcfce7'; color = '#15803d'; }
    else if (['confirmed', 'shipped', 'out_for_delivery', 'dispatched'].includes(s)) { bg = '#dbeafe'; color = '#1d4ed8'; }
    else if (['pending_payment', 'payment_verification'].includes(s)) { bg = '#fef3c7'; color = '#b45309'; }
    else if (s === 'cancelled') { bg = '#fee2e2'; color = '#b91c1c'; }

    return (
      <span style={{
        background: bg,
        color,
        fontSize: '0.72rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 999
      }}>
        {s.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: 1200, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close admin">
          <X size={20} />
        </button>

        {/* Top Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.2, color: '#f59e0b', fontWeight: 800 }}>
              Sivakasi Warehouse & Merchant Portal
            </div>
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: '4px 0 0 0' }}>
              Blast Crackers Administration
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#047857',
              color: '#d1fae5',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <ShieldCheck size={14} /> Store Admin
            </span>
          </div>
        </div>

        {/* 10 Navigation Tabs */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 12px',
          gap: 4
        }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
            { id: 'inventory', label: 'Inventory', icon: Warehouse },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
            { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
            { id: 'addresses', label: `Addresses (${addresses.length})`, icon: MapPin },
            { id: 'coupons', label: `Offers (${coupons.length})`, icon: Tag },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #064e3b' : '3px solid transparent',
                  color: isActive ? '#064e3b' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <Clock className="spin" size={32} style={{ margin: '0 auto 12px' }} />
              <div>Loading store data directly from database...</div>
            </div>
          ) : (
            <>
              {/* ==================== 1. DASHBOARD OVERVIEW ==================== */}
              {activeTab === 'dashboard' && stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* 8 Metric Cards */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                      Store KPIs & Performance Overview
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 12
                    }}>
                      {[
                        { title: 'Total Orders', value: stats.total_orders, color: '#064e3b', bg: '#ecfdf5' },
                        { title: 'Pending Orders', value: stats.pending_orders, color: '#b45309', bg: '#fef3c7' },
                        { title: 'Confirmed Orders', value: stats.confirmed_orders, color: '#1d4ed8', bg: '#dbeafe' },
                        { title: 'Processing', value: stats.processing_orders, color: '#4338ca', bg: '#e0e7ff' },
                        { title: 'Delivered', value: stats.delivered_orders, color: '#15803d', bg: '#dcfce7' },
                        { title: 'Cancelled', value: stats.cancelled_orders, color: '#dc2626', bg: '#fee2e2' },
                        { title: 'Pending Payments', value: stats.pending_payments, color: '#c2410c', bg: '#ffedd5' },
                        { title: 'Total Sales', value: `₹${Number(stats.total_sales).toLocaleString('en-IN')}`, color: '#064e3b', bg: '#f0fdf4', isCurrency: true }
                      ].map((card, idx) => (
                        <div key={idx} style={{
                          background: card.bg,
                          border: `1px solid ${card.color}20`,
                          borderRadius: 10,
                          padding: '12px 14px'
                        }}>
                          <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>{card.title}</div>
                          <div style={{ fontSize: card.isCurrency ? '1.15rem' : '1.35rem', fontWeight: 800, color: card.color, marginTop: 4 }}>
                            {card.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Real Analytics Charts Grid */}
                  <div className="admin-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
                    {/* Sales Over Time Chart */}
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 18,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <TrendingUp size={16} color="#064e3b" /> Sales & Revenue Over Time
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Real Database Records</span>
                      </div>

                      {stats.sales_over_time && stats.sales_over_time.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160, paddingTop: 20 }}>
                          {(() => {
                            const maxRev = Math.max(...stats.sales_over_time.map(s => s.revenue), 1);
                            return stats.sales_over_time.map((d, i) => {
                              const heightPct = Math.max(12, (d.revenue / maxRev) * 100);
                              return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                  <div style={{ fontSize: '0.7rem', color: '#064e3b', fontWeight: 700, marginBottom: 4 }}>
                                    ₹{d.revenue > 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue}
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    maxWidth: 32,
                                    height: `${heightPct}%`,
                                    background: 'linear-gradient(180deg, #059669 0%, #064e3b 100%)',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease'
                                  }} />
                                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 6, whiteSpace: 'nowrap' }}>
                                    {d.date.slice(5)}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '0.86rem' }}>
                          No sales recorded yet.
                        </div>
                      )}
                    </div>

                    {/* Top Selling Products Chart */}
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 18,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Package size={16} color="#064e3b" /> Top Selling Fireworks
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>By Units Sold</span>
                      </div>

                      {stats.top_products && stats.top_products.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {(() => {
                            const maxUnits = Math.max(...stats.top_products.map(p => p.total_sold), 1);
                            return stats.top_products.map((tp, idx) => {
                              const pct = (tp.total_sold / maxUnits) * 100;
                              return (
                                <div key={idx}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{tp.product_name}</span>
                                    <span style={{ color: '#064e3b', fontWeight: 700 }}>
                                      {tp.total_sold} units (₹{tp.total_sales})
                                    </span>
                                  </div>
                                  <div style={{ width: '100%', height: 7, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: '#059669', borderRadius: 999 }} />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '0.86rem' }}>
                          No product orders logged yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Sales Breakdown */}
                  {stats.category_sales && stats.category_sales.length > 0 && (
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 18
                    }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                        Category Sales Share
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                        {stats.category_sales.map((cs, idx) => (
                          <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>{cs.category_name}</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#064e3b', marginTop: 4 }}>
                              ₹{cs.total_sales.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                              {cs.units_sold} units sold
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== 2. PRODUCTS MODULE ==================== */}
              {activeTab === 'products' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Search product by name or SKU..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          style={{ paddingLeft: 34, width: '100%' }}
                        />
                      </div>
                      <select
                        className="form-input"
                        value={productCatFilter}
                        onChange={(e) => setProductCatFilter(e.target.value)}
                        style={{ width: 160 }}
                      >
                        <option value="all">All Categories</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleOpenNewProduct}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#064e3b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '9px 18px',
                        fontWeight: 600,
                        fontSize: '0.86rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} /> Add Fireworks Product
                    </button>
                  </div>

                  {/* Products Table */}
                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px' }}>Product</th>
                          <th style={{ padding: '10px 14px' }}>SKU</th>
                          <th style={{ padding: '10px 14px' }}>Category</th>
                          <th style={{ padding: '10px 14px' }}>Price / MRP</th>
                          <th style={{ padding: '10px 14px' }}>Stock</th>
                          <th style={{ padding: '10px 14px' }}>Status</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img
                                src={p.primary_image || p.image_url || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'}
                                alt={p.name}
                                style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 6 }}
                              />
                              <div>
                                <strong style={{ color: '#0f172a' }}>{p.name}</strong>
                                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{p.unit} ({p.piece_count} pcs)</div>
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>
                              {p.sku || `BC-${p.id}`}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#475569' }}>
                              {p.category_name || categories.find(c => c.id === p.category_id)?.name || 'N/A'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <strong style={{ color: '#064e3b' }}>₹{p.price}</strong>
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: 6 }}>
                                ₹{p.mrp}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: p.stock <= 20 ? '#dc2626' : '#059669' }}>
                              {p.stock}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <button
                                onClick={() => handleToggleProductActive(p.id)}
                                style={{
                                  background: p.is_active ? '#dcfce7' : '#fee2e2',
                                  color: p.is_active ? '#15803d' : '#b91c1c',
                                  border: 'none',
                                  borderRadius: 999,
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {p.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                style={{ background: 'none', border: 'none', color: '#064e3b', cursor: 'pointer', marginRight: 10 }}
                                title="Edit Product"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                                title="Archive Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 3. CATEGORIES MODULE ==================== */}
              {activeTab === 'categories' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Fireworks Categories
                    </h3>
                    <button
                      onClick={handleOpenNewCategory}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#064e3b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '9px 18px',
                        fontWeight: 600,
                        fontSize: '0.86rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} /> Add Category
                    </button>
                  </div>

                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px' }}>Category Name</th>
                          <th style={{ padding: '10px 14px' }}>Slug</th>
                          <th style={{ padding: '10px 14px' }}>Products Count</th>
                          <th style={{ padding: '10px 14px' }}>Status</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                              {c.description && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{c.description}</div>}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.slug}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{c.product_count || 0}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <button
                                onClick={() => handleToggleCategoryActive(c.id)}
                                style={{
                                  background: c.is_active ? '#dcfce7' : '#fee2e2',
                                  color: c.is_active ? '#15803d' : '#b91c1c',
                                  border: 'none',
                                  borderRadius: 999,
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {c.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleOpenEditCategory(c)}
                                style={{ background: 'none', border: 'none', color: '#064e3b', cursor: 'pointer', marginRight: 10 }}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(c.id)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 4. INVENTORY MODULE ==================== */}
              {activeTab === 'inventory' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Depot Inventory & Stock Control
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                        Current Low Stock Threshold: <strong>{stats?.low_stock_threshold || 20} units</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search product or SKU..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        style={{ width: 220 }}
                      />
                      <select
                        className="form-input"
                        value={inventoryStatusFilter}
                        onChange={(e) => setInventoryStatusFilter(e.target.value)}
                        style={{ width: 150 }}
                      >
                        <option value="all">All Inventory</option>
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock (≤ {stats?.low_stock_threshold || 20})</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px' }}>Product Name</th>
                          <th style={{ padding: '10px 14px' }}>SKU / Code</th>
                          <th style={{ padding: '10px 14px' }}>Category</th>
                          <th style={{ padding: '10px 14px' }}>Price</th>
                          <th style={{ padding: '10px 14px' }}>Current Stock</th>
                          <th style={{ padding: '10px 14px' }}>Stock Status</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Quick Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventory.map(p => {
                          const threshold = stats?.low_stock_threshold || 20;
                          let statusLabel = 'In Stock';
                          let statusBg = '#dcfce7';
                          let statusColor = '#15803d';

                          if (p.stock <= 0) {
                            statusLabel = 'Out of Stock';
                            statusBg = '#fee2e2';
                            statusColor = '#dc2626';
                          } else if (p.stock <= threshold) {
                            statusLabel = 'Low Stock';
                            statusBg = '#fef3c7';
                            statusColor = '#b45309';
                          }

                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                                {p.name}
                              </td>
                              <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>
                                {p.sku || `BC-${p.id}`}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#475569' }}>
                                {p.category_name || categories.find(c => c.id === p.category_id)?.name || 'N/A'}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#064e3b' }}>
                                ₹{p.price}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: '0.95rem' }}>
                                {p.stock} {p.unit}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  background: statusBg,
                                  color: statusColor,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  padding: '3px 8px',
                                  borderRadius: 999
                                }}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const val = e.target.elements.stockVal.value;
                                    handleQuickStockUpdate(p.id, val);
                                  }}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                  <input
                                    name="stockVal"
                                    type="number"
                                    defaultValue={p.stock}
                                    style={{ width: 70, padding: '4px 6px', fontSize: '0.82rem', borderRadius: 4, border: '1px solid #cbd5e1' }}
                                  />
                                  <button
                                    type="submit"
                                    style={{
                                      background: '#064e3b',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 4,
                                      padding: '4px 8px',
                                      fontSize: '0.76rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Save
                                  </button>
                                </form>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 5. ORDERS MODULE ==================== */}
              {activeTab === 'orders' && (
                <div>
                  {/* Multi-Filters */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search order #, customer, UTR..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') fetchOrders(); }}
                        style={{ paddingLeft: 34, width: '100%' }}
                      />
                    </div>

                    <select
                      className="form-input"
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      style={{ width: 140 }}
                    >
                      <option value="all">All Order Statuses</option>
                      <option value="pending_payment">Pending Payment</option>
                      <option value="payment_verification">Under Verification</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      className="form-input"
                      value={orderPaymentFilter}
                      onChange={(e) => setOrderPaymentFilter(e.target.value)}
                      style={{ width: 140 }}
                    >
                      <option value="all">All Payments</option>
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>From:</span>
                      <input
                        type="date"
                        className="form-input"
                        value={orderDateFrom}
                        onChange={(e) => setOrderDateFrom(e.target.value)}
                        style={{ width: 130, padding: '6px 8px' }}
                      />
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>To:</span>
                      <input
                        type="date"
                        className="form-input"
                        value={orderDateTo}
                        onChange={(e) => setOrderDateTo(e.target.value)}
                        style={{ width: 130, padding: '6px 8px' }}
                      />
                    </div>

                    <button
                      onClick={fetchOrders}
                      style={{
                        background: '#064e3b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Filter
                    </button>
                  </div>

                  {/* Orders Table */}
                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px' }}>Order #</th>
                          <th style={{ padding: '10px 14px' }}>Date</th>
                          <th style={{ padding: '10px 14px' }}>Customer</th>
                          <th style={{ padding: '10px 14px' }}>Amount</th>
                          <th style={{ padding: '10px 14px' }}>Payment</th>
                          <th style={{ padding: '10px 14px' }}>Status</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <strong style={{ color: '#064e3b' }}>{o.order_number}</strong>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                Tracking: {o.tracking_number || 'N/A'}
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b' }}>
                              {new Date(o.created_at).toLocaleDateString('en-IN')}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                {o.customer_name || o.parsed_address?.fullName || 'Customer'}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                {o.customer_phone || o.parsed_address?.phone || ''}
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 800, color: '#064e3b' }}>
                              ₹{o.grand_total}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div>{o.payment_method || 'COD'}</div>
                              <span style={{
                                fontSize: '0.72rem',
                                color: o.payment_status === 'paid' ? '#15803d' : '#b45309',
                                fontWeight: 700,
                                textTransform: 'capitalize'
                              }}>
                                {o.payment_status || 'Pending'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {getOrderStatusBadge(o.status)}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  onClick={() => setSelectedOrderDetail(o)}
                                  style={{
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    fontSize: '0.76rem',
                                    color: '#334155',
                                    cursor: 'pointer'
                                  }}
                                  title="View Order Details"
                                >
                                  <Eye size={13} style={{ display: 'inline', marginRight: 4 }} /> View
                                </button>
                                <button
                                  onClick={() => handleOpenStatusModal(o)}
                                  style={{
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    fontSize: '0.76rem',
                                    color: '#047857',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Update
                                </button>
                                {o.status !== 'cancelled' && (
                                  <button
                                    onClick={() => setCancelOrderTarget(o)}
                                    style={{
                                      background: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      borderRadius: 4,
                                      padding: '4px 8px',
                                      fontSize: '0.76rem',
                                      color: '#dc2626',
                                      cursor: 'pointer'
                                    }}
                                    title="Cancel Order"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 6. PAYMENTS MODULE ==================== */}
              {activeTab === 'payments' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        UPI Payment Verification Queue
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                        Reconcile customer bank credits and verify UTR numbers before dispatching.
                      </div>
                    </div>

                    <select
                      className="form-input"
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      style={{ width: 180 }}
                    >
                      <option value="all">All Payments</option>
                      <option value="submitted">Submitted / Verification Pending</option>
                      <option value="pending">Pending Customer Submission</option>
                      <option value="paid">Verified & Paid</option>
                      <option value="failed">Rejected / Failed</option>
                    </select>
                  </div>

                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px' }}>Order #</th>
                          <th style={{ padding: '10px 14px' }}>Customer</th>
                          <th style={{ padding: '10px 14px' }}>Amount</th>
                          <th style={{ padding: '10px 14px' }}>Method & UTR</th>
                          <th style={{ padding: '10px 14px' }}>Submitted At</th>
                          <th style={{ padding: '10px 14px' }}>Status</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.payment_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <strong style={{ color: '#064e3b' }}>{p.order_number}</strong>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 600 }}>{p.customer_name || 'Customer'}</div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{p.customer_phone || ''}</div>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 800, color: '#064e3b' }}>
                              ₹{p.amount}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div>{p.payment_method}</div>
                              {p.transaction_reference ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    {p.transaction_reference}
                                  </code>
                                  <button
                                    onClick={() => copyUtr(p.transaction_reference, p.payment_id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#064e3b' }}
                                    title="Copy UTR"
                                  >
                                    {copiedPaymentId === p.payment_id ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>No UTR yet</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.78rem' }}>
                              {p.customer_submitted_at ? new Date(p.customer_submitted_at).toLocaleString('en-IN') : 'N/A'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                textTransform: 'uppercase',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: 999,
                                background: p.payment_status === 'paid' ? '#dcfce7' : (['submitted', 'under_verification'].includes(p.payment_status) ? '#fef3c7' : '#f1f5f9'),
                                color: p.payment_status === 'paid' ? '#15803d' : (['submitted', 'under_verification'].includes(p.payment_status) ? '#b45309' : '#64748b')
                              }}>
                                {p.payment_status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              {['submitted', 'under_verification', 'pending'].includes(p.payment_status) ? (
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    onClick={() => handleVerifyPayment(p.payment_id)}
                                    disabled={actionInProgressId === p.payment_id}
                                    style={{
                                      background: '#059669',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 4,
                                      padding: '4px 10px',
                                      fontSize: '0.76rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(p.payment_id)}
                                    disabled={actionInProgressId === p.payment_id}
                                    style={{
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      border: '1px solid #fca5a5',
                                      borderRadius: 4,
                                      padding: '4px 10px',
                                      fontSize: '0.76rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Processed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 7. CUSTOMERS MODULE ==================== */}
              {activeTab === 'customers' && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Registered Customer Directory
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                      Track customer accounts, historical order counts, and lifetime festival spend.
                    </div>
                  </div>

                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px' }}>Customer Name</th>
                          <th style={{ padding: '10px 14px' }}>Contact</th>
                          <th style={{ padding: '10px 14px' }}>Registered On</th>
                          <th style={{ padding: '10px 14px' }}>Total Orders</th>
                          <th style={{ padding: '10px 14px' }}>Lifetime Spend</th>
                          <th style={{ padding: '10px 14px' }}>Last Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                              {c.name}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div>{c.email}</div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{c.phone}</div>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b' }}>
                              {new Date(c.registered_at).toLocaleDateString('en-IN')}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                              {c.total_orders}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 800, color: '#064e3b' }}>
                              ₹{Number(c.lifetime_spent).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b' }}>
                              {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('en-IN') : 'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 8. ADDRESSES MODULE ==================== */}
              {activeTab === 'addresses' && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Customer Delivery Address Directory
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                      Saved customer shipping addresses used for Sivakasi hazardous consignment booking.
                    </div>
                  </div>

                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px' }}>Recipient & Phone</th>
                          <th style={{ padding: '10px 14px' }}>Account User</th>
                          <th style={{ padding: '10px 14px' }}>Address Details</th>
                          <th style={{ padding: '10px 14px' }}>City, State & PIN</th>
                          <th style={{ padding: '10px 14px' }}>Orders Here</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addresses.map(a => (
                          <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <strong style={{ color: '#0f172a' }}>{a.full_name}</strong>
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{a.phone}</div>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#475569' }}>
                              {a.customer_name || 'Customer'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div>{a.house_building || a.street}</div>
                              {a.street_area && <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{a.street_area}</div>}
                              {a.landmark && <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Near {a.landmark}</div>}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#334155' }}>
                              {a.city}, {a.state} - <strong>{a.pincode}</strong>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#064e3b' }}>
                              {a.orders_delivered_here || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 9. OFFERS & COUPONS MODULE ==================== */}
              {activeTab === 'coupons' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Offers & Discount Coupons
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                        Configure festival promotional codes, minimum order value, and discount limits.
                      </div>
                    </div>

                    <button
                      onClick={() => setShowCouponModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#064e3b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '9px 18px',
                        fontWeight: 600,
                        fontSize: '0.86rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} /> Create Coupon
                    </button>
                  </div>

                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px' }}>Coupon Code</th>
                          <th style={{ padding: '10px 14px' }}>Description</th>
                          <th style={{ padding: '10px 14px' }}>Discount</th>
                          <th style={{ padding: '10px 14px' }}>Min Order / Max Cap</th>
                          <th style={{ padding: '10px 14px' }}>Status</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map(cp => (
                          <tr key={cp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#064e3b' }}>
                                {cp.code}
                              </strong>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#475569' }}>
                              {cp.description || 'Promotional coupon'}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                              {cp.discount_type === 'flat' ? `₹${cp.discount_value} FLAT` : `${cp.discount_value}% OFF`}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b' }}>
                              <div>Min: ₹{cp.min_order_amount || 0}</div>
                              {cp.max_discount_amount && <div>Max Cap: ₹{cp.max_discount_amount}</div>}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <button
                                onClick={() => handleToggleCoupon(cp.id)}
                                style={{
                                  background: cp.is_active ? '#dcfce7' : '#fee2e2',
                                  color: cp.is_active ? '#15803d' : '#b91c1c',
                                  border: 'none',
                                  borderRadius: 999,
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {cp.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteCoupon(cp.id)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                                title="Delete Coupon"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 10. SETTINGS MODULE ==================== */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {/* Store Contact Info */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                        Store Information
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label className="form-label">Store Brand Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.store_name}
                            onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Customer Care Phone</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.store_phone}
                            onChange={(e) => setSettingsForm({ ...settingsForm, store_phone: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Store Support Email</label>
                          <input
                            type="email"
                            className="form-input"
                            value={settingsForm.store_email}
                            onChange={(e) => setSettingsForm({ ...settingsForm, store_email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Sivakasi Depot Address</label>
                          <textarea
                            className="form-input"
                            rows={3}
                            value={settingsForm.store_address}
                            onChange={(e) => setSettingsForm({ ...settingsForm, store_address: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment & UPI Settings */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                        Payment & UPI Configuration
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label className="form-label">Default UPI ID (Payee VPA)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.shop_upi_id}
                            onChange={(e) => setSettingsForm({ ...settingsForm, shop_upi_id: e.target.value })}
                            placeholder="e.g. YOUR_UPI_ID@upi"
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Payee / Account Name in UPI</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.shop_name}
                            onChange={(e) => setSettingsForm({ ...settingsForm, shop_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Payment QR Expiry (Minutes)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={settingsForm.payment_expiry_minutes}
                            onChange={(e) => setSettingsForm({ ...settingsForm, payment_expiry_minutes: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <input
                            type="checkbox"
                            id="set_require_utr"
                            checked={settingsForm.require_utr}
                            onChange={(e) => setSettingsForm({ ...settingsForm, require_utr: e.target.checked })}
                          />
                          <label htmlFor="set_require_utr" style={{ fontSize: '0.84rem', color: '#334155', cursor: 'pointer' }}>
                            Mandate 12-digit UPI UTR / Reference number for verification
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Thresholds & Shipping */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                        Fulfillment & Inventory Thresholds
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label className="form-label">Low Stock Alert Threshold (Units)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={settingsForm.low_stock_threshold}
                            onChange={(e) => setSettingsForm({ ...settingsForm, low_stock_threshold: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Minimum Order Value (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={settingsForm.min_order_amount}
                            onChange={(e) => setSettingsForm({ ...settingsForm, min_order_amount: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Standard Delivery Charge (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={settingsForm.shipping_fee}
                            onChange={(e) => setSettingsForm({ ...settingsForm, shipping_fee: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Free Delivery Threshold (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={settingsForm.free_shipping_threshold}
                            onChange={(e) => setSettingsForm({ ...settingsForm, free_shipping_threshold: Number(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      type="submit"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#064e3b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 24px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Save size={16} /> Save All Store Settings
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* ==================== SUB-MODAL: ORDER DETAIL & TIMELINE ==================== */}
        {selectedOrderDetail && (
          <div className="modal-backdrop" onClick={() => setSelectedOrderDetail(null)} style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: 800, maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Order Details: {selectedOrderDetail.order_number}
                </h3>
                <button className="modal-close-btn" onClick={() => setSelectedOrderDetail(null)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Status bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Status: </span>
                    {getOrderStatusBadge(selectedOrderDetail.status)}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Placed On: </span>
                    <strong>{new Date(selectedOrderDetail.created_at).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Items list */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#334155', marginBottom: 8 }}>Order Items</h4>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    {selectedOrderDetail.items?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <div>
                          <strong>{it.product_name}</strong>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>₹{it.price} × {it.quantity}</div>
                        </div>
                        <div style={{ fontWeight: 700 }}>₹{it.total_price}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                  <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Subtotal: ₹{selectedOrderDetail.subtotal}</div>
                  {selectedOrderDetail.discount > 0 && <div style={{ fontSize: '0.84rem', color: '#16a34a' }}>Discount: -₹{selectedOrderDetail.discount}</div>}
                  <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Delivery Charge: ₹{selectedOrderDetail.delivery_charge}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#064e3b' }}>Grand Total: ₹{selectedOrderDetail.grand_total}</div>
                </div>

                {/* Delivery address snapshot */}
                {selectedOrderDetail.parsed_address && (
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
                    <h5 style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 4 }}>Delivery Destination</h5>
                    <div><strong>{selectedOrderDetail.parsed_address.fullName}</strong> ({selectedOrderDetail.parsed_address.phone})</div>
                    <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                      {selectedOrderDetail.parsed_address.houseBuilding || selectedOrderDetail.parsed_address.street},{' '}
                      {selectedOrderDetail.parsed_address.streetArea ? `${selectedOrderDetail.parsed_address.streetArea}, ` : ''}
                      {selectedOrderDetail.parsed_address.city}, {selectedOrderDetail.parsed_address.state} - {selectedOrderDetail.parsed_address.pincode}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUB-MODAL: UPDATE ORDER STATUS ==================== */}
        {orderStatusChangeTarget && (
          <div className="modal-backdrop" onClick={() => setOrderStatusChangeTarget(null)} style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Update Status: {orderStatusChangeTarget.order_number}
                </h3>
                <button className="modal-close-btn" onClick={() => setOrderStatusChangeTarget(null)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Order Progression Stage</label>
                  <select
                    className="form-input"
                    value={targetNextStatus}
                    onChange={(e) => setTargetNextStatus(e.target.value)}
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="payment_verification">Payment Verification</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing at Depot</option>
                    <option value="packed">Packed & Sealed</option>
                    <option value="shipped">Shipped via Express</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Carrier Tracking Number / Waybill</label>
                  <input
                    type="text"
                    className="form-input"
                    value={targetTrackingNumber}
                    onChange={(e) => setTargetTrackingNumber(e.target.value)}
                    placeholder="e.g. TRK-BLAST-2026-7841"
                  />
                </div>

                <div>
                  <label className="form-label">Status Update Audit Note (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={targetStatusNotes}
                    onChange={(e) => setTargetStatusNotes(e.target.value)}
                    placeholder="e.g. Dispatched from Sivakasi central hub"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => setOrderStatusChangeTarget(null)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOrderStatus}
                    style={{ background: '#064e3b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Save Status Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUB-MODAL: ADMIN CANCEL ORDER ==================== */}
        {cancelOrderTarget && (
          <div className="modal-backdrop" onClick={() => setCancelOrderTarget(null)} style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#dc2626', margin: 0 }}>
                  Cancel Order #{cancelOrderTarget.order_number}
                </h3>
                <button className="modal-close-btn" onClick={() => setCancelOrderTarget(null)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '0.86rem', color: '#334155', margin: '0 0 12px 0' }}>
                  Cancelling this order will immediately mark it as cancelled, fail active payments, and <strong>restore reserved fireworks inventory back to the warehouse stock</strong>.
                </p>

                <label className="form-label">Cancellation Reason</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Customer requested cancellation / Out of stock item"
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  style={{ width: '100%', marginBottom: 16 }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={() => setCancelOrderTarget(null)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAdminCancelOrder}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Confirm Cancellation & Restore Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUB-MODAL: PRODUCT ADD / EDIT ==================== */}
        {showProductModal && (
          <div className="modal-backdrop" onClick={() => setShowProductModal(false)} style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: 740, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Fireworks Product'}
                </h3>
                <button className="modal-close-btn" onClick={() => setShowProductModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Product Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">SKU / Item Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="e.g. BC-1025"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label">Category *</label>
                    <select
                      className="form-input"
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: Number(e.target.value) })}
                      required
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Selling Price (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">MRP (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productForm.mrp}
                      onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Stock Quantity *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label">Unit Type</label>
                    <input
                      type="text"
                      className="form-input"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      placeholder="e.g. Box / Pack"
                    />
                  </div>
                  <div>
                    <label className="form-label">Pieces Count</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productForm.piece_count}
                      onChange={(e) => setProductForm({ ...productForm, piece_count: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Sound Level</label>
                    <select
                      className="form-input"
                      value={productForm.sound_level}
                      onChange={(e) => setProductForm({ ...productForm, sound_level: e.target.value })}
                    >
                      <option value="Low / Silent">Low / Silent</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Very High">Very High</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Safety Distance</label>
                    <input
                      type="text"
                      className="form-input"
                      value={productForm.safety_distance}
                      onChange={(e) => setProductForm({ ...productForm, safety_distance: e.target.value })}
                      placeholder="e.g. 5 Meters"
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Product Image (URL or Cloud File)</label>
                    {productForm.image_url && (
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Active Image Configured</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <input
                      type="url"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Paste image URL or click Upload..."
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    />
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: isUploadingImage ? 'wait' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#334155',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      title="Upload image directly to Cloudinary, Supabase or local storage"
                    >
                      <Upload size={14} />
                      {isUploadingImage ? 'Uploading...' : 'Upload File'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        disabled={isUploadingImage}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  {uploadError && (
                    <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 6px' }}>{uploadError}</p>
                  )}
                  {productForm.image_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <img
                        src={productForm.image_url}
                        alt="Preview"
                        style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                        Preview: {productForm.image_url.slice(0, 60)}...
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Short Tagline Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={productForm.short_desc}
                    onChange={(e) => setProductForm({ ...productForm, short_desc: e.target.value })}
                    placeholder="e.g. Sivakasi traditional red crackers string"
                  />
                </div>

                <div>
                  <label className="form-label">Full Description & Safety Instructions</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={productForm.is_featured}
                      onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                    />
                    Featured on Home
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={productForm.is_offer}
                      onChange={(e) => setProductForm({ ...productForm, is_offer: e.target.checked })}
                    />
                    Festival Offer Tag
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={productForm.is_active}
                      onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    />
                    Active in Catalog
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#064e3b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== SUB-MODAL: CATEGORY ADD / EDIT ==================== */}
        {showCategoryModal && (
          <div className="modal-backdrop" onClick={() => setShowCategoryModal(false)} style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
                </h3>
                <button className="modal-close-btn" onClick={() => setShowCategoryModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#064e3b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== SUB-MODAL: COUPON ADD ==================== */}
        {showCouponModal && (
          <div className="modal-backdrop" onClick={() => setShowCouponModal(false)} style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  Create Discount Offer Coupon
                </h3>
                <button className="modal-close-btn" onClick={() => setShowCouponModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Coupon Promo Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. DIWALI50"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    required
                    style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label className="form-label">Offer Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Flat ₹200 OFF on orders above ₹1500"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Discount Type</label>
                    <select
                      className="form-input"
                      value={couponForm.discount_type}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Discount Value *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={couponForm.discount_value}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                      placeholder="e.g. 10 or 200"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={couponForm.min_order_amount}
                      onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })}
                      placeholder="e.g. 1000"
                    />
                  </div>
                  <div>
                    <label className="form-label">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={couponForm.max_discount_amount}
                      onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#064e3b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Create Coupon
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
