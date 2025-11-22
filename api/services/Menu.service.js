import { computeRelevanceScore } from '#libs/ranking.js';
import { queryMenuByHotel } from '#repositories/Menu.repository.js';

export async function handleFetchMenuItems({ hotelId, args }) {
  const {
    searchText,
    cuisines,
    categories,
    veganOnly,
    vegOnly,
    glutenFree,
    excludeAllergens,
    includeUnavailable,
    maxItems = 50,
  } = args;

  const menu = await queryMenuByHotel({ hotelId });
  if (!menu || !menu.sections || menu.sections.length === 0) {
    return { items: [] };
  }

  // 1. Flatten sections + items into a list with section context
  const flattened = [];
  for (const section of menu.sections) {
    for (const item of section.items || []) {
      flattened.push({ item, section });
    }
  }

  // 2. Apply basic filters (cuisines, categories, vegOnly, availability)
  let filtered = flattened.filter(({ item }) => {
    // vegOnly filter
    if (veganOnly) {
      return item.vegan;
    }

    if (vegOnly) {
      return item.veg;
    }

    if (glutenFree) {
      return item.glutenFree;
    }

    if (excludeAllergens && excludeAllergens.length > 0) {
      const itemAllergens = (item.allergens || []).map((a) => a.toLowerCase());
      const notWanted = excludeAllergens.map((a) => a.toLowerCase());
      const hasOverlap = notWanted.some((a) => itemAllergens.includes(a));
      if (hasOverlap) return false;
    }

    // availability filter
    if (!includeUnavailable) {
      if (item?.available === false) return false;
    }

    return true;
  });

  // 4. Apply fuzzy-ish search over item + section
  const scored = [];

  for (const entry of filtered) {
    const { item, section } = entry;
    let score = 0;

    score += computeRelevanceScore(searchText, item.name);
    score += computeRelevanceScore(searchText, item.description) * 0.8;

    score += computeRelevanceScore(searchText, section.name) * 0.7;
    score += computeRelevanceScore(searchText, section.description) * 0.5;

    score += computeRelevanceScore(categories || [], item.name) * 0.9;
    score += computeRelevanceScore(categories || [], item.categories || []) * 0.8;
    score += computeRelevanceScore(categories || [], item.description) * 0.6;

    score += computeRelevanceScore(categories || [], section.name) * 0.5;
    score += computeRelevanceScore(categories || [], section.description) * 0.4;

    score += computeRelevanceScore(cuisines || [], section.name) * 0.5;
    score += computeRelevanceScore(cuisines || [], section.description) * 0.4;

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  // If no matches from fuzzy search, fall back to filtered with no search
  if (scored.length === 0) {
    const limited = filtered.slice(0, maxItems);
    return limited.map(toDTO);
  }

  scored.sort((a, b) => b.score - a.score);

  const limited = scored.slice(0, maxItems).map((s) => s.entry);
  return limited.map(toDTO);
}

function toDTO({ item }) {
  return {
    itemId: item.itemId,
    name: item.name,
    unitPrice: item.unitPrice,
    description: item.description,
    category: item.category,
    cuisines: item.cuisines,
    veg: item.veg,
    vegan: item.vegan,
    glutenFree: item.glutenFree,
    allergens: item.allergens,
    available: item.available !== false,
  };
}

export async function getItemsOnMenu({ hotelId }) {
  const menu = await queryMenuByHotel({ hotelId });
  return (menu?.sections ?? [])
    .filter((s) => Array.isArray(s?.items))
    .flatMap((s) => {
      return s?.items.map((i) => ({
        itemId: i.itemId,
        name: i.name,
        unitPrice: i.unitPrice,
        description: i.description,
        image: i.image,
        available: true,
        section: s.name,
      }));
    });
}

export async function handleFetchMenuSections({ hotelId, args }) {
  const menu = await queryMenuByHotel({ hotelId });
  return menu?.sections
    ?.map((s) => ({
      name: s.name,
      description: s.description,
      count: s.items.length,
      items: sample(s.items, Math.min(s.items.length, args.itemsPerSection)),
    }))
    .sort(() => 0.5 - Math.random());
}

/**
 * Randomly samples `n` elements from an array.
 * If n is not specified, returns a single random element.
 */
function sample(array, n = 1) {
  if (!Array.isArray(array) || array.length === 0) return [];
  if (n === 1) {
    return array[Math.floor(Math.random() * array.length)];
  }

  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, array.length));
}
