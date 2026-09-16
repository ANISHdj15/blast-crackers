import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Disc, 
  Rocket, 
  Waves, 
  Volume2, 
  Gift, 
  Smile, 
  Layers, 
  Zap, 
  SlidersHorizontal, 
  Check, 
  ArrowUpDown, 
  RefreshCw, 
  TrendingUp, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';
import { ProductCard } from './ProductCard';

// Icon map for database-driven categories
const CATEGORY_ICONS = {
  Sparkles: <Sparkles size={16} />,
  Flame: <Flame size={16} />,
  Disc: <Disc size={16} />,
  Rocket: <Rocket size={16} />,
  Waves: <Waves size={16} />,
  Volume2: <Volume2 size={16} />,
  Gift: <Gift size={16} />,
  Smile: <Smile size={16} />,
  Layers: <Layers size={16} />,
  Zap: <Zap size={16} />
};

export const StoreView = ({ 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory, 
  onSelectProduct 
}) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [sortOption, setSortOption] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(4000);
  const [soundFilter, setSoundFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [quickFilter, setQuickFilter] = useState(''); // 'offers', 'featured', 'latest'

  // Fetch Categories from Backend
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories || []);
        }
      })
      .catch(err => console.error('Fetch categories error:', err));
  }, []);

  // Fetch Filtered Products from Backend
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();

    if (selectedCategory) {
      params.append('category', selectedCategory);
    }
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (maxPrice < 4000) {
      params.append('max_price', maxPrice);
    }
    if (soundFilter) {
      params.append('sound_level', soundFilter);
    }
    if (inStockOnly) {
      params.append('in_stock', '1');
    }
    if (quickFilter === 'offers') {
      params.append('is_offer', '1');
    } else if (quickFilter === 'featured') {
      params.append('is_featured', '1');
    } else if (quickFilter === 'latest') {
      params.append('is_latest', '1');
    }

    if (sortOption) {
      params.append('sort', sortOption);
    }

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products || []);
        }
      })
      .catch(err => console.error('Fetch products error:', err))
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery, maxPrice, soundFilter, inStockOnly, quickFilter, sortOption]);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFilterCount = (selectedCategory ? 1 : 0) + 
    (maxPrice < 4000 ? 1 : 0) + 
    (soundFilter ? 1 : 0) + 
    (inStockOnly ? 1 : 0) + 
    (quickFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setMaxPrice(4000);
    setSoundFilter('');
    setInStockOnly(false);
    setQuickFilter('');
    setSortOption('featured');
    setIsMobileFilterOpen(false);
  };

  const totalCatalogCount = categories.reduce((sum, c) => sum + (c.product_count || 0), 0);

  return (
    <section className="store-wrapper" id="store-catalog">
      {/* Compact Festive Store Banner - Products immediately visible underneath! */}
      <div className="store-intro-ribbon">
        <div className="ribbon-content">
          <h1>
            <Flame size={24} color="#f59e0b" /> Sivakasi Wholesale Fireworks Store
          </h1>
          <p>
            Direct factory prices • CSIR-NEERI Green Crackers • Safe moisture-proof packaging • Pan-India door dispatch
          </p>
        </div>
        <div className="ribbon-badges">
          <div className="ribbon-pill">
            <Truck size={14} color="#f59e0b" /> Free shipping on ₹1,999+
          </div>
          <div className="ribbon-pill">
            <ShieldCheck size={14} color="#10b981" /> 100% Genuine Sivakasi
          </div>
        </div>
      </div>

      {/* Database-driven Categories Bar */}
      <div className="category-bar-section">
        <div className="category-scroll-container">
          <button
            className={`category-chip ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            <Sparkles size={16} />
            <span>All Fireworks</span>
            <span className="category-chip-count">{totalCatalogCount || products.length}</span>
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-chip ${selectedCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
            >
              {CATEGORY_ICONS[cat.icon] || <Flame size={16} />}
              <span>{cat.name}</span>
              <span className="category-chip-count">{cat.product_count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Filter Tags Ribbon (Desktop & Tablet) */}
      <div className="quick-tags-bar desktop-only">
        <button
          className={`quick-tag-btn ${quickFilter === 'offers' ? 'active' : ''}`}
          onClick={() => setQuickFilter(q => q === 'offers' ? '' : 'offers')}
        >
          <Zap size={14} color="#dc2626" /> Flash Deals & Offers (50%+ OFF)
        </button>
        <button
          className={`quick-tag-btn ${quickFilter === 'featured' ? 'active' : ''}`}
          onClick={() => setQuickFilter(q => q === 'featured' ? '' : 'featured')}
        >
          <TrendingUp size={14} color="#047857" /> Bestselling Crackers
        </button>
        <button
          className={`quick-tag-btn ${quickFilter === 'latest' ? 'active' : ''}`}
          onClick={() => setQuickFilter(q => q === 'latest' ? '' : 'latest')}
        >
          <Sparkles size={14} color="#d97706" /> New 2026 Arrivals
        </button>

        {(selectedCategory || searchQuery || maxPrice < 4000 || soundFilter || inStockOnly || quickFilter) && (
          <button 
            className="quick-tag-btn" 
            onClick={handleResetFilters}
            style={{ color: '#dc2626', borderColor: '#fca5a5', marginLeft: 'auto' }}
          >
            <RefreshCw size={13} /> Reset Filters
          </button>
        )}
      </div>

      {/* Desktop Detailed Store Controls Bar */}
      <div className="store-controls-bar desktop-only">
        <div className="controls-left">
          {/* Sorting */}
          <div className="filter-group">
            <ArrowUpDown size={16} />
            <select
              className="filter-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sort products by"
            >
              <option value="featured">Featured & Best Deals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Highest Discount %</option>
              <option value="newest">Latest 2026 Fireworks</option>
            </select>
          </div>

          {/* Sound Level Filter */}
          <div className="filter-group">
            <Volume2 size={16} />
            <select
              className="filter-select"
              value={soundFilter}
              onChange={(e) => setSoundFilter(e.target.value)}
              aria-label="Filter by sound decibel"
            >
              <option value="">All Sound Levels</option>
              <option value="None">None (Visual Only)</option>
              <option value="Low">Low (Child Safe)</option>
              <option value="Medium">Medium (Balanced)</option>
              <option value="High">High (Festive Thuds)</option>
              <option value="Very High">Very High (Grand Ladis)</option>
            </select>
          </div>

          {/* Price Range Slider */}
          <div className="filter-group" style={{ minWidth: 160 }}>
            <span>Max Price: ₹{maxPrice}</span>
            <input
              type="range"
              min="100"
              max="4000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ accentColor: '#064e3b', width: 90, cursor: 'pointer' }}
            />
          </div>

          {/* In-Stock Toggle */}
          <label className="filter-toggle-label">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <span>In Stock Only</span>
          </label>
        </div>

        <div className="controls-right">
          <span className="product-count-label">
            Showing <strong>{products.length}</strong> festive items
          </span>
        </div>
      </div>

      {/* Mobile Streamlined Controls Bar (Visible on <= 768px) */}
      <div className="store-controls-mobile-bar">
        <button 
          className={`mobile-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
          onClick={() => setIsMobileFilterOpen(true)}
          aria-label="Open filter options"
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-count-badge">{activeFilterCount}</span>
          )}
        </button>

        <div className="mobile-sort-wrap">
          <ArrowUpDown size={15} color="#64748b" />
          <select
            className="filter-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            aria-label="Sort products"
          >
            <option value="featured">Featured Deals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="discount">Highest Discount %</option>
            <option value="newest">New 2026 Fireworks</option>
          </select>
        </div>

        <span className="mobile-items-count">
          {products.length} items
        </span>
      </div>

      {/* Mobile Filter Bottom Sheet Dialog */}
      {isMobileFilterOpen && (
        <>
          <div 
            className="mobile-filter-backdrop"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-label="Filter products">
            <div className="mobile-filter-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={18} color="#064e3b" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Filter Fireworks</h3>
              </div>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="modal-close-btn"
                style={{ position: 'static' }}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            <div className="mobile-filter-body">
              {/* Quick Tags in Filter Sheet */}
              <div>
                <label className="form-label">Special Festive Collections</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className={`quick-tag-btn ${quickFilter === 'offers' ? 'active' : ''}`}
                    onClick={() => setQuickFilter(q => q === 'offers' ? '' : 'offers')}
                  >
                    <Zap size={14} color="#dc2626" /> Flash Deals
                  </button>
                  <button
                    className={`quick-tag-btn ${quickFilter === 'featured' ? 'active' : ''}`}
                    onClick={() => setQuickFilter(q => q === 'featured' ? '' : 'featured')}
                  >
                    <TrendingUp size={14} color="#047857" /> Bestsellers
                  </button>
                  <button
                    className={`quick-tag-btn ${quickFilter === 'latest' ? 'active' : ''}`}
                    onClick={() => setQuickFilter(q => q === 'latest' ? '' : 'latest')}
                  >
                    <Sparkles size={14} color="#d97706" /> 2026 Arrivals
                  </button>
                </div>
              </div>

              {/* Price Range Slider */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Maximum Price</span>
                  <strong style={{ color: '#064e3b', fontSize: '1rem' }}>₹{maxPrice}</strong>
                </div>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#064e3b', height: 6 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                  <span>₹100</span>
                  <span>₹4,000+</span>
                </div>
              </div>

              {/* Sound Decibel Level */}
              <div>
                <label className="form-label">Sound Level (PESO Decibel Limit)</label>
                <select
                  className="form-input"
                  value={soundFilter}
                  onChange={(e) => setSoundFilter(e.target.value)}
                >
                  <option value="">All Sound Levels</option>
                  <option value="None">None (Visual Spectacles)</option>
                  <option value="Low">Low (Child Safe & Sparklers)</option>
                  <option value="Medium">Medium (Balanced Crackers)</option>
                  <option value="High">High (Festive Thuds)</option>
                  <option value="Very High">Very High (Grand Ladis)</option>
                </select>
              </div>

              {/* In Stock Only Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                background: inStockOnly ? '#ecfdf5' : '#f8fafc',
                border: inStockOnly ? '1.5px solid #047857' : '1px solid #e2e8f0',
                borderRadius: 10,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#047857' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>In Stock Only</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Hide fireworks currently out of stock</div>
                </div>
              </label>
            </div>

            <div className="mobile-filter-footer">
              <button
                className="quick-tag-btn"
                onClick={handleResetFilters}
                style={{ flex: 1, height: 46, justifyContent: 'center' }}
              >
                Reset All
              </button>
              <button
                className="btn-proceed-checkout"
                onClick={() => setIsMobileFilterOpen(false)}
                style={{ flex: 2, height: 46 }}
              >
                Apply Filters ({products.length})
              </button>
            </div>
          </div>
        </>
      )}

      {/* Product Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #e2e8f0',
            borderTopColor: '#047857',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Sivakasi crackers catalog...</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : products.length > 0 ? (
        <div className="products-grid">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      ) : (
        <div className="store-empty-state">
          <Sparkles size={48} />
          <h3>No fireworks found matching your criteria</h3>
          <p>Try clearing some filters or searching with different keywords.</p>
          <button 
            className="btn-add-cart" 
            onClick={handleResetFilters}
            style={{ maxWidth: 220, margin: '0 auto' }}
          >
            Show All Fireworks
          </button>
        </div>
      )}
    </section>
  );
};
