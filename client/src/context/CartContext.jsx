import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

function getSessionId() {
  let sid = localStorage.getItem('blast_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem('blast_session_id', sid);
  }
  return sid;
}

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [mrpTotal, setMrpTotal] = useState(0);
  const [savings, setSavings] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Helper headers
  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['x-session-id'] = getSessionId();
    }
    return headers;
  }, [token]);

  // Fetch Cart from Backend
  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cart', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setSubtotal(data.subtotal || 0);
        setMrpTotal(data.mrp_total || 0);
        setSavings(data.savings || 0);
        setTotalItems(data.total_items || 0);
      }
    } catch (err) {
      console.error('Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // On auth state change, if logged in, merge guest cart
  useEffect(() => {
    const syncCart = async () => {
      if (token) {
        const sid = localStorage.getItem('blast_session_id');
        if (sid) {
          try {
            await fetch('/api/cart/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ session_id: sid })
            });
            localStorage.removeItem('blast_session_id');
          } catch (e) {
            console.error('Cart sync error:', e);
          }
        }
      }
      refreshCart();
    };

    syncCart();
  }, [token, refreshCart]);

  // Add Item to Cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          product_id: productId,
          quantity,
          session_id: !token ? getSessionId() : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Added to festive cart!', 'success');
        await refreshCart();
        return true;
      } else {
        showToast(data.message || 'Could not add to cart.', 'error');
        return false;
      }
    } catch (err) {
      showToast('Network error while adding to cart.', 'error');
      return false;
    }
  };

  // Update Item Quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          product_id: productId,
          quantity,
          session_id: !token ? getSessionId() : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        await refreshCart();
      } else {
        showToast(data.message || 'Failed to update quantity.', 'error');
      }
    } catch (err) {
      showToast('Network error while updating cart.', 'error');
    }
  };

  // Remove Item
  const removeFromCart = async (productId) => {
    try {
      const res = await fetch(`/api/cart/remove/${productId}${!token ? `?session_id=${getSessionId()}` : ''}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast('Item removed from cart', 'info');
        await refreshCart();
      }
    } catch (err) {
      showToast('Failed to remove item.', 'error');
    }
  };

  // Clear Cart
  const clearCart = async () => {
    try {
      await fetch(`/api/cart/clear${!token ? `?session_id=${getSessionId()}` : ''}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      setItems([]);
      setSubtotal(0);
      setMrpTotal(0);
      setSavings(0);
      setTotalItems(0);
      setCoupon(null);
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  };

  // Coupon application
  const applyCoupon = (code) => {
    if (!code) return false;
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'DIWALI2026') {
      if (subtotal < 1500) {
        showToast('DIWALI2026 requires a minimum order of ₹1,500', 'error');
        return false;
      }
      setCoupon({ code: 'DIWALI2026', discount: 200, label: 'Festive Special ₹200 OFF' });
      showToast('Coupon DIWALI2026 applied! ₹200 saved.', 'success');
      return true;
    } else if (cleanCode === 'FESTIVE10') {
      const discountVal = Math.round(subtotal * 0.10);
      setCoupon({ code: 'FESTIVE10', discount: discountVal, label: '10% Festive Discount' });
      showToast(`Coupon FESTIVE10 applied! ₹${discountVal} saved.`, 'success');
      return true;
    } else if (cleanCode === 'FLASHSALE') {
      const discountVal = Math.round(subtotal * 0.15);
      setCoupon({ code: 'FLASHSALE', discount: discountVal, label: '15% Flash Sale Discount' });
      showToast(`Coupon FLASHSALE applied! ₹${discountVal} saved.`, 'success');
      return true;
    } else {
      showToast('Invalid coupon code. Try DIWALI2026 or FESTIVE10', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const couponDiscount = coupon ? coupon.discount : 0;
  // Free delivery over ₹1,999, else ₹150 for fragile fireworks transport
  const effectiveSubtotal = Math.max(0, subtotal - couponDiscount);
  const deliveryCharge = effectiveSubtotal >= 1999 || effectiveSubtotal === 0 ? 0 : 150;
  const grandTotal = effectiveSubtotal > 0 ? effectiveSubtotal + deliveryCharge : 0;

  return (
    <CartContext.Provider value={{
      items,
      subtotal,
      mrpTotal,
      savings,
      totalItems,
      loading,
      coupon,
      couponDiscount,
      deliveryCharge,
      grandTotal,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
