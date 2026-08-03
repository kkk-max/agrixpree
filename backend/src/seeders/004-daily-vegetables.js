'use strict';
const { v5: uuidv5 } = require('uuid');

const SEED_NAMESPACE = '9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d';
const stableUuid = (slug) => uuidv5(slug, SEED_NAMESPACE);

// cat 2 = Vegetables, cat 1 = Fruits (avocado)
const PRODUCTS = [
  { cat: 2, name: 'Potato',           unit: 'kg',    price: 25,  qty: 100, organic: false, desc: 'Fresh farm potatoes.'                          },
  { cat: 2, name: 'Onion',            unit: 'kg',    price: 35,  qty: 100, organic: false, desc: 'Fresh red onions.'                             },
  { cat: 2, name: 'Tomato',           unit: 'kg',    price: 50,  qty: 100, organic: false, desc: 'Vine-ripened tomatoes.'                        },
  { cat: 2, name: 'Ringan (Brinjal)', unit: 'kg',    price: 50,  qty: 100, organic: false, desc: 'Fresh brinjal (eggplant).'                     },
  { cat: 2, name: 'Spinach (Palak)',  unit: 'kg',    price: 0,   qty: 0,   organic: false, desc: 'Fresh spinach — not available today.',
    status: 'out_of_stock' },
  { cat: 2, name: 'Gajar (Carrot)',   unit: 'kg',    price: 70,  qty: 100, organic: false, desc: 'Fresh crunchy carrots.'                        },
  { cat: 2, name: 'Beetroot',         unit: 'kg',    price: 70,  qty: 100, organic: false, desc: 'Fresh beetroot.'                               },
  { cat: 2, name: 'Kakdi (Cucumber)', unit: 'kg',    price: 70,  qty: 100, organic: false, desc: 'Crisp fresh cucumbers.'                        },
  { cat: 2, name: 'Coriander',        unit: 'kg',    price: 100, qty: 50,  organic: false, desc: 'Fresh coriander leaves.'                       },
  { cat: 2, name: 'Bhinda (Okra)',    unit: 'kg',    price: 70,  qty: 100, organic: false, desc: 'Tender fresh okra.'                            },
  { cat: 2, name: 'Green Chilli',     unit: 'kg',    price: 80,  qty: 50,  organic: false, desc: 'Spicy fresh green chillies.'                   },
  { cat: 2, name: 'Giloda',           unit: 'kg',    price: 70,  qty: 100, organic: false, desc: 'Fresh giloda (tindora / ivy gourd).'           },
  { cat: 2, name: 'Parvar',           unit: 'kg',    price: 80,  qty: 100, organic: false, desc: 'Fresh parvar (pointed gourd).'                 },
  { cat: 2, name: 'Methi',            unit: 'kg',    price: 100, qty: 50,  organic: false, desc: 'Fresh fenugreek leaves.'                       },
  { cat: 2, name: 'Chori',            unit: 'kg',    price: 120, qty: 100, organic: false, desc: 'Fresh chori (cow peas / black-eyed beans).'    },
  { cat: 2, name: 'Green Capsicum',   unit: 'kg',    price: 120, qty: 100, organic: false, desc: 'Crunchy green capsicum.'                       },
  { cat: 2, name: 'Garlic',           unit: 'kg',    price: 200, qty: 50,  organic: false, desc: 'Fresh garlic bulbs.'                           },
  { cat: 2, name: 'Tuvar',            unit: 'kg',    price: 160, qty: 100, organic: false, desc: 'Fresh tuvar (pigeon peas).'                    },
  { cat: 2, name: 'Dudhi (Bottle Gourd)', unit: 'kg', price: 50, qty: 100, organic: false, desc: 'Fresh bottle gourd.'                          },
  { cat: 2, name: 'Gulka',            unit: 'kg',    price: 50,  qty: 100, organic: false, desc: 'Fresh gulka (ridge gourd).'                    },
  { cat: 2, name: 'Papdi',            unit: 'kg',    price: 150, qty: 100, organic: false, desc: 'Fresh papdi (flat beans).'                     },
  { cat: 2, name: 'Drumstick',        unit: 'kg',    price: 80,  qty: 100, organic: false, desc: 'Fresh drumsticks (moringa pods).'              },
  // Premium
  { cat: 2, name: 'Broccoli',         unit: 'kg',    price: 350, qty: 50,  organic: false, desc: 'Premium fresh broccoli.'                       },
  { cat: 2, name: 'Vatana (Green Peas)', unit: 'kg', price: 160, qty: 100, organic: false, desc: 'Fresh green peas.'                             },
  { cat: 1, name: 'Avocado',          unit: 'piece', price: 100, qty: 50,  organic: false, desc: 'Premium ripe avocados.'                        },
  { cat: 2, name: 'Lettuce',          unit: 'kg',    price: 300, qty: 30,  organic: false, desc: 'Fresh crisp lettuce.'                          },
  { cat: 2, name: 'Cabbage',          unit: 'kg',    price: 50,  qty: 100, organic: false, desc: 'Fresh cabbage.'                                },
  { cat: 2, name: 'Karela',           unit: 'kg',    price: 80,  qty: 100, organic: false, desc: 'Fresh bitter gourd (karela).'                  },
  { cat: 2, name: 'Kakoda',           unit: 'kg',    price: 200, qty: 50,  organic: false, desc: 'Fresh kakoda (spine gourd).'                   },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = PRODUCTS.map((p) => {
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-prod';
      return {
        uuid: stableUuid(slug),
        user_id: 1,
        category_id: p.cat,
        name: p.name,
        slug,
        description: p.desc,
        unit: p.unit,
        price_per_unit: p.price,
        currency: 'INR',
        available_quantity: p.qty,
        minimum_order_qty: 1,
        packs: JSON.stringify([]),
        status: p.status || 'active',
        is_draft: false,
        is_organic: p.organic,
        added_by_role: 'admin',
        is_approved: true,
        approved_by: 1,
        approved_at: now,
        created_at: now,
        updated_at: now,
      };
    });

    const [existing] = await queryInterface.sequelize.query(
      "SELECT slug FROM products WHERE slug LIKE '%-prod'"
    );
    const seen = new Set(existing.map(r => r.slug));
    const toInsert = rows.filter(r => !seen.has(r.slug));
    if (toInsert.length) await queryInterface.bulkInsert('products', toInsert);
  },

  async down(queryInterface) {
    const { Op } = require('sequelize');
    await queryInterface.bulkDelete('products', { slug: { [Op.like]: '%-prod' } });
  },
};
