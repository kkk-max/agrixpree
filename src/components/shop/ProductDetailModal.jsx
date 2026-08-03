import { useState, useEffect, useRef } from 'react';
import { Modal, message } from 'antd';
import useCartStore from '../../store/cartStore';
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

const resolveImg = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${API_URL}/uploads/${img}`;
};

// Auto-scrolling carousel — auto-advances until the user manually interacts (swipe/arrow/dot).
const ImageCarousel = ({ images, category }) => {
  const srcs = (images || []).map(resolveImg).filter(Boolean);
  const count = srcs.length;
  const [current, setCurrent] = useState(0);
  const [auto, setAuto] = useState(true);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!auto || count <= 1) return undefined;
    const id = setInterval(() => setCurrent(c => (c + 1) % count), 2500);
    return () => clearInterval(id);
  }, [auto, count]);

  const stop = () => setAuto(false);
  const go = (i) => { stop(); setCurrent((i % count + count) % count); };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  if (count === 0) {
    return (
      <div style={{
        aspectRatio: '1/1', width: '100%', borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 88, background: '#f0faf4',
      }}>
        {getCategoryEmoji(category)}
      </div>
    );
  }

  const arrowStyle = (side) => ({
    position: 'absolute', top: '50%', [side]: 8, transform: 'translateY(-50%)',
    width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 18, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
  });

  return (
    <div
      style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', background: '#f8fdf5' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div style={{
        display: 'flex', height: '100%',
        transform: `translateX(-${current * 100}%)`,
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {srcs.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', flexShrink: 0, objectFit: 'cover' }}
          />
        ))}
      </div>

      {count > 1 && (
        <>
          <button style={arrowStyle('left')} onClick={() => go(current - 1)}>‹</button>
          <button style={arrowStyle('right')} onClick={() => go(current + 1)}>›</button>
          <div style={{
            position: 'absolute', bottom: 10, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 6, zIndex: 2,
          }}>
            {srcs.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                style={{
                  width: i === current ? 20 : 8, height: 8, borderRadius: 4, border: 'none',
                  cursor: 'pointer', padding: 0,
                  background: i === current ? '#16a34a' : 'rgba(255,255,255,0.75)',
                  transition: 'all 0.25s',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
    <span style={{ color: '#6b7280' }}>{label}</span>
    <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right' }}>{value}</span>
  </div>
);

const ProductDetailModal = ({ product, open, onClose }) => {
  const { items, addToCart, updateQuantity, removeFromCart } = useCartStore();

  const packs = Array.isArray(product?.packs) ? product.packs : [];
  const hasPacks = packs.length > 0;
  const [selectedPack, setSelectedPack] = useState(null);
  useEffect(() => { setSelectedPack(hasPacks ? packs[0] : null); }, [product?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) return null;

  const activePack = hasPacks ? (selectedPack || packs[0]) : null;
  const lineId = activePack ? `${product.uuid}::${activePack.id}` : product.uuid;
  const cartItem = items.find(i => i.productId === lineId);
  const qty = cartItem?.quantity || 0;

  const cfg = getUnitConfig(product.unit);
  const step = hasPacks ? 1 : cfg.step;
  const minOrder = hasPacks ? 1 : effectiveMin(product.unit, product.minimum_order_qty);
  const displayPrice = activePack ? Number(activePack.price) : parseFloat(product.price_per_unit);
  const displayUnit = activePack ? activePack.label : product.unit;

  const isLowStock = product.available_quantity > 0 && product.available_quantity < 5;
  const isOutOfStock = product.available_quantity === 0 || product.status === 'out_of_stock';

  const handleIncrease = () => {
    if (!hasPacks && qty + step > product.available_quantity) {
      message.warning('Maximum stock reached');
      return;
    }
    updateQuantity(lineId, qty + step);
  };
  const handleDecrease = () => {
    if (qty - step < minOrder) removeFromCart(lineId);
    else updateQuantity(lineId, qty - step);
  };

  const origin = [product.origin_district, product.origin_state].filter(Boolean).join(', ');

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      styles={{ body: { padding: 0 } }}
      style={{ top: 20 }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20 }}>
        {/* Images */}
        <div style={{ flex: '1 1 280px', minWidth: 260 }}>
          <ImageCarousel images={product.images} category={product.category} />
        </div>

        {/* Info */}
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {product.category && (
              <span style={{ background: '#16a34a', color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                {getCategoryEmoji(product.category)} {product.category}
              </span>
            )}
            {product.is_organic && (
              <span style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                🌱 Organic
              </span>
            )}
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>
            {product.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>
              ₹{displayPrice.toFixed(2)}
            </span>
            <span style={{ fontSize: 14, color: '#6b7280' }}>/{displayUnit}</span>
          </div>

          {/* Pack size selector for weight-based products */}
          {hasPacks && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Choose pack size</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {packs.map(p => {
                  const active = activePack?.id === p.id;
                  return (
                    <span
                      key={p.id}
                      onClick={() => setSelectedPack(p)}
                      style={{
                        cursor: 'pointer', userSelect: 'none',
                        padding: '6px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        border: `1.5px solid ${active ? '#16a34a' : '#e5e7eb'}`,
                        background: active ? '#16a34a' : '#fff',
                        color: active ? '#fff' : '#374151',
                        transition: 'all 0.15s',
                      }}
                    >
                      {p.label} · ₹{Number(p.price).toFixed(0)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {product.tags.map(t => (
                <span key={t} style={{ background: '#f0faf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {product.description && (
            <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, margin: '0 0 14px' }}>
              {product.description}
            </p>
          )}

          <div style={{ marginBottom: 16 }}>
            <DetailRow
              label="Availability"
              value={
                isOutOfStock
                  ? <span style={{ color: '#dc2626' }}>Out of stock</span>
                  : isLowStock
                    ? <span style={{ color: '#dc2626' }}>Only {product.available_quantity} left</span>
                    : <span style={{ color: '#16a34a' }}>In stock</span>
              }
            />
            {!hasPacks && minOrder > 1 && (
              <DetailRow label="Minimum order" value={`${fmtQty(minOrder, product.unit)} ${product.unit}`} />
            )}
            {product.quality_grade && product.quality_grade !== 'ungraded' && (
              <DetailRow label="Quality grade" value={`Grade ${product.quality_grade}`} />
            )}
            {origin && <DetailRow label="Origin" value={origin} />}
            {product.shelf_life_days > 0 && (
              <DetailRow label="Shelf life" value={`${product.shelf_life_days} days`} />
            )}
          </div>

          {/* Add to cart / stepper */}
          {isOutOfStock ? (
            <button disabled style={{
              width: '100%', padding: '12px 0', background: '#e5e7eb', color: '#9ca3af',
              border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'not-allowed',
            }}>
              Out of Stock
            </button>
          ) : qty > 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f0faf4', borderRadius: 12, padding: '6px 12px', border: '1.5px solid #16a34a',
            }}>
              <button onClick={handleDecrease} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>−</button>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#16a34a' }}>{fmtQty(qty, displayUnit)} {displayUnit} in cart</span>
              <button onClick={handleIncrease} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>+</button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product, activePack)}
              style={{
                width: '100%', padding: '12px 0',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff',
                border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer',
              }}
            >
              + Add to Cart
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
