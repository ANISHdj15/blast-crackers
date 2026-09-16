import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Leaf, 
  Volume2, 
  Clock, 
  Ruler, 
  Package, 
  Check, 
  Plus, 
  Minus 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductDetailModal = ({ product, onClose, onSelectProduct, onBuyNow }) => {
  const { addToCart } = useCart();
  const [productData, setProductData] = useState(product);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState(product?.primary_image || '');
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!product?.id) return;
    setLoading(true);
    fetch(`/api/products/${product.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.product) {
          setProductData(data.product);
          setRelated(data.related || []);
          if (data.product.images && data.product.images.length > 0) {
            setSelectedImage(data.product.images[0].image_url);
          } else {
            setSelectedImage(data.product.primary_image || '');
          }
        }
      })
      .catch(err => console.error('Fetch detail modal error:', err))
      .finally(() => setLoading(false));
  }, [product?.id]);

  if (!product) return null;

  const handleAddToCart = async () => {
    if (productData.stock <= 0) return;
    const success = await addToCart(productData.id, qty);
    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  const handleDirectBuy = async () => {
    if (productData.stock <= 0) return;
    await addToCart(productData.id, qty);
    onClose();
    if (onBuyNow) {
      onBuyNow();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close details">
          <X size={20} />
        </button>

        <div className="product-detail-layout">
          {/* Gallery Column */}
          <div className="modal-gallery">
            <div className="main-preview-box">
              <img 
                src={selectedImage || productData.primary_image || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'} 
                alt={productData.name} 
              />
            </div>

            {productData.images && productData.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {productData.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.image_url}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => setSelectedImage(img.image_url)}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: selectedImage === img.image_url ? '2px solid #047857' : '1px solid #e2e8f0'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Green Cracker Assurance Card */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginTop: 12
            }}>
              <Leaf size={28} color="#15803d" style={{ flexShrink: 0 }} />
              <div>
                <h5 style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700, marginBottom: 2 }}>
                  CSIR-NEERI Certified Green Cracker
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.4 }}>
                  Formulated with low emission oxidizers (SWAS/STAR). 30% less smoke and barium-free.
                </p>
              </div>
            </div>
          </div>

          {/* Details & Purchase Column */}
          <div className="detail-info-col">
            <span className="detail-category-badge">
              {productData.category_name}
            </span>

            <h2 className="detail-title">
              {productData.name}
            </h2>

            {/* Price Box */}
            <div className="detail-price-box">
              <span className="detail-price">₹{productData.price}</span>
              {productData.mrp > productData.price && (
                <>
                  <span className="detail-mrp">₹{productData.mrp}</span>
                  <span className="detail-discount-tag">{productData.discount_percent}% OFF</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857', marginLeft: 'auto' }}>
                    You Save ₹{productData.mrp - productData.price}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="detail-desc">
              {productData.description || productData.short_desc}
            </p>

            {/* Specifications Table */}
            <h4 style={{ fontSize: '0.95rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} color="#047857" /> Technical Specifications
            </h4>
            <table className="specs-table">
              <tbody>
                <tr>
                  <td className="spec-label">Sound Level</td>
                  <td className="spec-value">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Volume2 size={14} /> {productData.sound_level} (Within legal limits)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="spec-label">Packing Unit</td>
                  <td className="spec-value">{productData.piece_count} Pieces per {productData.unit}</td>
                </tr>
                <tr>
                  <td className="spec-label">Approx Duration</td>
                  <td className="spec-value">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} /> {productData.duration}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="spec-label">Safe Viewing Distance</td>
                  <td className="spec-value">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Ruler size={14} /> {productData.safety_distance} minimum
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="spec-label">Manufacturing Origin</td>
                  <td className="spec-value">Sivakasi, Tamil Nadu, India</td>
                </tr>
                <tr>
                  <td className="spec-label">Stock Availability</td>
                  <td className="spec-value">
                    {productData.stock > 0 ? (
                      <span style={{ color: '#15803d', fontWeight: 700 }}>
                        In Stock ({productData.stock} units ready to dispatch)
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>Out of Stock</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Safety Guidelines Warning */}
            <div className="safety-note-box">
              <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Festive Safety Guidelines:</strong> Always light in an open area using an incense stick. Never bend over the fireworks while igniting. Keep a bucket of water nearby.
              </div>
            </div>

            {/* Stepper + Add to Cart + Buy Now */}
            <div className="detail-actions-row">
              {productData.stock > 0 && (
                <div className="qty-stepper">
                  <button 
                    className="stepper-btn" 
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="stepper-value" style={{ width: 40, fontSize: '1rem' }}>{qty}</span>
                  <button 
                    className="stepper-btn" 
                    onClick={() => setQty(q => Math.min(productData.stock, q + 1))}
                    disabled={qty >= productData.stock}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}

              <button
                className={`btn-add-cart ${isAdded ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={productData.stock <= 0}
                style={{ height: 48, fontSize: '0.95rem' }}
              >
                {isAdded ? (
                  <>
                    <Check size={18} /> Added to Cart
                  </>
                ) : productData.stock <= 0 ? (
                  'Out of Stock'
                ) : (
                  <>
                    <ShoppingCart size={18} /> Add to Cart
                  </>
                )}
              </button>

              {productData.stock > 0 && (
                <button 
                  className="btn-buy-now" 
                  onClick={handleDirectBuy}
                  style={{ height: 48 }}
                >
                  <Zap size={18} /> Buy Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Carousel */}
        {related.length > 0 && (
          <div style={{ padding: '20px 16px', borderTop: '1px solid #e2e8f0', marginTop: 10 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>
              You may also like in {productData.category_name}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {related.map(rel => (
                <div 
                  key={rel.id}
                  onClick={() => {
                    setProductData(rel);
                    setSelectedImage(rel.primary_image || '');
                  }}
                  style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: 10,
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img 
                    src={rel.primary_image} 
                    alt={rel.name}
                    style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                  />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rel.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ color: '#064e3b', fontWeight: 800 }}>₹{rel.price}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{rel.mrp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
