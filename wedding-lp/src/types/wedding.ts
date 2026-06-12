export interface Couple {
  groom: string;
  bride: string;
}

export interface StoryItem {
  date: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

export interface Venue {
  name: string;
  address: string;
  time: string;
  date: string;
  mapsUrl: string;
}

export interface Fiesta {
  icon: string;
  title: string;
  dateLabel: string;
  time: string;
  venue: string;
  message: string;
  address: string;
  mapsUrl: string;
}

export interface DressCode {
  title: string;
  description: string;
  images: string[];
}

export interface BankDetails {
  title: string;
  alias: string;
  holder: string;
  dni: string;
}

export interface Gifts {
  icon: string;
  description: string;
  buttonLabel: string;
  bank: BankDetails;
}

export interface Confirmacion {
  title: string;
  subtitle: string;
  buttonLabel: string;
  appUrl: string;
}

export interface Socials {
  instagram: string;
  facebook: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface HeroConfig {
  image: string;
  imageAlt: string;
  tagline: string;
}

export interface MusicConfig {
  enabled: boolean;
  src: string;
  title: string;
  /** Intenta reproducir al abrir la página (sujeto a políticas del navegador). */
  autoplay?: boolean;
}

export interface WhatsAppConfig {
  enabled: boolean;
  phone: string;
  message: string;
}

export interface SiteMeta {
  title: string;
  description: string;
  url: string;
  ogImage: string;
}

export interface UiStrings {
  [key: string]: string;
}

export interface WeddingData {
  site: SiteMeta;
  couple: Couple;
  weddingDate: string;
  hero: HeroConfig;
  story: StoryItem[];
  ceremony: Venue;
  fiesta: Fiesta;
  reception: Venue;
  dressCode: DressCode;
  gifts: Gifts;
  confirmacion: Confirmacion;
  socials: Socials;
  gallery: GalleryItem[];
  music: MusicConfig;
  whatsapp: WhatsAppConfig;
  ui: UiStrings;
}
