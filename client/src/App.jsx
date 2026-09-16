import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { StoreView } from './components/StoreView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { UpiPaymentModal } from './components/UpiPaymentModal';
import { LegalSafetyModal } from './components/LegalSafetyModal';
import { Footer } from './components/Footer';

function MainApp() {
  const { isAuthenticated } = useAuth();

  // Navigation and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState('login');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [orderDetailNumber, setOrderDetailNumber] = useState('');

  // Legal & Safety Modal State
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState('safety');

  // UPI Payment Modal State
  const [isUpiOpen, setIsUpiOpen] = useState(false);
  const [upiOrderNumber, setUpiOrderNumber] = useState('');
  const [upiInitialOrder, setUpiInitialOrder] = useState(null);
  const [upiInitialDetails, setUpiInitialDetails] = useState(null);

  // Track if authentication was triggered specifically to continue checkout
  const [pendingCheckoutAfterAuth, setPendingCheckoutAfterAuth] = useState(false);

  // Confirmation state
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [confirmedItems, setConfirmedItems] = useState([]);

  // Store reload trigger (e.g. after admin catalog edits)
  const [storeReloadKey, setStoreReloadKey] = useState(0);

  // Customer Checkout Initiation
  const handleInitiateCheckout = () => {
    if (!isAuthenticated) {
      setPendingCheckoutAfterAuth(true);
      setAuthDefaultTab('login');
      setIsAuthOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  // Callback when login or registration completes successfully
  const handleAuthSuccess = () => {
    if (pendingCheckoutAfterAuth) {
      setPendingCheckoutAfterAuth(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleOrderSuccess = (order, items, upiDetails) => {
    if (order.status === 'pending_payment' || order.status === 'payment_verification' || upiDetails) {
      setUpiOrderNumber(order.order_number);
      setUpiInitialOrder(order);
      setUpiInitialDetails(upiDetails || null);
      setIsUpiOpen(true);
    } else {
      setConfirmedOrder(order);
      setConfirmedItems(items);
    }
  };

  const handleOpenUpi = (orderNum) => {
    setUpiOrderNumber(orderNum);
    setUpiInitialOrder(null);
    setUpiInitialDetails(null);
    setIsUpiOpen(true);
  };

  const handleStartTracking = (orderNumber) => {
    setTrackingOrderNumber(orderNumber);
    setIsTrackingOpen(true);
  };

  const handleViewOrder = (orderNumber) => {
    setOrderDetailNumber(orderNumber);
    setIsOrderDetailOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const handleOpenLegal = (tab = 'safety') => {
    setLegalInitialTab(tab);
    setIsLegalOpen(true);
  };

  return (
    <div className="app-root">
      {/* 1. Header with live search, sticky nav, branding & cart trigger */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAuth={() => {
          setAuthDefaultTab('login');
          setPendingCheckoutAfterAuth(false);
          setIsAuthOpen(true);
        }}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onSelectCategory={(slug) => setSelectedCategory(slug)}
        onResetFilters={handleResetFilters}
        onOpenLegal={handleOpenLegal}
      />

      {/* 2. Store View: Immediately visible upon opening without big hero pushes! */}
      <main>
        <StoreView
          key={storeReloadKey}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onSelectProduct={(prod) => setSelectedProduct(prod)}
        />
      </main>

      {/* 3. Product Details Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelectProduct={(prod) => setSelectedProduct(prod)}
          onBuyNow={handleInitiateCheckout}
        />
      )}

      {/* 4. Cart Slide-Over Drawer */}
      <CartDrawer
        onProceedToCheckout={handleInitiateCheckout}
      />

      {/* 5. Step-Based Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* 6. Order Confirmation Modal */}
      {confirmedOrder && (
        <OrderConfirmationModal
          order={confirmedOrder}
          items={confirmedItems}
          onClose={() => setConfirmedOrder(null)}
          onTrackOrder={handleStartTracking}
        />
      )}

      {/* 7. Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderNumber={trackingOrderNumber}
      />

      {/* 8. Customer Account Modal */}
      <CustomerAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onTrackOrder={handleStartTracking}
        onViewOrder={handleViewOrder}
        onOpenUpiPayment={handleOpenUpi}
      />

      {/* 8.25. Order Detail & Cancel Modal */}
      <OrderDetailModal
        isOpen={isOrderDetailOpen}
        onClose={() => setIsOrderDetailOpen(false)}
        orderNumber={orderDetailNumber}
        onOrderCancelled={() => {
          setStoreReloadKey(k => k + 1);
        }}
        onTrackOrder={handleStartTracking}
      />

      {/* 8.5. UPI Dynamic QR Payment Modal */}
      <UpiPaymentModal
        isOpen={isUpiOpen}
        onClose={() => setIsUpiOpen(false)}
        orderNumber={upiOrderNumber}
        initialOrder={upiInitialOrder}
        initialUpiDetails={upiInitialDetails}
        onPaymentSubmitted={(ord, pay) => {
          setStoreReloadKey(k => k + 1);
        }}
        onTrackOrder={handleStartTracking}
      />

      {/* 9. Admin Dashboard Console Modal */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshStore={() => setStoreReloadKey(k => k + 1)}
      />

      {/* 10. Authentication Modal (Login / Register) with seamless checkout continuation */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingCheckoutAfterAuth(false);
        }}
        defaultTab={authDefaultTab}
        onSuccess={handleAuthSuccess}
      />

      {/* 11. Legal & Safety Portal Modal */}
      <LegalSafetyModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalInitialTab}
      />

      {/* 12. Footer */}
      <Footer
        onSelectCategory={(slug) => {
          setSelectedCategory(slug);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenLegal={handleOpenLegal}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
