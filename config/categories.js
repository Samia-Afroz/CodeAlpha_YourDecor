// All shop categories. "group" is used to split the navbar dropdown.
// Category card image: public/images/categories/<slug>.jpg
const categories = [
  { slug: 'mirrors',     name: 'Mirrors',          group: 'Home Decor' },
  { slug: 'vases',       name: 'Vases',            group: 'Home Decor' },
  { slug: 'plants',      name: 'Plants',           group: 'Home Decor' },
  { slug: 'furniture',   name: 'Furniture',        group: 'Home Decor' },
  { slug: 'plates',      name: 'Plates & Dinnerware', group: 'Culinary' },
  { slug: 'cutlery',     name: 'Cutlery & Knives', group: 'Culinary' },
  { slug: 'glasses',     name: 'Glasses',          group: 'Culinary' },
  { slug: 'kitchenware', name: 'Tea Sets & Cookware', group: 'Culinary' },
];

module.exports = categories;
