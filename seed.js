// Run once with:  npm run seed
// Deletes all products and inserts the sample ones below.
// Image for each product: public/images/products/<slug>.jpg  (change .jpg to .png if needed)
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const p = (name, slug, category, price, oldPrice, description, featured = false, stock = 15) => ({
  name,
  slug,
  category,
  price,
  oldPrice,
  description,
  image: `/images/products/${slug}.jpg`,
  stock,
  featured,
});

const products = [
  // Mirrors
  p('Arched LED Gold Mirror', 'arched-led-gold-mirror', 'mirrors', 9500, 11000, 'Tall arched mirror with a slim gold frame and warm built-in LED glow. Perfect for bedrooms and dressing areas.', true),
  p('Rounded Rectangle Wall Mirror', 'rounded-wall-mirror', 'mirrors', 4800, 0, 'Minimal full-length wall mirror with soft rounded corners and a thin black frame.'),
  p('Arched Floor Mirror', 'arched-floor-mirror', 'mirrors', 7500, 8500, 'Elegant arched floor mirror with a gold-tone frame that makes any room look bigger and brighter.'),
  p('Organic Shape LED Mirror', 'organic-led-mirror', 'mirrors', 12500, 0, 'Frameless wavy-edge mirror with soft LED backlight — a modern statement piece for hallways.', true),
  p('Gold Frame Standing Mirror', 'gold-standing-mirror', 'mirrors', 8900, 0, 'Freestanding arched mirror with a brushed gold frame and stand.'),

  // Vases
  p('Heart Ceramic Vase Pair', 'heart-ceramic-vases', 'vases', 1800, 2200, 'Set of 2 matte white heart-shaped ceramic vases. Lovely with dried pampas grass.', true),
  p('Nordic Boho Ceramic Vase Set', 'boho-ceramic-vase-set', 'vases', 2400, 0, 'Ribbed terracotta vase and arch-pattern cream vase in a modern boho style.'),
  p('Sage Green Vase Trio', 'sage-green-vase-trio', 'vases', 2100, 0, 'Three round sage green ceramic vases in different sizes.'),
  p('Neutral Tall Vase Set', 'neutral-tall-vases', 'vases', 2600, 3000, 'Set of 3 tall vases in beige, mauve and cream tones.'),
  p('Twisted Black Vase', 'twisted-black-vase', 'vases', 1500, 0, 'Sculptural twisted matte black vase for a bold minimalist look.'),

  // Plants
  p('Red Aglaonema in Grey Pot', 'red-aglaonema', 'plants', 1800, 0, 'Colourful red-pink leaf aglaonema in a ribbed grey planter. Easy indoor plant.'),
  p('Pink Aglaonema in White Pot', 'pink-aglaonema', 'plants', 1200, 0, 'Soft pink aglaonema in a white ceramic pot — brightens any windowsill.', true),
  p('Dieffenbachia Floor Plant', 'dieffenbachia', 'plants', 2200, 0, 'Lush dieffenbachia with large green leaves, ideal for living room corners.'),
  p('Corner Plant Duo with Stands', 'corner-plant-duo', 'plants', 3500, 4000, 'Two leafy indoor plants in white pots with wooden stands.'),
  p('Polka Dot Plant in Pink Pot', 'polka-dot-plant', 'plants', 850, 0, 'Cute pink-speckled polka dot plant in a blush pink pot.'),
  p('Pink Phalaenopsis Orchid', 'pink-orchid', 'plants', 1900, 0, 'Graceful pink orchid in a grey ceramic pot. Long-lasting blooms.', true),
  p('Cactus in Ceramic Pot', 'cactus-ceramic-pot', 'plants', 650, 0, 'Low-maintenance cactus in a cream ceramic pot.'),
  p('Lavender in Purple Pot', 'lavender-pot', 'plants', 950, 0, 'Fragrant lavender plant in a glossy purple pot.'),

  // Furniture
  p('Cream Boucle Loveseat', 'boucle-loveseat', 'furniture', 38000, 42000, 'Cozy curved boucle loveseat in cream with channel-tufted back.', true),
  p('Round Cozy Lounge Chair', 'round-lounge-chair', 'furniture', 18500, 0, 'Round padded lounge chair with soft cushions — your perfect reading nook.'),
  p('Wooden Hanging Swing Chair', 'wooden-swing-chair', 'furniture', 32000, 0, 'Rattan and wood hanging swing seat with cushions for a luxury living room.'),
  p('Green 3-Seater Sofa', 'green-3-seater-sofa', 'furniture', 55000, 60000, 'Mid-century style textured green sofa with wooden legs.'),
  p('White Hanging Egg Chair', 'white-egg-chair', 'furniture', 16500, 0, 'White wicker egg chair with stand and blue cushions. Indoor & outdoor.'),
  p('Rattan Hanging Egg Chair', 'rattan-egg-chair', 'furniture', 17500, 0, 'Natural rattan egg chair with cream cushion and black stand.', true),

  // Plates & dinnerware
  p('Cinnamon Ribbed Dinnerware Set', 'cinnamon-ribbed-dinnerware', 'plates', 6500, 7500, 'Neutral brown ribbed ceramic plates and bowls for cozy modern dining.', true),
  p('Stoneware Dinner Set with Copper Rim', 'stoneware-copper-rim-set', 'plates', 7200, 0, 'Handcrafted speckled stoneware with copper rim, served with rose gold cutlery.'),
  p('Moody Plum Dinnerware Set', 'plum-dinnerware-set', 'plates', 5800, 0, 'Deep plum glazed plates with gold rim for elegant dinners.'),
  p('Blue Dinnerware Set (16 pcs)', 'blue-dinnerware-set', 'plates', 6900, 7800, '16-piece set for 4 people: plates and pasta bowls in sky blue with brown rims.'),

  // Cutlery
  p('Minimalist Stainless Flatware Set', 'stainless-flatware-set', 'cutlery', 3200, 0, 'Scandinavian style stainless steel forks, spoons and knives.', true),
  p('Black & Rose Gold Knife Block Set', 'knife-block-set', 'cutlery', 4500, 5200, 'Kitchen knife set with scissors in a black block with rose gold accents.'),

  // Glasses
  p('Ribbed Coupe Glasses with Gold Rim', 'ribbed-gold-rim-coupes', 'glasses', 2800, 0, 'Luxury ribbed coupe glasses with a gold rim. Set of 6.', true),
  p('Ocean Blue Glassware Set', 'blue-glassware-set', 'glasses', 2400, 0, 'Tinted blue tumbler, wine glass and flute set.'),
  p('Crystal Square Tumblers', 'crystal-tumblers', 'glasses', 1600, 0, 'Heavy-base clear crystal square tumblers. Set of 4.'),
  p('Ribbed Gold Rim Tumblers (4 pcs)', 'ribbed-gold-rim-tumblers', 'glasses', 1900, 2300, 'Set of 4 ribbed 400 ml glasses with gold rim.'),

  // Tea sets & cookware
  p('Cream Ribbed Tea Set', 'cream-tea-set', 'kitchenware', 3400, 0, 'Cream ribbed teapot with 6 cups on a matching tray.', true),
  p('Lilac Tea Set with Tray', 'lilac-tea-set', 'kitchenware', 3800, 0, 'Pastel lilac teapot and cups with gold handles on a rose gold tray.'),
  p('Taupe Non-Stick Cookware Set (32 pcs)', 'taupe-cookware-set', 'kitchenware', 14500, 16500, 'Complete non-stick cookware and bakeware set with utensils in taupe.'),
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log(`Inserted ${products.length} products`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
