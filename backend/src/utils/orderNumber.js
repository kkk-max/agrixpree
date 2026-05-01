const dayjs = require('dayjs');

const pad = (n) => String(n).padStart(4, '0');

const generateOrderNumber = async (count) => {
  const date = dayjs().format('YYYYMMDD');
  return `AGX-${date}-${pad((count || 0) + 1)}`;
};

const generatePONumber = async (count) => {
  const date = dayjs().format('YYYYMMDD');
  return `PO-${date}-${pad((count || 0) + 1)}`;
};

module.exports = { generateOrderNumber, generatePONumber };
