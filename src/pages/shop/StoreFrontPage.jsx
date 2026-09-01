import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, Input, Spin, Empty, Tag, Skeleton, message } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { getShopCategories, getShopProducts } from '../../api/shop.api';
import useCartStore from '../../store/cartStore';
import StoreHeader from '../../components/shop/StoreHeader';
import StoreFooter from '../../components/shop/StoreFooter';
import ProductDetailModal from '../../components/shop/ProductDetailModal';
import { FREE_DELIVERY_THRESHOLD } from '../../config/shop';
import { getUnitConfig, effectiveMin, fmtQty } from '../../config/units';

const API_URL = import.meta.env.VITE_API_URL || '';

const categoryEmoji = {
  vegetables: '🥦', fruits: '🍎', grains: '🌾', dairy: '🥛',
  pulses: '🫘', spices: '🌶️', herbs: '🌿', organic: '🌱',
  default: '🥬',
};

const getCategoryEmoji = (cat) => {
  if (!cat) return categoryEmoji.default;
  const key = cat.toLowerCase();
  return Object.entries(categoryEmoji).find(([k]) => key.includes(k))?.[1] || categoryEmoji.default;
};

const getImageSrc = (images, category) => {
  if (images && images.length > 0) {
    const img = images[0];
    if (img.startsWith('http')) return img;
    if (img.startsWith('/')) return `${API_URL}${img}`;
    return `${API_URL}/uploads/${img}`;
  }
  return null;
};

const ProductCard = ({ product, onOpen }) => {
  const { items, addToCart, updateQuantity, removeFromCart } = useCartStore();

  const packs = Array.isArray(product.packs) ? product.packs : [];
  const hasPacks = packs.length > 0;
  const [selectedPack, setSelectedPack] = useState(hasPacks ? packs[0] : null);

  // For pack products the active line is keyed by the selected pack; otherwise
  // by the product uuid.
  const lineId = hasPacks ? `${product.uuid}::${selectedPack.id}` : product.uuid;
  const cartItem = items.find(i => i.productId === lineId);
  const qty = cartItem?.quantity || 0;

  const cfg = getUnitConfig(product.unit);
  const step = hasPacks ? 1 : cfg.step;
  const minOrder = hasPacks ? 1 : effectiveMin(product.unit, product.minimum_order_qty);

  const isLowStock = product.available_quantity > 0 && product.available_quantity < 5;
  const isOutOfStock = product.available_quantity === 0 || product.status === 'out_of_stock';
  const imgSrc = getImageSrc(product.images, product.category);

  const displayPrice = hasPacks ? Number(selectedPack.price) : parseFloat(product.price_per_unit);
  const displayUnit = hasPacks ? selectedPack.label : product.unit;

  const handleAdd = (e) => {
    e?.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, selectedPack);
  };

  const handleIncrease = (e) => {
    e?.stopPropagation();
    if (!hasPacks && qty + step > product.available_quantity) {
      message.warning('Maximum stock reached');
      return;
    }
    updateQuantity(lineId, qty + step);
  };

  const handleDecrease = (e) => {
    e?.stopPropagation();
    if (qty - step < minOrder) removeFromCart(lineId);
    else updateQuantity(lineId, qty - step);
  };

  const pickPack = (e, pack) => { e?.stopPropagation(); setSelectedPack(pack); };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      cursor: 'pointer',
      border: '1px solid #f0f0f0',
    }}
      onClick={() => onOpen(product)}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(22,163,74,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#f8fdf5' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div style={{
          width: '100%', height: '100%',
          display: imgSrc ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 52, background: '#f0faf4'
        }}>
          {getCategoryEmoji(product.category)}
        </div>
        {/* Category badge */}
        {product.category && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(22,163,74,0.9)', color: '#fff',
            borderRadius: 20, padding: '2px 10px',
            fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)',
            textTransform: 'capitalize'
          }}>
            {product.category}
          </div>
        )}
        {product.is_organic && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(34,197,94,0.9)', color: '#fff',
            borderRadius: 20, padding: '2px 8px',
            fontSize: 10, fontWeight: 700, backdropFilter: 'blur(4px)'
          }}>
            🌱 Organic
          </div>
        )}
        {isOutOfStock && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em'
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', lineHeight: 1.3, marginBottom: 4 }}>
          {product.name}
        </div>

        {Array.isArray(product.tags) && product.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {product.tags.map(t => (
              <span key={t} style={{
                background: '#f0faf4', color: '#16a34a', border: '1px solid #bbf7d0',
                borderRadius: 999, padding: '1px 8px', fontSize: 10, fontWeight: 700,
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
            ₹{displayPrice.toFixed(2)}
          </span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>/{displayUnit}</span>
        </div>

        {/* Pack size selector for weight-based products */}
        {hasPacks && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {packs.map(p => {
              const active = selectedPack.id === p.id;
              return (
                <span
                  key={p.id}
                  onClick={(e) => pickPack(e, p)}
                  style={{
                    cursor: 'pointer', userSelect: 'none',
                    padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                    border: `1.5px solid ${active ? '#16a34a' : '#e5e7eb'}`,
                    background: active ? '#16a34a' : '#fff',
                    color: active ? '#fff' : '#374151',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </span>
              );
            })}
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>
            ⚠ Only {product.available_quantity} left!
          </div>
        )}

        {!hasPacks && minOrder > 1 && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
            Min. order: {fmtQty(minOrder, product.unit)} {product.unit}
          </div>
        )}

        {/* Add to cart / stepper */}
        {!isOutOfStock && (
          qty > 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f0faf4', borderRadius: 10, padding: '4px 8px', border: '1.5px solid #16a34a'
            }}>
              <button
                onClick={handleDecrease}
                style={{
                  background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7,
                  width: 28, height: 28, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >−</button>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#16a34a', minWidth: 24, textAlign: 'center' }}>{fmtQty(qty, displayUnit)}</span>
              <button
                onClick={handleIncrease}
                style={{
                  background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7,
                  width: 28, height: 28, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >+</button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              style={{
                width: '100%', padding: '8px 0',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              + Add
            </button>
          )
        )}
      </div>
    </div>
  );
};

const ProductSkeleton = () => (
  <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
    <Skeleton.Image active style={{ width: '100%', height: 180, borderRadius: 0 }} />
    <div style={{ padding: 14 }}>
      <Skeleton active paragraph={{ rows: 2 }} />
    </div>
  </div>
);

const StoreFrontPage = () => {
  const navigate = useNavigate();
  const { items, getTotal, getItemCount } = useCartStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeProduct, setActiveProduct] = useState(null);
  const itemCount = getItemCount();
  const total = getTotal();

  const { data: categoriesData, isLoading: catLoading } = useQuery({
    queryKey: ['shop-categories'],
    queryFn: getShopCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: productsData, isLoading: prodLoading } = useQuery({
    queryKey: ['shop-products', selectedCategory, search],
    queryFn: () => getShopProducts({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: search || undefined,
      limit: 50,
    }),
    staleTime: 60 * 1000,
  });

  const categories = categoriesData?.data || [];
  const products = productsData?.data?.products || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fdf5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Sticky Header (shared: logo, login/profile, cart) */}
      <StoreHeader />

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2318 0%, #16a34a 50%, #1a3d28 100%)',
        padding: 'clamp(28px, 7vw, 48px) 16px clamp(24px, 6vw, 40px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(34,197,94,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(22,163,74,0.2) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 'clamp(28px, 8vw, 40px)', marginBottom: 8 }}>🥬🍅🥕</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2 }}>
            Fresh from Farm to Your Door
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(12px, 3.4vw, 14px)', margin: '0 0 24px', padding: '0 8px' }}>
            🚚 FREE delivery on orders above ₹{FREE_DELIVERY_THRESHOLD} · Cash on Delivery
          </p>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <Input
              size="large"
              placeholder="Search for vegetables, fruits, grains..."
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
              style={{
                borderRadius: 14, border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                fontSize: 15, height: 50,
              }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        overflowX: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 56,
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {[{ slug: 'all', label: 'All Products' }, ...(categories.map(c => typeof c === 'string' ? { slug: c, label: c } : c))].map(cat => {
          const catValue = cat.slug || cat.name || cat;
          const catLabel = cat.label || cat.name || cat;
          const isSelected = selectedCategory === catValue;
          return (
            <button
              key={catValue}
              onClick={() => setSelectedCategory(catValue)}
              style={{
                flexShrink: 0,
                padding: '6px 18px',
                borderRadius: 999,
                border: isSelected ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
                background: isSelected ? '#16a34a' : '#fff',
                color: isSelected ? '#fff' : '#374151',
                fontWeight: isSelected ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {catValue !== 'all' && getCategoryEmoji(catValue) + ' '}
              {catLabel}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 100px' }}>
        {prodLoading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 16,
          }}>
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: '#6b7280', fontSize: 15 }}>
                  {search ? `No products found for "${search}"` : 'No products available'}
                </span>
              }
            />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 16,
          }}>
            {products.map(p => <ProductCard key={p.uuid} product={p} onOpen={setActiveProduct} />)}
          </div>
        )}
      </div>

      <StoreFooter />

      {/* Sticky bottom bar (mobile) */}
      {itemCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(135deg, #0f2318, #16a34a)',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
          zIndex: 50,
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{itemCount} item{itemCount > 1 ? 's' : ''} in cart</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>₹{total.toFixed(2)}</div>
          </div>
          <button
            onClick={() => navigate('/store/cart')}
            style={{
              background: '#fff', color: '#16a34a',
              border: 'none', borderRadius: 12, padding: '12px 28px',
              fontWeight: 800, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            View Cart →
          </button>
        </div>
      )}

      <ProductDetailModal
        product={activeProduct}
        open={!!activeProduct}
        onClose={() => setActiveProduct(null)}
      />
    </div>
  );
};

export default StoreFrontPage;
