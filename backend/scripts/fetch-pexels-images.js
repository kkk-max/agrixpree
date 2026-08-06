'use strict';

// Run: PEXELS_KEY=your_key NODE_ENV=production node scripts/fetch-pexels-images.js
require('dotenv').config({ path: __dirname + '/../.env' });
const https = require('https');
const mysql = require('mysql2/promise');

const PEXELS_KEY = process.env.PEXELS_KEY;
if (!PEXELS_KEY) { console.error('Set PEXELS_KEY env var'); process.exit(1); }

const SEARCH_TERMS = {
  'potato-prod':             'potato vegetable',
  'onion-prod':              'onion vegetable',
  'tomato-prod':             'fresh tomato',
  'ringan-brinjal-prod':     'brinjal eggplant',
  'spinach-palak-prod':      'fresh spinach',
  'gajar-carrot-prod':       'fresh carrot',
  'beetroot-prod':           'beetroot',
  'kakdi-cucumber-prod':     'fresh cucumber',
  'coriander-prod':          'coriander herb',
  'bhinda-okra-prod':        'okra vegetable',
  'green-chilli-prod':       'green chilli pepper',
  'giloda-prod':             'ivy gourd vegetable',
  'parvar-prod':             'pointed gourd vegetable',
  'methi-prod':              'fenugreek leaves',
  'chori-prod':              'cowpea beans',
  'green-capsicum-prod':     'green capsicum pepper',
  'garlic-prod':             'fresh garlic',
  'tuvar-prod':              'pigeon peas',
  'dudhi-bottle-gourd-prod': 'bottle gourd',
  'gulka-prod':              'ridge gourd',
  'papdi-prod':              'flat beans vegetable',
  'drumstick-prod':          'drumstick moringa',
  'broccoli-prod':           'fresh broccoli',
  'vatana-green-peas-prod':  'green peas',
  'avocado-prod':            'fresh avocado',
  'lettuce-prod':            'fresh lettuce',
  'cabbage-prod':            'fresh cabbage',
  'karela-prod':             'bitter gourd',
  'kakoda-prod':             'spine gourd vegetable',
};

function pexelsSearch(query) {
  return new Promise((resolve, reject) => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    https.get(url, { headers: { Authorization: PEXELS_KEY } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const photo = json.photos?.[0];
          resolve(photo ? { large: photo.src.large, medium: photo.src.medium } : null);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  });

  const [products] = await conn.query("SELECT id, slug FROM products WHERE slug LIKE '%-prod'");
  if (!products.length) { console.log('No products found.'); process.exit(0); }

  let updated = 0;
  for (const p of products) {
    const query = SEARCH_TERMS[p.slug];
    if (!query) { console.log(`SKIP ${p.slug}`); continue; }

    const photo = await pexelsSearch(query);
    if (!photo) { console.log(`NO RESULT ${p.slug}`); continue; }

    await conn.query(
      'UPDATE product_images SET image_url=?, thumbnail_url=? WHERE product_id=?',
      [photo.large, photo.medium, p.id]
    );
    console.log(`OK  ${p.slug}`);
    updated++;

    // Stay within rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone — updated ${updated} products.`);
  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
