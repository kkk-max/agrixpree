// In-memory SSE registry. Two indexes:
//   byOrder: uuid  → Set<res>   (guest & logged-in watching a single order)
//   byUser:  userId → Set<res>  (logged-in user's account page)
const byOrder = new Map();
const byUser  = new Map();

const _add = (map, key, res) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(res);
};

const _remove = (map, key, res) => {
  const set = map.get(key);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) map.delete(key);
};

const subscribe = (orderUuid, userId, res) => {
  _add(byOrder, orderUuid, res);
  if (userId) _add(byUser, userId, res);
};

const unsubscribe = (orderUuid, userId, res) => {
  _remove(byOrder, orderUuid, res);
  if (userId) _remove(byUser, userId, res);
};

const emit = (orderUuid, userId, payload) => {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  const seen = new Set();

  const send = (res) => {
    if (seen.has(res)) return;
    seen.add(res);
    try { res.write(data); } catch (_) { /* client disconnected */ }
  };

  (byOrder.get(orderUuid) || []).forEach(send);
  if (userId) (byUser.get(String(userId)) || []).forEach(send);
};

module.exports = { subscribe, unsubscribe, emit };
