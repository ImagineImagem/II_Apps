import React from 'react';

export enum ViewType {
  FRONTAL = 'Frontal',
  LATERAL = 'Lateral',
  THREE_QUARTER = '3/4',
  BACK = 'Traseira',
  ISOMETRIC = 'Isométrica',
  PLONGEE = 'Plongée',
  CONTRA_PLONGEE = 'Contra-plongée',
  TOP_DOWN = 'Top-down'
}

export enum MaterialType {
  NONE = 'Nenhum',
  METAL = 'Metal',
  PAINTING = 'Pintura',
  FABRIC = 'Tecido',
  EVA = 'EVA',
  PLUSH = 'Pelúcia',
  LATEX = 'Látex',
  PRINT_3D = 'Impressão 3D',
  PLASTIC = 'Plástico',
  DIGITAL = 'Manter Digital'
}

export enum ImageStyle {
  NONE = 'Nenhum',
  ANTIQUE = 'Antiguidade',
  LOGO = 'Logomarca',
  MODERN = 'Moderno',
  HATCHING = 'Hachura',
  PIXAR = 'Pixar Art',
  DISNEY = 'Disney Style',
  SEXY = 'Sexy',
  CINEMATIC = 'Cinematográfico',
  ANIME = 'Anime',
  MANGA = 'Manga',
  MINIMALIST = 'Minimalista',
  SURREALIST = 'Surrealista',
  FUTURIST = 'Futurista',
  CYBERPUNK = 'Cyberpunk',
  VINTAGE = 'Vintage',
  RETRO = 'Retrô',
  REALISTIC = 'Realista',
  ABSTRACT = 'Abstrato',
  POPART = 'Pop Art',
  STEAMPUNK = 'Steampunk',
  EXPRESSIONIST = 'Expressionista',
  CARTOON = 'Cartoon',
  COMICS = 'Quadrinhos',
  OTHER = 'Outro (Descrever)'
}

export enum LogoStyle {
  NONE = 'Nenhum',
  MINIMALIST = 'Minimalista',
  TYPOGRAPHIC = 'Tipográfica',
  MONOGRAM = 'Monograma',
  ABSTRACT = 'Abstrata',
  MASCOT = 'Mascote',
  EMBLEM = 'Emblema / Selo',
  PICTORIAL = 'Pictórica',
  LETTERMARK = 'Lettermark',
  WORDMARK = 'Wordmark',
  FLAT = 'Flat Design',
  ISOMETRIC = '3D / Isométrica',
  VINTAGE = 'Vintage / Retrô',
  FUTURIST = 'Futurista / Tech',
  GEOMETRIC = 'Geométrica',
  ILLUSTRATIVE = 'Ilustrativa',
  NEUMORPHISM = 'Neumorfismo / Soft UI',
  GRADIENT = 'Gradiente / Colorida',
  NEGATIVE_SPACE = 'Negative Space',
  DYNAMIC = 'Dinâmica / Responsiva',
  LUXURY = 'Minimal Luxury',
  OTHER = 'Outro (Descrever)'
}

export enum AppSection {
  CREATOR = 'creator',
  ANALYST = 'analyst',
  EDITOR = 'editor',
  SWAPPER = 'swapper',
  EXTRAS = 'extras'
}

export interface GeneratedImage {
  id: string;
  url: string; // Base64 or Blob URL
  prompt: string;
  timestamp: number;
  width: number;
  height: number;
}

export interface HistoryItem extends GeneratedImage {
  type: 'creation' | 'edit' | 'analysis';
}

// Neumorphic UI Component Props
export interface NeuProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}