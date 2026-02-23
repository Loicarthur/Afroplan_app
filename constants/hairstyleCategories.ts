/**
 * Hiérarchie complète des styles de coiffure AfroPlan
 * Grand titre = catégorie principale
 * Sous-titres = styles spécifiques proposés par les coiffeurs
 *
 * Note : Les prix ne sont pas définis ici.
 * Chaque coiffeur/salon fixe ses propres tarifs selon les styles qu'il propose.
 */

export interface HairstyleSubStyle {
  id: string;
  name: string;
  image: any;
  description?: string;
  duration?: string;
  // Prix supprimés : c'est chaque coiffeur qui définit ses tarifs
}

export interface HairstyleCategory {
  id: string;
  number: string;
  emoji: string;
  title: string;
  color: string;
  styles: HairstyleSubStyle[];
}

export const HAIRSTYLE_CATEGORIES: HairstyleCategory[] = [
  {
    id: 'tresses-nattes',
    number: '1️⃣',
    emoji: '🪮',
    title: 'Tresses et Nattes',
    color: '#8B5CF6',
    styles: [
      {
        id: 'box-braids',
        name: 'Box Braids',
        image: require('@/assets/images/Box_Braids.jpg'),
        description: 'Tresses carrées individuelles, toutes tailles',
        duration: '4-8h',
      },
      {
        id: 'knotless-braids',
        name: 'Knotless Braids',
        image: require('@/assets/images/Knotless_Braids.jpg'),
        description: 'Tresses sans nœud, légères et naturelles',
        duration: '5-9h',
      },
      {
        id: 'boho-braids',
        name: 'Boho Braids',
        image: require('@/assets/images/Boho_Braids.jpg'),
        description: 'Tresses bohèmes avec mèches ondulées',
        duration: '5-8h',
      },
      {
        id: 'cornrows',
        name: 'Cornrows / Nattes collées',
        image: require('@/assets/images/Nattes_Collees.jpg'),
        description: 'Nattes plaquées au crâne, design au choix',
        duration: '2-5h',
      },
      {
        id: 'fulani-braids',
        name: 'Fulani Braids',
        image: require('@/assets/images/Fulani_Braids.jpg'),
        description: 'Style Fulani, tresses avec accessoires',
        duration: '4-7h',
      },
      {
        id: 'crochet-braids',
        name: 'Crochet Braids',
        image: require('@/assets/images/Crochet_Braids.jpg'),
        description: 'Extensions au crochet sur cornrows',
        duration: '3-6h',
      },
    ],
  },
  {
    id: 'vanilles-twists',
    number: '2️⃣',
    emoji: '✨',
    title: 'Vanilles & Twists',
    color: '#F97316',
    styles: [
      {
        id: 'vanilles',
        name: 'Vanilles',
        image: require('@/assets/images/Vanille.jpg'),
        description: 'Deux brins torsadés naturels ou avec extension',
        duration: '3-6h',
      },
      {
        id: 'barrel-twist',
        name: 'Barrel Twist',
        image: require('@/assets/images/Barrel_Twist.jpg'),
        description: 'Twists épais style barrel, look volumineux',
        duration: '2-4h',
      },
    ],
  },
  {
    id: 'locks',
    number: '3️⃣',
    emoji: '🔒',
    title: 'Locks',
    color: '#92400E',
    styles: [
      {
        id: 'locks-creation',
        name: 'Locks (création / entretien)',
        image: require('@/assets/images/Locks_Naturel.jpg'),
        description: 'Création ou entretien de locks naturelles',
        duration: '3-8h',
      },
      {
        id: 'fausse-locks',
        name: 'Fausse Locks',
        image: require('@/assets/images/Fausse_Locks.jpg'),
        description: 'Fausses locks avec extensions',
        duration: '5-9h',
      },
      {
        id: 'dreadlocks',
        name: 'Dreadlocks naturelles',
        image: require('@/assets/images/Dreadlocks_Naturelles.jpg'),
        description: 'Dreadlocks 100% naturelles',
        duration: '4-10h',
      },
      {
        id: 'sisterlocks',
        name: 'Sisterlocks',
        image: require('@/assets/images/Sisterlocks.jpg'),
        description: 'Micro-locks fines et délicates',
        duration: '8-20h',
      },
      {
        id: 'soft-locks',
        name: 'Soft Locks',
        image: require('@/assets/images/Soft_Locks.jpg'),
        description: 'Locks douces et légères',
        duration: '5-8h',
      },
      {
        id: 'butterfly-locks',
        name: 'Butterfly Locks',
        image: require('@/assets/images/Butterfly_Locks.jpg'),
        description: 'Locks style papillon, aspect volumineux',
        duration: '5-9h',
      },
      {
        id: 'invisible-locks',
        name: 'Invisible Locks',
        image: require('@/assets/images/Invisible_Locks.jpg'),
        description: 'Locks à base invisible, look naturel',
        duration: '6-10h',
      },
      {
        id: 'bohemian-soft-locks',
        name: 'Bohemian Soft Locks',
        image: require('@/assets/images/Bohemian_Soft_Locks.jpg'),
        description: 'Locks bohèmes avec mèches ondulées',
        duration: '6-10h',
      },
    ],
  },
  {
    id: 'boucles-ondulations',
    number: '4️⃣',
    emoji: '🌸',
    title: 'Boucles et Ondulations',
    color: '#EC4899',
    styles: [
      {
        id: 'bantu-knots',
        name: 'Bantu Knots',
        image: require('@/assets/images/Bantu_Knots.jpg'),
        description: 'Petits chignons enroulés sur toute la tête',
        duration: '2-4h',
      },
    ],
  },
  {
    id: 'tissages-perruques',
    number: '5️⃣',
    emoji: '💇🏽‍♀️',
    title: 'Tissages & Perruques',
    color: '#0EA5E9',
    styles: [
      {
        id: 'tissage',
        name: 'Tissage',
        image: require('@/assets/images/Tissage.jpg'),
        description: 'Pose de tissage sur tresses cornrows',
        duration: '3-6h',
      },
      {
        id: 'pose-perruque',
        name: 'Pose de Perruque',
        image: require('@/assets/images/Pose_de_Perruque.jpg'),
        description: 'Pose et personnalisation de perruque',
        duration: '1-3h',
      },
      {
        id: 'flip-over',
        name: 'Flip Over',
        image: require('@/assets/images/Flip_Over.jpg'),
        description: 'Méthode flip over sans colle',
        duration: '2-4h',
      },
      {
        id: 'tape-in',
        name: 'Tape-in',
        image: require('@/assets/images/Tape_in.jpg'),
        description: 'Extensions collées type tape-in',
        duration: '1-3h',
      },
    ],
  },
  {
    id: 'ponytail',
    number: '6️⃣',
    emoji: '🎀',
    title: 'Ponytail',
    color: '#F59E0B',
    styles: [
      {
        id: 'ponytail-style',
        name: 'Ponytail',
        image: require('@/assets/images/Ponytail.jpg'),
        description: 'Queue de cheval stylisée, lisse ou bouclée',
        duration: '1-3h',
      },
    ],
  },
  {
    id: 'coupe-restructuration',
    number: '7️⃣',
    emoji: '✂️',
    title: 'Coupe & Restructuration',
    color: '#191919',
    styles: [
      {
        id: 'coupe',
        name: 'Coupe',
        image: require('@/assets/images/Coupe.jpg'),
        description: 'Coupe femme, homme ou enfant',
        duration: '0.5-2h',
      },
      {
        id: 'restructuration',
        name: 'Restructuration',
        image: require('@/assets/images/Reconstruction.jpg'),
        description: 'Remodelage et restructuration capillaire',
        duration: '1-3h',
      },
    ],
  },
  {
    id: 'soins-lissage-coloration',
    number: '8️⃣',
    emoji: '✨',
    title: 'Soins, Lissage & Coloration',
    color: '#7C3AED',
    styles: [
      {
        id: 'lissage',
        name: 'Lissage',
        image: require('@/assets/images/Lissage.jpg'),
        description: 'Lissage brésilien, kératine ou fer',
        duration: '2-4h',
      },
      {
        id: 'soin',
        name: 'Soin',
        image: require('@/assets/images/Soin.jpg'),
        description: 'Soin hydratant, protéique ou réparateur',
        duration: '1-3h',
      },
      {
        id: 'couleur',
        name: 'Couleur',
        image: require('@/assets/images/Coloration.jpg'),
        description: 'Coloration complète, racines ou mèches',
        duration: '1.5-4h',
      },
      {
        id: 'balayage',
        name: 'Balayage',
        image: require('@/assets/images/Balayage.jpg'),
        description: 'Balayage naturel, californien ou ombré',
        duration: '2-5h',
      },
    ],
  },
];

/**
 * Retrouver un style par son ID
 */
export function findStyleById(styleId: string): { category: HairstyleCategory; style: HairstyleSubStyle } | null {
  for (const category of HAIRSTYLE_CATEGORIES) {
    const style = category.styles.find((s) => s.id === styleId);
    if (style) return { category, style };
  }
  return null;
}

/**
 * Retrouver une catégorie par son ID
 */
export function findCategoryById(categoryId: string): HairstyleCategory | null {
  return HAIRSTYLE_CATEGORIES.find((c) => c.id === categoryId) ?? null;
}

/**
 * Liste plate de tous les styles pour les services coiffeur
 */
export function getAllStyleNames(): string[] {
  return HAIRSTYLE_CATEGORIES.flatMap((cat) => cat.styles.map((s) => s.name));
}

/**
 * Noms de catégories pour les services coiffeur (liste plate)
 */
export const SERVICE_CATEGORIES = HAIRSTYLE_CATEGORIES.map((cat) => ({
  id: cat.id,
  name: cat.title,
  emoji: cat.emoji,
  styles: cat.styles.map((s) => s.name),
}));
