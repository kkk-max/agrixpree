'use strict';

// Run: NODE_ENV=production node scripts/update-product-images.js
// Updates product_images with stable Wikimedia Commons vegetable photos.

require('dotenv').config({ path: __dirname + '/../.env' });
const { Sequelize } = require('sequelize');
const dbConfig = require('../src/config/database')[process.env.NODE_ENV || 'development'];

const IMAGES = {
  'potato-prod':             'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/800px-Patates.jpg',
  'onion-prod':              'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Yellow_onion.jpg/800px-Yellow_onion.jpg',
  'tomato-prod':             'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/800px-Tomato_je.jpg',
  'ringan-brinjal-prod':     'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Solanum_melongena_-_Brinjal.jpg/800px-Solanum_melongena_-_Brinjal.jpg',
  'spinach-palak-prod':      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Espinacas_frescas.jpg/800px-Espinacas_frescas.jpg',
  'gajar-carrot-prod':       'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Vegetable-Carrot-Bundle-wStalks.jpg/800px-Vegetable-Carrot-Bundle-wStalks.jpg',
  'beetroot-prod':           'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Beets_organic.jpg/800px-Beets_organic.jpg',
  'kakdi-cucumber-prod':     'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/800px-A_small_cup_of_coffee.JPG',
  'coriander-prod':          'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Coriander.jpg/800px-Coriander.jpg',
  'bhinda-okra-prod':        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Okra_with_cross_section.jpg/800px-Okra_with_cross_section.jpg',
  'green-chilli-prod':       'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Green_chilli_peppers.jpg/800px-Green_chilli_peppers.jpg',
  'giloda-prod':             'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ivy_gourd_on_tree.jpg/800px-Ivy_gourd_on_tree.jpg',
  'parvar-prod':             'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Trichosanthes_dioica_fruits.jpg/800px-Trichosanthes_dioica_fruits.jpg',
  'methi-prod':              'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Fenugreek_Leaves.jpg/800px-Fenugreek_Leaves.jpg',
  'chori-prod':              'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Cowpea_Vigna_unguiculata.jpg/800px-Cowpea_Vigna_unguiculata.jpg',
  'green-capsicum-prod':     'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Green_capsicum.jpg/800px-Green_capsicum.jpg',
  'garlic-prod':             'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Garlic_on_white_background.jpg/800px-Garlic_on_white_background.jpg',
  'tuvar-prod':              'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Cajanus_cajan_-_pigeon_pea.jpg/800px-Cajanus_cajan_-_pigeon_pea.jpg',
  'dudhi-bottle-gourd-prod': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Lagenaria_siceraria.jpg/800px-Lagenaria_siceraria.jpg',
  'gulka-prod':              'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Luffa_acutangula_-_ridge_gourd.jpg/800px-Luffa_acutangula_-_ridge_gourd.jpg',
  'papdi-prod':              'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Lablab_purpureus_-_flat_beans.jpg/800px-Lablab_purpureus_-_flat_beans.jpg',
  'drumstick-prod':          'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Moringa_oleifera_-_drumstick.jpg/800px-Moringa_oleifera_-_drumstick.jpg',
  'broccoli-prod':           'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Broccoli_and_cross_section_edit.jpg/800px-Broccoli_and_cross_section_edit.jpg',
  'vatana-green-peas-prod':  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Peas_in_pods_-_Studio.jpg/800px-Peas_in_pods_-_Studio.jpg',
  'avocado-prod':            'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Avocado_Whole_and_Sliced_edit.jpg/800px-Avocado_Whole_and_Sliced_edit.jpg',
  'lettuce-prod':            'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Iceberg_lettuce_in_SB.jpg/800px-Iceberg_lettuce_in_SB.jpg',
  'cabbage-prod':            'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Cabbage_and_cross_section_on_white.jpg/800px-Cabbage_and_cross_section_on_white.jpg',
  'karela-prod':             'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Bitter_melon.jpg/800px-Bitter_melon.jpg',
  'kakoda-prod':             'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Momordica_dioica_-_spine_gourd.jpg/800px-Momordica_dioica_-_spine_gourd.jpg',
};

async function main() {
  const seq = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false,
  });

  const [products] = await seq.query(`SELECT id, slug FROM products WHERE slug LIKE '%-prod'`);
  if (!products.length) { console.log('No products found.'); process.exit(0); }

  let updated = 0;
  for (const p of products) {
    const url = IMAGES[p.slug];
    if (!url) { console.log(`  SKIP ${p.slug} — no image mapped`); continue; }

    await seq.query(
      `UPDATE product_images SET image_url = :url, thumbnail_url = :url WHERE product_id = :id`,
      { replacements: { url, id: p.id } }
    );
    console.log(`  OK  ${p.slug}`);
    updated++;
  }

  console.log(`\nDone — updated ${updated} products.`);
  await seq.close();
}

main().catch(e => { console.error(e); process.exit(1); });
