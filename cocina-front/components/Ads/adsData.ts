export type Sponsor = {
  id: string;
  name: string;
  tagline: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Emoji o iniciales para el "logo" placeholder */
  logoEmoji: string;
  bgFrom: string;
  bgTo: string;
  textColor: string;
};

export const SPONSORS: Sponsor[] = [
  {
    id: "rappi",
    name: "Rappi",
    tagline: "Ordena tus ingredientes frescos ahora · Entrega en 30 min",
    ctaLabel: "Pedir ahora",
    ctaUrl: "https://www.rappi.com.co",
    logoEmoji: "🛵",
    bgFrom: "#FF441F",
    bgTo: "#FF6B47",
    textColor: "#ffffff",
  },
  {
    id: "mercadolibre",
    name: "Mercado Libre",
    tagline: "Los mejores utensilios de cocina · Envío gratis en miles de productos",
    ctaLabel: "Comprar ahora",
    ctaUrl: "https://www.mercadolibre.com.co",
    logoEmoji: "🛍️",
    bgFrom: "#FFE600",
    bgTo: "#FFD000",
    textColor: "#333333",
  },
  {
    id: "carulla",
    name: "Carulla",
    tagline: "Ingredientes frescos de calidad premium · Supermercado online",
    ctaLabel: "Ver ofertas",
    ctaUrl: "https://www.carulla.com",
    logoEmoji: "🥗",
    bgFrom: "#1a6b3c",
    bgTo: "#2d9b5a",
    textColor: "#ffffff",
  },
  {
    id: "kitchenaid",
    name: "KitchenAid",
    tagline: "Electrodomésticos que inspiran · Haz de tu cocina un espacio de arte",
    ctaLabel: "Descubrir",
    ctaUrl: "https://www.kitchenaid.com",
    logoEmoji: "🍴",
    bgFrom: "#c0392b",
    bgTo: "#e74c3c",
    textColor: "#ffffff",
  },
];

export function getRandomSponsor(excludeId?: string): Sponsor {
  const pool = excludeId
    ? SPONSORS.filter((s) => s.id !== excludeId)
    : SPONSORS;
  return pool[Math.floor(Math.random() * pool.length)];
}
