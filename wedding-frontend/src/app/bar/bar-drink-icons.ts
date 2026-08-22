import { BarGlassType } from '../services/bar-drinks.service';

export type BarDrinkLucideIconName =
  | 'martini'
  | 'beer'
  | 'wine'
  | 'glass-water'
  | 'cup-soda'
  | 'coffee'
  | 'citrus'
  | 'snowflake'
  | 'leaf'
  | 'star'
  | 'flame'
  | 'sparkles'
  | 'badge-percent';

const BADGE_RULES: { pattern: RegExp; icon: BarDrinkLucideIconName }[] = [
  { pattern: /\b(destacad[oa]|featured|estrella)\b/i, icon: 'star' },
  { pattern: /\b(m[aá]s vendid[oa]|best[\s-]?seller|popular)\b/i, icon: 'flame' },
  { pattern: /\b(nuevo|nueva|new)\b/i, icon: 'sparkles' },
  { pattern: /\b(promo|promoci[oó]n|descuento|oferta)\b/i, icon: 'badge-percent' },
];

const INGREDIENT_RULES: { pattern: RegExp; icon: BarDrinkLucideIconName }[] = [
  { pattern: /lim[oó]n|lima|lemon|c[ií]tric|rodaja de lim/i, icon: 'citrus' },
  { pattern: /menta|mint|hierbabuena/, icon: 'leaf' },
  { pattern: /hielo|ice|fr[ií]o|on the rocks/, icon: 'snowflake' },
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function resolveDrinkIconName(name: string, glassType: BarGlassType): BarDrinkLucideIconName {
  const text = normalize(name);

  if (/cerveza|beer|ipa|lager|stout|porter/.test(text)) return 'beer';
  if (/champagne|espumante|prosecco|cava|sparkling|espumoso/.test(text)) return 'wine';
  if (/vino|wine|malbec|cabernet|tinto|blanco|rosado/.test(text)) return 'wine';
  if (/coca|cola|sprite|fanta|soda|gaseosa|refresco/.test(text)) return 'cup-soda';
  if (/\bagua\b|water/.test(text) && !/tonica/.test(text)) return 'glass-water';
  if (/cafe|coffee|espresso|cappuccino/.test(text)) return 'coffee';
  if (/whisky|whiskey|fernet|ron\b|rum|tequila|aperol|aperitif|aperitivo|campari|vermouth|amargo/.test(text)) {
    return 'glass-water';
  }
  if (/gin|vodka|martini|mojito|caipirinha|caipiroska|gancia|spritz|cocktail|coctel|mule|margarita|negroni|daiquiri|cosmopolitan|batida/.test(text)) {
    return 'martini';
  }
  if (/jugo|juice|naranja/.test(text)) return 'glass-water';

  switch (glassType) {
    case 'coupe':
    case 'collins':
    case 'rocks':
      return 'martini';
    case 'spritz':
      return 'wine';
    case 'highball':
    default:
      return 'glass-water';
  }
}

export function resolveDrinkBadges(name: string, description: string): BarDrinkLucideIconName[] {
  const text = normalize(`${name} ${description}`);
  const icons = BADGE_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.icon);
  return [...new Set(icons)];
}

export function resolveIngredientIcons(description: string): BarDrinkLucideIconName[] {
  const text = normalize(description);
  const icons = INGREDIENT_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.icon);
  return [...new Set(icons)];
}
