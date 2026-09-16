require('dotenv').config();
const bcrypt = require('bcryptjs');

// Default coupons for festive shopping
const defaultCoupons = [
  {
    code: 'DIWALI2026',
    description: 'Special Diwali celebration flat ₹200 OFF on orders above ₹1,500',
    discount_type: 'flat',
    discount_value: 200,
    min_order_amount: 1500,
    max_discount_amount: 200,
    is_active: 1
  },
  {
    code: 'FESTIVE10',
    description: '10% OFF on all Sivakasi green crackers packages',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 500,
    max_discount_amount: 1000,
    is_active: 1
  },
  {
    code: 'FLASHSALE',
    description: 'Exclusive 15% OFF flash discount on orders above ₹2,000',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_amount: 2000,
    max_discount_amount: 500,
    is_active: 1
  }
];

// Default store settings
const defaultSettings = [
  { key: 'shop_upi_id', value: process.env.UPI_ID || 'YOUR_UPI_ID@upi' },
  { key: 'shop_name', value: process.env.SHOP_NAME || 'Blast Crackers Sivakasi' },
  { key: 'payment_instructions', value: 'Scan the dynamic QR code with any UPI app (GPay, PhonePe, Paytm, BHIM). After completing payment, click I Have Completed Payment and enter the 12-digit UPI UTR / Reference number.' },
  { key: 'require_utr', value: process.env.REQUIRE_UTR || 'true' },
  { key: 'payment_expiry_minutes', value: process.env.PAYMENT_EXPIRY_MINUTES || '15' },
  { key: 'low_stock_threshold', value: '20' }
];

// 2. Categories definition
const categories = [
    {
      id: 1,
      name: 'Sparklers',
      slug: 'sparklers',
      description: 'Gold, silver, color and electric sparklers for children and families. Safe and smoke-controlled.',
      icon: 'Sparkles',
      sort_order: 1
    },
    {
      id: 2,
      name: 'Flower Pots',
      slug: 'flower-pots',
      description: 'Dazzling colorful showers of sparks in special colors, deluxe sizes, and mega effects.',
      icon: 'Flame',
      sort_order: 2
    },
    {
      id: 3,
      name: 'Ground Chakkars',
      slug: 'ground-chakkars',
      description: 'High-speed spinning ground wheels with brilliant gold and multicolor sparkle rings.',
      icon: 'Disc',
      sort_order: 3
    },
    {
      id: 4,
      name: 'Rockets',
      slug: 'rockets',
      description: 'Sky-shot whistles, parachutes, and high-altitude multi-star burst rockets.',
      icon: 'Rocket',
      sort_order: 4
    },
    {
      id: 5,
      name: 'Fountains',
      slug: 'fountains',
      description: 'Multi-stage colour fountains, peacock feathers, waterfalls and pyrotechnic volcanoes.',
      icon: 'Waves',
      sort_order: 5
    },
    {
      id: 6,
      name: 'Sound Crackers',
      slug: 'sound-crackers',
      description: 'Traditional Sivakasi loud crackers, 28 Chorsa, Laxmi bomb, and classic festive garland rolls.',
      icon: 'Volume2',
      sort_order: 6
    },
    {
      id: 7,
      name: 'Gift Boxes',
      slug: 'gift-boxes',
      description: 'Curated assortment boxes for Diwali, New Year, and celebrations packed in royal gift cases.',
      icon: 'Gift',
      sort_order: 7
    },
    {
      id: 8,
      name: 'Kids/Family Collections',
      slug: 'kids-family-collections',
      description: 'Child-safe pop-pops, cartoon matches, snake eggs, pencil sparklers and low-decibel fun.',
      icon: 'Smile',
      sort_order: 8
    },
    {
      id: 9,
      name: 'Combo Packs',
      slug: 'combo-packs',
      description: 'Value-for-money combo packs combining sky shots, ground chakkars, sparklers and pots.',
      icon: 'Layers',
      sort_order: 9
    },
    {
      id: 10,
      name: 'Special Offers',
      slug: 'special-offers',
      description: 'Early bird festive season discounts, clearance bundles, and limited quantity flash deals.',
      icon: 'Zap',
      sort_order: 10
    }
  ];

  // 3. Seed Products (Authentic Sivakasi Crackers with High-Res festive photos & specifications)
  const products = [
    // Sparklers
    {
      id: 1,
      category_id: 1,
      name: '15cm Electric Sparklers (Pack of 10)',
      slug: '15cm-electric-sparklers',
      short_desc: 'Classic bright silver sparkles, ideal for kids and family safety.',
      description: 'Premium quality Sivakasi electric sparklers. Burns with crisp, crackling silver rays with minimum smoke and zero harmful residues. Tested for standard safety distance.',
      price: 90,
      mrp: 180,
      discount_percent: 50,
      stock: 250,
      unit: 'Box',
      piece_count: 10,
      sound_level: 'None',
      duration: '45 sec',
      safety_distance: '2 Meters',
      is_featured: 1,
      is_latest: 0,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      category_id: 1,
      name: '30cm Royal Golden Sparklers',
      slug: '30cm-royal-golden-sparklers',
      short_desc: 'Extra long-burning golden shower sparklers with gold glow.',
      description: 'Long stick 30cm festive sparklers that produce an intense, cascading golden light. Each stick lasts well over 1.5 minutes, perfect for festive photography and Diwali celebrations.',
      price: 195,
      mrp: 350,
      discount_percent: 44,
      stock: 180,
      unit: 'Box',
      piece_count: 5,
      sound_level: 'None',
      duration: '90 sec',
      safety_distance: '2 Meters',
      is_featured: 1,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      category_id: 1,
      name: 'Rainbow Color Sparklers (5 Colors)',
      slug: 'rainbow-color-sparklers',
      short_desc: 'Mesmerizing multi-color flame sparklers in red, green, blue, yellow, and violet.',
      description: 'Specialty formulation color sparklers emitting vivid saturated hues before turning into micro crackles. Non-toxic organic oxidizers used in accordance with Green Cracker norms.',
      price: 160,
      mrp: 300,
      discount_percent: 47,
      stock: 140,
      unit: 'Box',
      piece_count: 10,
      sound_level: 'None',
      duration: '50 sec',
      safety_distance: '2.5 Meters',
      is_featured: 0,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80'
    },

    // Flower Pots
    {
      id: 4,
      category_id: 2,
      name: 'Flower Pots Deluxe (Special Fountain)',
      slug: 'flower-pots-deluxe',
      short_desc: 'Towering fountain eruption reaching over 12 feet high with sparkling gold stars.',
      description: 'Rich conical flower pots that produce a magnificent volcanic fountain of glittering gold and crimson stars. Steady base design eliminates tipping risk.',
      price: 240,
      mrp: 450,
      discount_percent: 47,
      stock: 95,
      unit: 'Box',
      piece_count: 5,
      sound_level: 'Low',
      duration: '40 sec',
      safety_distance: '5 Meters',
      is_featured: 1,
      is_latest: 0,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 5,
      category_id: 2,
      name: 'Color Koti Flower Pots (Super Giant)',
      slug: 'color-koti-flower-pots',
      short_desc: 'Giant sized flower pots changing colors 3 times during burn.',
      description: 'Tri-color changing flower pots. Starts with dazzling emerald green, transforms into fiery ruby red, and finishes with a shower of titanium silver sparkles.',
      price: 420,
      mrp: 800,
      discount_percent: 48,
      stock: 60,
      unit: 'Box',
      piece_count: 5,
      sound_level: 'Low',
      duration: '60 sec',
      safety_distance: '6 Meters',
      is_featured: 0,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
    },

    // Ground Chakkars
    {
      id: 6,
      category_id: 3,
      name: 'Ground Chakkar Deluxe (Pack of 10)',
      slug: 'ground-chakkar-deluxe',
      short_desc: 'Smooth high-rpm circular rotation throwing wide rings of golden fire.',
      description: 'The soul of Indian Diwali celebration. Balanced precision-pressed circular chakkars that spin vigorously on flat pavement without drifting or sputtering.',
      price: 175,
      mrp: 320,
      discount_percent: 45,
      stock: 220,
      unit: 'Box',
      piece_count: 10,
      sound_level: 'Low',
      duration: '35 sec',
      safety_distance: '4 Meters',
      is_featured: 1,
      is_latest: 0,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 7,
      category_id: 3,
      name: 'Whistling Wheel Rotating Chakkar',
      slug: 'whistling-wheel-chakkar',
      short_desc: 'Fast spinner with an acoustic rising whistle and dazzling strobe flashes.',
      description: 'Exciting novelty chakkar that emits an entertaining whistle while spinning rapidly, concluding in bright white strobe bursts.',
      price: 280,
      mrp: 500,
      discount_percent: 44,
      stock: 110,
      unit: 'Box',
      piece_count: 5,
      sound_level: 'Medium',
      duration: '40 sec',
      safety_distance: '5 Meters',
      is_featured: 0,
      is_latest: 1,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?auto=format&fit=crop&w=800&q=80'
    },

    // Rockets
    {
      id: 8,
      category_id: 4,
      name: 'Sky-King Whistling Rockets',
      slug: 'sky-king-whistling-rockets',
      short_desc: 'High-altitude screamer ascending over 150 feet with loud crackling burst.',
      description: 'Top-tier sky rockets equipped with launch sticks for true straight-line flight. Climbs smoothly with high-pitched whistle and explodes into a 30-meter aerial peony.',
      price: 320,
      mrp: 600,
      discount_percent: 47,
      stock: 75,
      unit: 'Box',
      piece_count: 10,
      sound_level: 'High',
      duration: '8 sec',
      safety_distance: '15 Meters',
      is_featured: 1,
      is_latest: 0,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1533230807127-7166673b88b3?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 9,
      category_id: 4,
      name: 'Parachute Sky Shot Rocket',
      slug: 'parachute-sky-shot-rocket',
      short_desc: 'Shoots high into the sky and slowly floats down with a glowing lantern parachute.',
      description: 'A delight for the entire family. Rocket carries a miniature parachute flare high into the sky, gently descending while illuminating the night sky.',
      price: 490,
      mrp: 850,
      discount_percent: 42,
      stock: 45,
      unit: 'Box',
      piece_count: 5,
      sound_level: 'Medium',
      duration: '45 sec',
      safety_distance: '20 Meters',
      is_featured: 0,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?auto=format&fit=crop&w=800&q=80'
    },

    // Fountains
    {
      id: 10,
      category_id: 5,
      name: 'Mayur Peacock Multi-Color Fountain',
      slug: 'mayur-peacock-fountain',
      short_desc: 'Spreads out in 5 distinct fountain jets mimicking a majestic peacock dance.',
      description: 'Unique multi-angled fountain casing that ignites sequential sprays in blue, purple, gold, and turquoise. Highly praised as the most photogenic cracker of the season.',
      price: 360,
      mrp: 650,
      discount_percent: 45,
      stock: 85,
      unit: 'Piece',
      piece_count: 1,
      sound_level: 'Low',
      duration: '75 sec',
      safety_distance: '6 Meters',
      is_featured: 1,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 11,
      category_id: 5,
      name: 'Niagara Falls Silver Waterfall Fountain',
      slug: 'niagara-falls-fountain',
      short_desc: 'Lush cascade of silver and pearl liquid embers like a mountain waterfall.',
      description: 'Pyrotechnic waterfall fountain with gentle crackling sounds and dense silver brilliance. Cool-burn formulation reduces heat radiation while maintaining spectacular height.',
      price: 290,
      mrp: 520,
      discount_percent: 44,
      stock: 120,
      unit: 'Box',
      piece_count: 2,
      sound_level: 'Low',
      duration: '60 sec',
      safety_distance: '5 Meters',
      is_featured: 0,
      is_latest: 0,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&w=800&q=80'
    },

    // Sound Crackers
    {
      id: 12,
      category_id: 6,
      name: '1000 Wala Festive Garland (Traditional Ladi)',
      slug: '1000-wala-festive-garland',
      short_desc: 'The iconic grand celebration 1000 ladi with continuous rhythmic beats and smoke filters.',
      description: 'Handcrafted Sivakasi 1000 wala roll woven with precision braided fuse. Continuous explosive thunder sequence concluding in a grand salute bomb burst.',
      price: 480,
      mrp: 900,
      discount_percent: 47,
      stock: 80,
      unit: 'Box',
      piece_count: 1,
      sound_level: 'Very High',
      duration: '90 sec',
      safety_distance: '12 Meters',
      is_featured: 1,
      is_latest: 0,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1579208575657-c595a053b9b7?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 13,
      category_id: 6,
      name: '28 Chorsa Classic Sound Strips',
      slug: '28-chorsa-classic-sound-strips',
      short_desc: 'Crisp, punchy 28-cracker strips. The everyday favorite of Diwali evening.',
      description: 'Standard 28-piece red paper cracker strips. Fast firing sequence with sharp acoustics that bring nostalgic festive joy.',
      price: 85,
      mrp: 160,
      discount_percent: 47,
      stock: 300,
      unit: 'Box',
      piece_count: 10,
      sound_level: 'High',
      duration: '15 sec',
      safety_distance: '8 Meters',
      is_featured: 0,
      is_latest: 0,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 14,
      category_id: 6,
      name: 'Green Hydro Bomb (Decibel Regulated)',
      slug: 'green-hydro-bomb',
      short_desc: 'Heavy bass resonance explosion compliant with national sound limit standards.',
      description: 'Manufactured with barium-free green cracker formula. Deep sonic resonance and minimal flash blinding, ideal for open ground celebration.',
      price: 210,
      mrp: 380,
      discount_percent: 45,
      stock: 160,
      unit: 'Box',
      piece_count: 10,
      sound_level: 'High',
      duration: '5 sec',
      safety_distance: '10 Meters',
      is_featured: 0,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1533230807127-7166673b88b3?auto=format&fit=crop&w=800&q=80'
    },

    // Gift Boxes
    {
      id: 15,
      category_id: 7,
      name: 'Royal Heritage Diwali Gift Box (35 Items)',
      slug: 'royal-heritage-diwali-gift-box',
      short_desc: 'Luxurious gift hamper containing full variety: sparklers, pots, chakkars, and sky shots.',
      description: 'Packed in an embossed gold foil presentation box with carry handle. Contains 35 handpicked items catering to children, teenagers, and elders. Perfect for corporate and family gifting.',
      price: 1850,
      mrp: 3500,
      discount_percent: 47,
      stock: 50,
      unit: 'Gift Box',
      piece_count: 35,
      sound_level: 'Medium',
      duration: 'Assorted',
      safety_distance: '10 Meters',
      is_featured: 1,
      is_latest: 1,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 16,
      category_id: 7,
      name: 'Celebration VIP Mega Hamper (55 Items)',
      slug: 'celebration-vip-mega-hamper',
      short_desc: 'The ultimate fireworks collection for the ultimate festival night with multi-shot aerial cakes.',
      description: 'Exclusive master carton loaded with 55 distinct items including 12-shot sky cakes, giant flower pots, revolving fountains, metallic sparklers, and sound bombs.',
      price: 3499,
      mrp: 6500,
      discount_percent: 46,
      stock: 35,
      unit: 'Hamper',
      piece_count: 55,
      sound_level: 'Assorted',
      duration: 'Assorted',
      safety_distance: '15 Meters',
      is_featured: 1,
      is_latest: 0,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'
    },

    // Kids / Family Collections
    {
      id: 17,
      category_id: 8,
      name: 'Magic Cartoon Pop-Pop Snappers (Pack of 20 Boxes)',
      slug: 'magic-cartoon-pop-pop-snappers',
      short_desc: 'No flame needed! Just drop or throw on hard surface for a cheerful snap.',
      description: '100% flameless novelty cracker for toddlers and small kids. Safe friction-activated snaps wrapped in colorful novelty cartoon paper.',
      price: 140,
      mrp: 260,
      discount_percent: 46,
      stock: 350,
      unit: 'Bundle',
      piece_count: 100,
      sound_level: 'Low',
      duration: 'Instant',
      safety_distance: '1 Meter',
      is_featured: 0,
      is_latest: 0,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 18,
      category_id: 8,
      name: 'Black Dragon Snake Eggs (10 Rolls)',
      slug: 'black-dragon-snake-eggs',
      short_desc: 'Ignites into continuous wriggling ash snakes, fascinating for curious minds.',
      description: 'Traditional novelty carbon pellets. When touched with an incense stick, grows into a long twisting black snake cylinder with zero noise.',
      price: 80,
      mrp: 150,
      discount_percent: 47,
      stock: 280,
      unit: 'Pack',
      piece_count: 10,
      sound_level: 'None',
      duration: '45 sec',
      safety_distance: '1 Meter',
      is_featured: 0,
      is_latest: 0,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 19,
      category_id: 8,
      name: 'Color Smoke Grenades (Pack of 5 Colors)',
      slug: 'color-smoke-grenades',
      short_desc: 'Vibrant dense clouds of non-toxic colored smoke for daytime photo shoots.',
      description: 'Daytime celebrations, rangoli photos, and sports rallies. Produces 40 seconds of dense cinematic fog in Yellow, Pink, Cyan, Violet, and Lime.',
      price: 340,
      mrp: 600,
      discount_percent: 43,
      stock: 90,
      unit: 'Box',
      piece_count: 5,
      sound_level: 'None',
      duration: '40 sec',
      safety_distance: '3 Meters',
      is_featured: 1,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80'
    },

    // Combo Packs
    {
      id: 20,
      category_id: 9,
      name: 'Family Joy Combo (Sparklers + Pots + Chakkars)',
      slug: 'family-joy-combo',
      short_desc: 'Balanced family party kit with 5 boxes of sparklers, 2 boxes of pots, and 3 chakkars.',
      description: 'Specially assembled for apartments and suburban neighborhoods. Only visual, low-sound fireworks ensuring peace with neighbors and maximum joy for children.',
      price: 999,
      mrp: 1800,
      discount_percent: 45,
      stock: 70,
      unit: 'Combo',
      piece_count: 10,
      sound_level: 'Low',
      duration: 'Assorted',
      safety_distance: '5 Meters',
      is_featured: 1,
      is_latest: 0,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 21,
      category_id: 9,
      name: 'Sky Celebration Aerial Combo (12-Shot + 6 Rockets)',
      slug: 'sky-celebration-aerial-combo',
      short_desc: 'Turn your roof into an Olympic opening ceremony with high-burst fireworks.',
      description: 'Includes 1 unit of 12-Shot Multi-Color Aerial Cake plus a pack of 6 Deluxe Whistling Rockets. Sync your music and watch the sky illuminate.',
      price: 1290,
      mrp: 2400,
      discount_percent: 46,
      stock: 55,
      unit: 'Combo',
      piece_count: 7,
      sound_level: 'High',
      duration: '3 mins',
      safety_distance: '20 Meters',
      is_featured: 1,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1533230807127-7166673b88b3?auto=format&fit=crop&w=800&q=80'
    },

    // Special Offers
    {
      id: 22,
      category_id: 10,
      name: '12-Shot Multi-Color Sky Cake (Flash Sale 60% OFF)',
      slug: '12-shot-multi-color-sky-cake',
      short_desc: 'Single ignition launches 12 consecutive glittering aerial bouquets in 45 seconds.',
      description: 'Single fuse ignition releases 12 automated aerial bombards bursting into red palms, green strobes, golden brocades, and crackling dragon eggs.',
      price: 499,
      mrp: 1250,
      discount_percent: 60,
      stock: 120,
      unit: 'Piece',
      piece_count: 1,
      sound_level: 'High',
      duration: '45 sec',
      safety_distance: '15 Meters',
      is_featured: 1,
      is_latest: 1,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 23,
      category_id: 10,
      name: 'Flash Sale: 5000 Wala Mega Roll Bomb',
      slug: '5000-wala-mega-roll-bomb',
      short_desc: 'The champion 5000 ladi garland at an unbeatable festive introductory price.',
      description: 'Super long 5000 ladi crafted by senior Sivakasi pyrotechnicians. Generates an ecstatic festive atmosphere for temple festivals, grand Diwali, and milestones.',
      price: 1450,
      mrp: 3200,
      discount_percent: 55,
      stock: 40,
      unit: 'Box',
      piece_count: 1,
      sound_level: 'Very High',
      duration: '4 mins',
      safety_distance: '15 Meters',
      is_featured: 0,
      is_latest: 1,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1579208575657-c595a053b9b7?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 24,
      category_id: 10,
      name: 'Early Bird Triple Dhamaka Assortment',
      slug: 'triple-dhamaka-assortment',
      short_desc: 'Special bundle containing 2 Flower Pots, 2 Chakkars, and 2 Sparklers at flat discount.',
      description: 'Limited festive stock bundle. High quality authentic products packed fresh for the current festive season with crisp ignition fuses.',
      price: 399,
      mrp: 850,
      discount_percent: 53,
      stock: 85,
      unit: 'Combo',
      piece_count: 6,
      sound_level: 'Medium',
      duration: 'Assorted',
      safety_distance: '5 Meters',
      is_featured: 1,
      is_latest: 0,
      is_offer: 1,
      image_url: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 25,
      category_id: 2,
      name: 'Ashoka Tri-Colour Giant Flower Pot',
      slug: 'ashoka-tri-colour-giant-flower-pot',
      short_desc: 'Patriotic saffron, white and green fountain erupting in three majestic stages.',
      description: 'Specially engineered layered formulation displaying India’s festive tricolour hues with sparkling titanium micro-glitters. A true crowd pleaser.',
      price: 310,
      mrp: 580,
      discount_percent: 46,
      stock: 115,
      unit: 'Box',
      piece_count: 5,
      sound_level: 'Low',
      duration: '50 sec',
      safety_distance: '5 Meters',
      is_featured: 0,
      is_latest: 1,
      is_offer: 0,
      image_url: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const passwordHashAdmin = bcrypt.hashSync('Admin@123', 10);
  const passwordHashCustomer = bcrypt.hashSync('Customer@123', 10);

  // SQLite Seeding Engine
  function seedSqlite() {
    const db = require('./database');
    console.log('🌱 Seeding into local SQLite database...');

    // 1. Users (Only insert if not existing)
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, phone, alt_phone, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(1, 'Store Administrator', 'admin@blastcrackers.com', '+91 9876543210', '+91 9876543211', passwordHashAdmin, 'admin');
    insertUser.run(2, 'Karthik Raman', 'customer@gmail.com', '+91 9123456780', null, passwordHashCustomer, 'customer');
    console.log('✅ Users verified/seeded: admin@blastcrackers.com & customer@gmail.com');

    // 2. Categories (Only insert if not existing)
    const insertCategory = db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, slug, description, icon, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    categories.forEach(cat => {
      insertCategory.run(cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.sort_order);
    });
    console.log(`✅ ${categories.length} Categories verified/seeded.`);

    // 3. Products (Only insert if not existing, preserving any admin price or stock updates)
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (
        id, category_id, name, slug, short_desc, description,
        price, mrp, discount_percent, stock, unit, piece_count,
        sound_level, duration, safety_distance, is_featured, is_latest, is_offer, is_active, sku
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, 1, ?
      )
    `);

    const insertImage = db.prepare(`
      INSERT OR IGNORE INTO product_images (id, product_id, image_url, is_primary, sort_order)
      VALUES (?, ?, ?, 1, 0)
    `);

    products.forEach(p => {
      const sku = `BC-${1000 + p.id}`;
      insertProduct.run(
        p.id, p.category_id, p.name, p.slug, p.short_desc, p.description,
        p.price, p.mrp, p.discount_percent, p.stock, p.unit, p.piece_count,
        p.sound_level, p.duration, p.safety_distance, p.is_featured, p.is_latest, p.is_offer, sku
      );
      insertImage.run(p.id, p.id, p.image_url);
    });
    console.log(`✅ ${products.length} Products verified/seeded.`);

    // 4. Address (Only insert if not existing)
    const insertAddress = db.prepare(`
      INSERT OR IGNORE INTO addresses (id, user_id, full_name, phone, street, landmark, city, state, pincode, is_default)
      VALUES (1, 2, 'Karthik Raman', '+91 9123456780', '42, Temple View Avenue, Gandhi Nagar', 'Near Ayyanar Kovil', 'Madurai', 'Tamil Nadu', '625020', 1)
    `);
    insertAddress.run();

    // 5. Order & Payment (Only seed initial demo order if orders table is completely empty)
    const orderCountRow = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    if (!orderCountRow || orderCountRow.count === 0) {
      const insertOrder = db.prepare(`
        INSERT OR IGNORE INTO orders (
          id, order_number, user_id, address_id, address_snapshot,
          subtotal, discount, coupon_code, delivery_charge, grand_total,
          status, tracking_number, notes, created_at
        ) VALUES (
          1, 'BLAST-2026-7841', 2, 1,
          '{"fullName":"Karthik Raman","phone":"+91 9123456780","street":"42, Temple View Avenue, Gandhi Nagar","landmark":"Near Ayyanar Kovil","city":"Madurai","state":"Tamil Nadu","pincode":"625020"}',
          2439, 200, 'DIWALI2026', 0, 2239,
          'dispatched', 'TRK-BLAST-98214', 'Handle with care - Sivakasi Explosives Express', datetime('now', '-2 days')
        )
      `);
      insertOrder.run();

      const insertOrderItem = db.prepare(`
        INSERT OR IGNORE INTO order_items (id, order_id, product_id, product_name, price, quantity, total_price, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertOrderItem.run(1, 1, 15, 'Royal Heritage Diwali Gift Box (35 Items)', 1850, 1, 1850, 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80');
      insertOrderItem.run(2, 1, 6, 'Ground Chakkar Deluxe (Pack of 10)', 175, 2, 350, 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=800&q=80');
      insertOrderItem.run(3, 1, 1, '15cm Electric Sparklers (Pack of 10)', 90, 2, 180, 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80');

      const insertPayment = db.prepare(`
        INSERT OR IGNORE INTO payments (id, order_id, payment_method, payment_status, transaction_id, amount, paid_at)
        VALUES (1, 1, 'UPI', 'completed', 'UPI-98217398124', 2239, datetime('now', '-2 days'))
      `);
      insertPayment.run();
      console.log('✅ Demo Order & Payment seeded (table was empty).');
    } else {
      console.log('ℹ️ Existing orders preserved (skipping demo order insertion).');
    }

    // 6. Settings
    const insertSetting = db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
    `);
    for (const s of defaultSettings) {
      insertSetting.run(s.key, s.value);
    }

    // 7. Coupons
    const insertCoupon = db.prepare(`
      INSERT OR IGNORE INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of defaultCoupons) {
      insertCoupon.run(c.code, c.description, c.discount_type, c.discount_value, c.min_order_amount, c.max_discount_amount, c.is_active);
    }

    console.log('✅ Demo Address, Order, Payment, Settings & Coupons seeded.');
    console.log('✨ SQLite Database seeding successfully completed!');
  }

  // PostgreSQL Seeding Engine
  async function seedPostgres() {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🌱 Connecting to Cloud PostgreSQL for seeding...');
    await client.connect();

    try {
      await client.query('BEGIN');

      // 1. Users (Only insert if not already present, preserving user edits)
      const userQuery = `
        INSERT INTO users (id, name, email, phone, alt_phone, password_hash, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `;
      await client.query(userQuery, [1, 'Store Administrator', 'admin@blastcrackers.com', '+91 9876543210', '+91 9876543211', passwordHashAdmin, 'admin']);
      await client.query(userQuery, [2, 'Karthik Raman', 'customer@gmail.com', '+91 9123456780', null, passwordHashCustomer, 'customer']);
      console.log('✅ Users verified/seeded: admin@blastcrackers.com & customer@gmail.com');

      // 2. Categories (Only insert if not already present)
      const catQuery = `
        INSERT INTO categories (id, name, slug, description, icon, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, 1)
        ON CONFLICT (id) DO NOTHING
      `;
      for (const cat of categories) {
        await client.query(catQuery, [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.sort_order]);
      }
      console.log(`✅ ${categories.length} Categories verified/seeded.`);

      // 3. Products & Images (Only insert if not present, preserving admin price and stock edits)
      const prodQuery = `
        INSERT INTO products (
          id, category_id, name, slug, short_desc, description,
          price, mrp, discount_percent, stock, unit, piece_count,
          sound_level, duration, safety_distance, is_featured, is_latest, is_offer, is_active, sku
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, 1, $19
        )
        ON CONFLICT (id) DO NOTHING
      `;

      const imgQuery = `
        INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order)
        VALUES ($1, $2, $3, 1, 0)
        ON CONFLICT (id) DO NOTHING
      `;

      for (const p of products) {
        const sku = `BC-${1000 + p.id}`;
        await client.query(prodQuery, [
          p.id, p.category_id, p.name, p.slug, p.short_desc, p.description,
          p.price, p.mrp, p.discount_percent, p.stock, p.unit, p.piece_count,
          p.sound_level, p.duration, p.safety_distance, p.is_featured, p.is_latest, p.is_offer, sku
        ]);
        await client.query(imgQuery, [p.id, p.id, p.image_url]);
      }
      console.log(`✅ ${products.length} Products verified/seeded.`);

      // 4. Address (Only insert if not present)
      const addrQuery = `
        INSERT INTO addresses (id, user_id, full_name, phone, street, landmark, city, state, pincode, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `;
      await client.query(addrQuery, [1, 2, 'Karthik Raman', '+91 9123456780', '42, Temple View Avenue, Gandhi Nagar', 'Near Ayyanar Kovil', 'Madurai', 'Tamil Nadu', '625020', 1]);

      // 5. Order & Payment (Only insert if orders table has 0 rows)
      const orderCountCheck = await client.query('SELECT COUNT(*) as count FROM orders');
      if (parseInt(orderCountCheck.rows[0].count, 10) === 0) {
        const orderQuery = `
          INSERT INTO orders (
            id, order_number, user_id, address_id, address_snapshot,
            subtotal, discount, coupon_code, delivery_charge, grand_total,
            status, tracking_number, notes, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, NOW() - INTERVAL '2 days'
          )
          ON CONFLICT (id) DO NOTHING
        `;
        await client.query(orderQuery, [
          1, 'BLAST-2026-7841', 2, 1,
          '{"fullName":"Karthik Raman","phone":"+91 9123456780","street":"42, Temple View Avenue, Gandhi Nagar","landmark":"Near Ayyanar Kovil","city":"Madurai","state":"Tamil Nadu","pincode":"625020"}',
          2439, 200, 'DIWALI2026', 0, 2239,
          'dispatched', 'TRK-BLAST-98214', 'Handle with care - Sivakasi Explosives Express'
        ]);

        const orderItemQuery = `
          INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, total_price, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `;
        await client.query(orderItemQuery, [1, 1, 15, 'Royal Heritage Diwali Gift Box (35 Items)', 1850, 1, 1850, 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80']);
        await client.query(orderItemQuery, [2, 1, 6, 'Ground Chakkar Deluxe (Pack of 10)', 175, 2, 350, 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=800&q=80']);
        await client.query(orderItemQuery, [3, 1, 1, '15cm Electric Sparklers (Pack of 10)', 90, 2, 180, 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80']);

        const paymentQuery = `
          INSERT INTO payments (id, order_id, payment_method, payment_status, transaction_id, amount, paid_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '2 days')
          ON CONFLICT (id) DO NOTHING
        `;
        await client.query(paymentQuery, [1, 1, 'UPI', 'completed', 'UPI-98217398124', 2239]);
        console.log('✅ Demo Order & Payment seeded (table was empty).');
      } else {
        console.log('ℹ️ Existing orders preserved (skipping demo order insertion).');
      }

      // 6. Settings (Only insert if not present, preserving admin customizations)
      const settingQuery = `
        INSERT INTO settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `;
      for (const s of defaultSettings) {
        await client.query(settingQuery, [s.key, s.value]);
      }

      // 7. Coupons
      const couponQuery = `
        INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (code) DO NOTHING
      `;
      for (const c of defaultCoupons) {
        await client.query(couponQuery, [c.code, c.description, c.discount_type, c.discount_value, c.min_order_amount, c.max_discount_amount, c.is_active]);
      }

      // 8. Reset sequences
      const tablesWithSequences = ['users', 'categories', 'products', 'product_images', 'addresses', 'orders', 'order_items', 'payments', 'coupons'];
      for (const tbl of tablesWithSequences) {
        try {
          await client.query(`SELECT setval(pg_get_serial_sequence('${tbl}', 'id'), COALESCE((SELECT MAX(id) FROM ${tbl}), 1))`);
        } catch (seqErr) {
          // ignore if table doesn't use sequence
        }
      }

      await client.query('COMMIT');
      console.log('✅ Demo Address, Order, Payment, Settings & Coupons seeded into PostgreSQL.');
      console.log('✨ Cloud PostgreSQL database seeding successfully completed!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Cloud PostgreSQL seeding error:', err);
      throw err;
    } finally {
      await client.end();
    }
  }

  // Main Seeding Runner
  function seedDatabase() {
    if (process.env.DATABASE_URL) {
      seedPostgres().catch(err => {
        console.error('PostgreSQL Seeding failed:', err.message);
        process.exit(1);
      });
    } else {
      seedSqlite();
    }
  }

  seedDatabase();

