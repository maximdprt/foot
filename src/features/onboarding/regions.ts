/**
 * Régions françaises (13 métropolitaines + DROM) et principales villes, pour
 * l'étape « Où es-tu ? ». Données statiques embarquées : l'autocomplétion
 * fonctionne hors ligne et sans appel réseau.
 *
 * Les noms de régions et de villes sont des noms propres : ils ne passent pas
 * par l'i18n (identiques en français et en anglais).
 */
import { normalizeSearch } from '@/lib/validation';

export interface Region {
  id: string;
  name: string;
  /** Villes proposées en autocomplétion (les plus peuplées de la région). */
  cities: string[];
}

export const REGIONS: Region[] = [
  {
    id: 'ara',
    name: 'Auvergne-Rhône-Alpes',
    cities: [
      'Lyon', 'Saint-Étienne', 'Grenoble', 'Villeurbanne', 'Clermont-Ferrand', 'Valence',
      'Chambéry', 'Annecy', 'Vénissieux', 'Bourg-en-Bresse', 'Montélimar', 'Roanne',
      'Vichy', 'Aurillac', 'Le Puy-en-Velay', 'Privas', 'Annemasse', 'Échirolles',
      'Caluire-et-Cuire', 'Bron',
    ],
  },
  {
    id: 'bfc',
    name: 'Bourgogne-Franche-Comté',
    cities: [
      'Dijon', 'Besançon', 'Belfort', 'Chalon-sur-Saône', 'Nevers', 'Auxerre',
      'Mâcon', 'Sens', 'Montbéliard', 'Dole', 'Le Creusot', 'Beaune',
      'Lons-le-Saunier', 'Vesoul', 'Autun', 'Chenôve',
    ],
  },
  {
    id: 'bre',
    name: 'Bretagne',
    cities: [
      'Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes', 'Saint-Malo',
      'Saint-Brieuc', 'Lanester', 'Fougères', 'Concarneau', 'Ploemeur', 'Morlaix',
      'Lannion', 'Cesson-Sévigné', 'Douarnenez', 'Dinan',
    ],
  },
  {
    id: 'cvl',
    name: 'Centre-Val de Loire',
    cities: [
      'Tours', 'Orléans', 'Bourges', 'Blois', 'Chartres', 'Châteauroux',
      'Dreux', 'Joué-lès-Tours', 'Vierzon', 'Montargis', 'Olivet', 'Saint-Jean-de-Braye',
      'Fleury-les-Aubrais', 'Romorantin-Lanthenay', 'Amboise', 'Vendôme',
    ],
  },
  {
    id: 'cor',
    name: 'Corse',
    cities: [
      'Ajaccio', 'Bastia', 'Porto-Vecchio', 'Borgo', 'Biguglia', 'Corte',
      'Furiani', 'Calvi', 'Propriano', 'Bonifacio', 'Ghisonaccia', 'Sartène',
    ],
  },
  {
    id: 'ges',
    name: 'Grand Est',
    cities: [
      'Strasbourg', 'Reims', 'Metz', 'Mulhouse', 'Nancy', 'Colmar',
      'Troyes', 'Charleville-Mézières', 'Thionville', 'Épinal', 'Châlons-en-Champagne', 'Haguenau',
      'Schiltigheim', 'Vandœuvre-lès-Nancy', 'Saint-Dizier', 'Sedan', 'Illkirch-Graffenstaden', 'Sarreguemines',
    ],
  },
  {
    id: 'hdf',
    name: 'Hauts-de-France',
    cities: [
      'Lille', 'Amiens', 'Roubaix', 'Tourcoing', 'Dunkerque', 'Calais',
      'Villeneuve-d’Ascq', 'Saint-Quentin', 'Beauvais', 'Valenciennes', 'Boulogne-sur-Mer', 'Compiègne',
      'Arras', 'Douai', 'Lens', 'Wattrelos', 'Maubeuge', 'Creil',
      'Liévin', 'Cambrai',
    ],
  },
  {
    id: 'idf',
    name: 'Île-de-France',
    cities: [
      'Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil', 'Nanterre',
      'Vitry-sur-Seine', 'Créteil', 'Versailles', 'Colombes', 'Aulnay-sous-Bois', 'Asnières-sur-Seine',
      'Courbevoie', 'Rueil-Malmaison', 'Champigny-sur-Marne', 'Saint-Maur-des-Fossés', 'Aubervilliers', 'Drancy',
      'Issy-les-Moulineaux', 'Levallois-Perret', 'Noisy-le-Grand', 'Cergy', 'Évry-Courcouronnes', 'Meaux',
    ],
  },
  {
    id: 'nor',
    name: 'Normandie',
    cities: [
      'Le Havre', 'Rouen', 'Caen', 'Cherbourg-en-Cotentin', 'Évreux', 'Dieppe',
      'Saint-Étienne-du-Rouvray', 'Sotteville-lès-Rouen', 'Alençon', 'Hérouville-Saint-Clair', 'Lisieux', 'Vernon',
      'Fécamp', 'Elbeuf', 'Grand-Quevilly', 'Bayeux',
    ],
  },
  {
    id: 'naq',
    name: 'Nouvelle-Aquitaine',
    cities: [
      'Bordeaux', 'Limoges', 'Poitiers', 'Pau', 'La Rochelle', 'Mérignac',
      'Pessac', 'Angoulême', 'Bayonne', 'Niort', 'Talence', 'Périgueux',
      'Agen', 'Anglet', 'Villenave-d’Ornon', 'Biarritz', 'Brive-la-Gaillarde', 'Rochefort',
      'Saintes', 'Bergerac',
    ],
  },
  {
    id: 'occ',
    name: 'Occitanie',
    cities: [
      'Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers', 'Narbonne',
      'Albi', 'Carcassonne', 'Colomiers', 'Tarbes', 'Sète', 'Castres',
      'Alès', 'Montauban', 'Rodez', 'Cahors', 'Blagnac', 'Tournefeuille',
      'Auch', 'Lourdes',
    ],
  },
  {
    id: 'pdl',
    name: 'Pays de la Loire',
    cities: [
      'Nantes', 'Angers', 'Le Mans', 'Saint-Nazaire', 'Cholet', 'La Roche-sur-Yon',
      'Laval', 'Saint-Herblain', 'Rezé', 'Saumur', 'Orvault', 'Vertou',
      'Les Sables-d’Olonne', 'Challans', 'Mayenne', 'Ancenis-Saint-Géréon',
    ],
  },
  {
    id: 'pac',
    name: 'Provence-Alpes-Côte d’Azur',
    cities: [
      'Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Antibes',
      'Cannes', 'La Seyne-sur-Mer', 'Hyères', 'Arles', 'Fréjus', 'Grasse',
      'Martigues', 'Cagnes-sur-Mer', 'Aubagne', 'Salon-de-Provence', 'Istres', 'Gap',
      'Draguignan', 'Digne-les-Bains',
    ],
  },
  {
    id: 'gua',
    name: 'Guadeloupe',
    cities: [
      'Les Abymes', 'Baie-Mahault', 'Le Gosier', 'Petit-Bourg', 'Sainte-Anne', 'Le Moule',
      'Pointe-à-Pitre', 'Sainte-Rose', 'Capesterre-Belle-Eau', 'Basse-Terre', 'Morne-à-l’Eau', 'Saint-François',
    ],
  },
  {
    id: 'mtq',
    name: 'Martinique',
    cities: [
      'Fort-de-France', 'Le Lamentin', 'Le Robert', 'Sainte-Marie', 'Schoelcher', 'Saint-Joseph',
      'Ducos', 'Rivière-Pilote', 'Le François', 'La Trinité', 'Le Marin', 'Sainte-Luce',
    ],
  },
  {
    id: 'guf',
    name: 'Guyane',
    cities: [
      'Cayenne', 'Saint-Laurent-du-Maroni', 'Matoury', 'Rémire-Montjoly', 'Kourou', 'Macouria',
      'Mana', 'Maripasoula', 'Apatou', 'Grand-Santi', 'Roura', 'Sinnamary',
    ],
  },
  {
    id: 'reu',
    name: 'La Réunion',
    cities: [
      'Saint-Denis', 'Saint-Paul', 'Saint-Pierre', 'Le Tampon', 'Saint-André', 'Saint-Louis',
      'Le Port', 'Saint-Joseph', 'Saint-Benoît', 'Sainte-Marie', 'La Possession', 'Saint-Leu',
    ],
  },
  {
    id: 'myt',
    name: 'Mayotte',
    cities: [
      'Mamoudzou', 'Koungou', 'Dzaoudzi', 'Dembéni', 'Bandraboua', 'Tsingoni',
      'Sada', 'Bouéni', 'Chirongui', 'Mtsamboro', 'Ouangani', 'Pamandzi',
    ],
  },
];

const byId = new Map(REGIONS.map((r) => [r.id, r]));

export function getRegion(id: string | null | undefined): Region | null {
  return id ? (byId.get(id) ?? null) : null;
}

/** Nom affichable d'une région à partir de son identifiant. */
export function regionName(id: string | null | undefined): string | null {
  return getRegion(id)?.name ?? null;
}

/** Filtre les villes d'une région (insensible à la casse et aux accents). */
export function searchCities(regionId: string | null, query: string): string[] {
  const region = getRegion(regionId);
  const pool = region ? region.cities : REGIONS.flatMap((r) => r.cities);
  const q = normalizeSearch(query);
  if (!q) return pool.slice(0, 40);
  return pool.filter((city) => normalizeSearch(city).includes(q)).slice(0, 40);
}

/** Région d'une ville connue (utilisé après un géocodage inverse). */
export function findRegionByCity(city: string): Region | null {
  const target = normalizeSearch(city);
  if (!target) return null;
  return (
    REGIONS.find((region) => region.cities.some((c) => normalizeSearch(c) === target)) ?? null
  );
}

/**
 * Région correspondant au nom renvoyé par le géocodage inverse d'Expo
 * (`Location.reverseGeocodeAsync().region`), ex. « Île-de-France », « Occitanie ».
 */
export function findRegionByName(name: string | null | undefined): Region | null {
  if (!name) return null;
  const target = normalizeSearch(name);
  return REGIONS.find((region) => normalizeSearch(region.name) === target) ?? null;
}
