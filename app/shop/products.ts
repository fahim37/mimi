export type ProductImage = { src: string; alt: string };
export type ProductColor = { name: string; hex: string };
export type ProductSize = { label: string; available: boolean };

export type Product = {
  slug: string;
  name: string;
  chapter: string;
  type: string;
  tone: "rouge" | "plum" | "mineral" | "olive" | "noir" | "ruby" | "gold";
  price: number;
  compareAt?: number;
  badge?: string;
  tagline: string;
  description: string;
  images: ProductImage[];
  colors: ProductColor[];
  sizes: ProductSize[];
  details: string[];
  fabric: string;
  care: string;
};

export const products: Product[] = [
  {
    slug: "rouge-set",
    name: "The Rouge Set",
    chapter: "01",
    type: "Two-piece",
    tone: "rouge",
    price: 9800,
    compareAt: 11500,
    badge: "Runway piece",
    tagline: "Lines that move before you do.",
    description:
      "A striped two-piece cut for motion. The shirt falls just past the waist, the trouser opens from the knee, and the vertical line carries the eye from shoulder to hem in one clean sweep.",
    images: [
      { src: "/media/rouge-studio.webp", alt: "Model wearing the Rouge two-piece set in studio light" },
      { src: "/media/rouge-rooftop.webp", alt: "The Rouge set photographed on a rooftop" },
      { src: "/media/rouge-detail.webp", alt: "Close detail of the Rouge set striped tailoring" },
    ],
    colors: [
      { name: "Rouge Stripe", hex: "#9d2e30" },
      { name: "Ink Stripe", hex: "#20201d" },
    ],
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: false },
    ],
    details: [
      "Relaxed shirt with a concealed placket",
      "Wide-leg trouser with an elasticated back waist",
      "Side seam pockets, unlined",
      "Model is 175cm and wears a size S",
    ],
    fabric: "68% viscose, 32% linen",
    care: "Dry clean, or cold hand wash and line dry in shade. Warm iron on the reverse.",
  },
  {
    slug: "glamour-gown",
    name: "The Glamour Gown",
    chapter: "02",
    type: "Draped dress",
    tone: "plum",
    price: 14500,
    badge: "Campaign look",
    tagline: "Soft architecture in a deep plum tone.",
    description:
      "Weighted satin gathered at one hip and released into a long, unbroken fall. It reads as sculpture standing still, and as liquid the moment you move.",
    images: [
      { src: "/media/plum-front.webp", alt: "Front view of the plum draped gown" },
      { src: "/media/plum-pose.webp", alt: "Editorial portrait in the plum gown" },
      { src: "/media/plum-back.webp", alt: "Back view of the plum draped gown" },
      { src: "/media/plum-wide.webp", alt: "Full-length view of the plum gown" },
    ],
    colors: [
      { name: "Deep Plum", hex: "#5b2740" },
      { name: "Midnight", hex: "#1b1c2a" },
    ],
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: true },
      { label: "M", available: false },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    details: [
      "Asymmetric gathered drape at the hip",
      "Concealed side zip with a hook closure",
      "Fully lined bodice, floor-sweeping hem",
      "Model is 178cm and wears a size S",
    ],
    fabric: "Matte satin, 95% polyester and 5% elastane",
    care: "Dry clean only. Steam to release fold lines; do not iron the drape flat.",
  },
  {
    slug: "mineral-set",
    name: "The Mineral Set",
    chapter: "03",
    type: "Three-piece",
    tone: "mineral",
    price: 11200,
    tagline: "Airy layers, grounded confidence.",
    description:
      "Three pieces that work together and just as well apart. A cropped inner, an open overlayer, and a column skirt in a cool mineral blue that shifts with the light.",
    images: [
      { src: "/media/blue-model.webp", alt: "Model wearing the mineral blue layered set" },
      { src: "/media/blue-product.webp", alt: "Product view of the mineral blue set" },
    ],
    colors: [
      { name: "Mineral Blue", hex: "#6f89a6" },
      { name: "Pale Sky", hex: "#aebfd0" },
    ],
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    details: [
      "Cropped inner with adjustable straps",
      "Open overlayer with a dropped shoulder",
      "Column skirt with a hidden side slit",
      "Model is 173cm and wears a size M",
    ],
    fabric: "100% viscose georgette",
    care: "Cold hand wash separately. Line dry in shade. Cool iron.",
  },
  {
    slug: "olive-set",
    name: "The Olive Set",
    chapter: "04",
    type: "Two-piece",
    tone: "olive",
    price: 8900,
    tagline: "Quiet colour with a decisive silhouette.",
    description:
      "The easiest thing in the collection to reach for. A softly structured top over a straight-cut trouser, in an olive that sits somewhere between neutral and statement.",
    images: [
      { src: "/media/olive-full.webp", alt: "Full-length view of the olive relaxed set" },
      { src: "/media/olive-portrait.webp", alt: "Portrait wearing the olive top" },
      { src: "/media/olive-product.webp", alt: "Product view of the olive set" },
    ],
    colors: [
      { name: "Olive", hex: "#6d6a45" },
      { name: "Bone", hex: "#d9d2c1" },
    ],
    sizes: [
      { label: "XS", available: false },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    details: [
      "Softly structured top with a boat neckline",
      "Straight-cut trouser with a flat front",
      "Unlined, with a clean bound edge",
      "Model is 175cm and wears a size S",
    ],
    fabric: "55% linen, 45% cotton",
    care: "Machine wash cold on a gentle cycle. Tumble dry low or line dry.",
  },
  {
    slug: "noir-layer",
    name: "The Noir Layer",
    chapter: "05",
    type: "Evening separates",
    tone: "noir",
    price: 12400,
    tagline: "Black and ivory, held in balance.",
    description:
      "Evening separates built on contrast. An ivory panel cuts through black, so the outfit does the work and you can simply wear it.",
    images: [
      { src: "/media/noir-editorial.webp", alt: "Editorial image of the black and ivory evening look" },
      { src: "/media/noir-product.webp", alt: "Product view of the Noir evening separates" },
    ],
    colors: [
      { name: "Noir / Ivory", hex: "#141412" },
      { name: "Full Noir", hex: "#050505" },
    ],
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: false },
      { label: "XL", available: false },
    ],
    details: [
      "Contrast panel through the front body",
      "Covered button closure at the back",
      "Sold as a set; pieces are wearable apart",
      "Model is 178cm and wears a size XS",
    ],
    fabric: "Crepe, 72% polyester and 28% viscose",
    care: "Dry clean recommended. Steam rather than iron.",
  },
  {
    slug: "ruby-drape",
    name: "The Ruby Drape",
    chapter: "06",
    type: "Draped dress",
    tone: "ruby",
    price: 13600,
    badge: "Low stock",
    tagline: "One colour, said clearly.",
    description:
      "A single-shoulder drape in a saturated ruby, gathered close through the waist and left to fall free below. Nothing on it competes with the colour.",
    images: [
      { src: "/media/ruby-portrait.webp", alt: "Portrait wearing the ruby draped dress" },
      { src: "/media/ruby-product.webp", alt: "Product view of the ruby draped dress" },
      { src: "/media/burgundy-product.webp", alt: "The Ruby Drape in the deeper burgundy colourway" },
    ],
    colors: [
      { name: "Ruby", hex: "#a0182c" },
      { name: "Burgundy", hex: "#6b1f2a" },
    ],
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: false },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: false },
    ],
    details: [
      "Single-shoulder neckline",
      "Gathered waist with an inner stay",
      "Concealed zip, fully lined",
      "Model is 173cm and wears a size M",
    ],
    fabric: "Silk-blend charmeuse, 60% silk and 40% viscose",
    care: "Dry clean only. Store on a padded hanger.",
  },
  {
    slug: "champagne-hour",
    name: "The Champagne Hour",
    chapter: "07",
    type: "Evening gown",
    tone: "gold",
    price: 16900,
    badge: "Final pieces",
    tagline: "For the part of the night you remember.",
    description:
      "The most worked piece in the collection. Champagne fabric with a hand-finished trim, cut long and close, made to catch every bit of light in the room.",
    images: [
      { src: "/media/gold-portrait.webp", alt: "Evening portrait in the champagne gown" },
      { src: "/media/gold-detail.webp", alt: "Detail of the champagne fabric and trim" },
    ],
    colors: [
      { name: "Champagne", hex: "#c8a97e" },
      { name: "Antique Gold", hex: "#9a7b4f" },
    ],
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: false },
      { label: "XL", available: false },
    ],
    details: [
      "Hand-finished trim at the neckline",
      "Boned bodice with an internal grosgrain band",
      "Floor-length with a slight train",
      "Model is 180cm and wears a size S",
    ],
    fabric: "Silk-blend satin with metallic thread",
    care: "Dry clean only. Do not steam the trim directly.",
  },
];

const productBySlug = new Map(products.map((product) => [product.slug, product]));

export function getProduct(slug: string) {
  return productBySlug.get(slug);
}

export function relatedProducts(slug: string, count = 3) {
  return products.filter((product) => product.slug !== slug).slice(0, count);
}

export function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export const FREE_SHIPPING_THRESHOLD = 15000;
export const SHIPPING_FLAT_RATE = 150;
