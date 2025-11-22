export const Allergen = {
  GLUTEN: 'gluten',
  CRUSTACEAN: 'crustacean',
  EGG: 'egg',
  FISH: 'fish',
  PEANUTS: 'peanuts',
  SOYA: 'soya',
  MILK: 'milk',
  NUTS: 'nuts',
  CELERY: 'celery',
  MUSTARD: 'mustard',
  SESAME: 'sesame',
  SULPHITE: 'sulphite',
  SHELLFISH: 'shellfish',
  LUPINS: 'lupins',
};

export const Allergens = Object.values(Allergen);

export const Cuisine = {
  INDIAN: 'Indian',
  ITALIAN: 'Italian',
  CHINESE: 'Chinese',
  HAWAIIAN: 'Hawaiian',
  MEXICAN: 'Mexican',
  AMERICAN: 'American',
  JAPANESE: 'Japanese',
  THAI: 'Thai',
  FRENCH: 'French',
  CARIBBEAN: 'Caribbean',
  GREEK: 'Greek',
  BRITISH: 'British',
};

export const Cuisines = Object.values(Cuisine);

export const Category = {
  // Starters & Appetizers
  STARTER: 'starter',
  SOUP: 'soup',
  SALAD: 'salad',
  SNACK: 'snack',
  APPETIZER: 'appetizer',

  // Western / Continental
  MAIN_COURSE: 'main_course',
  GRILL: 'grill',
  ROAST: 'roast',
  STEAKS: 'steaks',

  // Italian
  PASTA: 'pasta',
  PIZZA: 'pizza',
  RISOTTO: 'risotto',

  // Asian
  NOODLES: 'noodles',
  FRIED_RICE: 'fried_rice',
  DIMSUM: 'dimsum',
  WOK: 'wok_tossed',

  // Bakery / Breads / Sandwiches
  SANDWICH: 'sandwich',
  BURGER: 'burger',
  WRAP: 'wrap',
  BREAD: 'bread',

  // Breakfast
  BREAKFAST: 'breakfast',
  EGGS: 'eggs',
  PANCAKES: 'pancakes',
  CEREAL: 'cereal',

  // Sides
  SIDES: 'sides',
  FRIES: 'fries',
  ACCOMPANIMENT: 'accompaniment',
  SAUCE: 'sauce',

  // Desserts
  DESSERT: 'dessert',
  ICE_CREAM: 'ice_cream',
  CAKE: 'cake',
  PASTRY: 'pastry',
  SWEET: 'sweet',

  // Beverages
  BEVERAGE: 'beverage',
  HOT_BEVERAGE: 'hot_beverage',
  COLD_BEVERAGE: 'cold_beverage',
  TEA: 'tea',
  COFFEE: 'coffee',
  MOCKTAIL: 'mocktail',
  JUICE: 'juice',
  SMOOTHIE: 'smoothie',
  SHAKE: 'shake',

  // Bar (if needed for some hotels)
  ALCOHOL: 'alcohol',
  BEER: 'beer',
  WINE: 'wine',
  SPIRITS: 'spirits',
  COCKTAIL: 'cocktail',
};

export const Categories = Object.values(Category);
