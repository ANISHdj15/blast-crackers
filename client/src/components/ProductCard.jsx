import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Heart, 
  Eye, 
  Leaf, 
  Star, 
  Volume2, 
  Clock, 
  Package, 
  Check, 
  Plus, 
  Minus 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(() => {
    const list = localStorage.getItem('blast_wishlist');
    return list ? JSON.parse(list).includes(product.id) : false;
  });

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (product.stock <= 0) return;

    const success = await addToCart(product.id, qty);
    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    const saved = localStorage.getItem('blast_wishlist');
    let list = saved ? JSON.parse(saved) : [];
    if (list.includes(product.id)) {
      list = list.filter(id => id !== product.id);
      setIsWishlisted(false);
    } else {
      list.push(product.id);
      setIsWishlisted(true);
    }
    localStorage.setItem('blast_wishlist', JSON.stringify(list));
  };

  const increment = (e) => {
    e.stopPropagation();
    if (qty < product.stock) {
      setQty(q => q + 1);
    }
  };

  const decrement = (e) => {
    e.stopPropagation();
    if (qty > 1) {
      setQty(q => q - 1);
    }
  };

  const isLowStock = product.stock > 0 && product.stock <= 20;
  const isOutOfStock = product.stock <= 0;

  return (
    <article className="product-card" onClick={() => onSelectProduct(product)}>
      {/* Media Image Area */}
      <div className="card-media">
        <img 
          src={product.primary_image || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'} 
          alt={product.name}
          className="card-img"
          loading="lazy"
        />

        {/* Badges on Top Left */}
        <div className="card-badges-top">
          {product.discount_percent > 0 && (
            <span className="badge-discount">{product.discount_percent}% OFF</span>
          )}
          <span className="badge-eco" title="Certified Green Cracker under CSIR-NEERI norms">
            <Leaf size={12} /> Green Cracker
          </span>
          {product.is_featured === 1 && (
            <span className="badge-featured">
              <Star size={12} fill="#000" /> Bestseller
            </span>
          )}
        </div>

        {/* Actions on Top Right */}
        <div className="card-quick-actions">
          <button 
            className={`card-icon-btn ${isWishlisted ? 'active' : ''}`}
            onClick={toggleWishlist}
            aria-label="Add to Wishlist"
          >
            <Heart size={16} fill={isWishlisted ? '#dc2626' : 'none'} />
          </button>
          <button 
            className="card-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            aria-label="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="card-content">
        {/* Category & Sound Level */}
        <div className="card-category-row">
          <span className="card-category-name">{product.category_name}</span>
          <span className={`card-sound-pill ${product.sound_level?.toLowerCase().replace(' ', '-')}`}>
            <Volume2 size={12} /> {product.sound_level || 'Medium'} Sound
          </span>
        </div>

        {/* Product Title */}
        <h3 className="card-title" title={product.name}>
          {product.name}
        </h3>

        {/* Short Description */}
        <p className="card-desc">
          {product.short_desc}
        </p>

        {/* Key Specs Pills */}
        <div className="card-spec-tags">
          <span className="spec-tag" title="Pieces inside">
            <Package size={12} style={{ display: 'inline', marginRight: 4 }} />
            {product.piece_count} {product.piece_count === 1 ? 'pc' : 'pcs'}/{product.unit}
          </span>
          <span className="spec-tag" title="Burn duration">
            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
            {product.duration}
          </span>
        </div>

        {/* Pricing */}
        <div className="card-price-row">
          <span className="card-current-price">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="card-mrp-price">₹{product.mrp}</span>
          )}
          {product.mrp > product.price && (
            <span className="card-save-pill">Save ₹{product.mrp - product.price}</span>
          )}
        </div>

        {/* Stock status indicator */}
        <div className="card-stock-status">
          {isOutOfStock ? (
            <span className="out-of-stock">
              <span className="stock-dot" /> Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="low-stock">
              <span className="stock-dot" /> Only {product.stock} left!
            </span>
          ) : (
            <span className="in-stock">
              <span className="stock-dot" /> In Stock ({product.stock} units)
            </span>
          )}
        </div>

        {/* Bottom Actions: Stepper + Add to Cart */}
        <div className="card-actions-bottom">
          {!isOutOfStock && (
            <div className="qty-stepper" onClick={(e) => e.stopPropagation()}>
              <button 
                className="stepper-btn" 
                onClick={decrement}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="stepper-value">{qty}</span>
              <button 
                className="stepper-btn" 
                onClick={increment}
                disabled={qty >= product.stock}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          <button
            className={`btn-add-cart ${isAdded ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isAdded ? (
              <>
                <Check size={16} /> Added
              </>
            ) : isOutOfStock ? (
              'Sold Out'
            ) : (
              <>
                <ShoppingCart size={16} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
