export interface TurtleStyle {
  id: string;
  name: string;
  bodyColor: string;
  headColor: string;
  outlineColor: string;
  penUpBodyColor: string;
  penUpHeadColor: string;
  speed: number; // Animation speed (e.g., 1-10)
  // Optional: Add other properties like flipper size/shape if needed later
}

export const TURTLE_STYLES: TurtleStyle[] = [
  {
    id: 'sea_turtle',
    name: 'Sea Turtle',
    bodyColor: '#558B2F', // Darker green
    headColor: '#33691E', // Darker head
    outlineColor: '#1B5E20', // Very dark outline
    penUpBodyColor: '#AED581', // Lighter green when pen up
    penUpHeadColor: '#9CCC65', // Lighter head when pen up
    speed: 5,
  },
  {
    id: 'classic',
    name: 'Classic Green',
    bodyColor: '#609966',
    headColor: '#40513B',
    outlineColor: '#1A4D2E',
    penUpBodyColor: '#9DC08B',
    penUpHeadColor: '#6b8e6b',
    speed: 5,
  },
  {
    id: 'ocean_blue',
    name: 'Ocean Blue',
    bodyColor: '#1E88E5', // Blue
    headColor: '#0D47A1', // Darker Blue
    outlineColor: '#0B3D91',
    penUpBodyColor: '#90CAF9', // Light Blue
    penUpHeadColor: '#64B5F6',
    speed: 5,
  },
  {
    id: 'desert_shell',
    name: 'Desert Shell',
    bodyColor: '#D2B48C', // Tan
    headColor: '#8B4513', // Saddle Brown
    outlineColor: '#5D3A1A',
    penUpBodyColor: '#F5DEB3', // Wheat
    penUpHeadColor: '#CD853F', // Peru
    speed: 5,
  },
  {
    id: 'lava_flow',
    name: 'Lava Flow',
    bodyColor: '#E64A19', // Deep Orange
    headColor: '#BF360C', // Darker Orange/Red
    outlineColor: '#87260A',
    penUpBodyColor: '#FFCCBC', // Light Orange/Pink
    penUpHeadColor: '#FFAB91',
    speed: 5,
  },
  {
    id: 'royal_purple',
    name: 'Royal Purple',
    bodyColor: '#6A1B9A', // Purple
    headColor: '#4A148C', // Darker Purple
    outlineColor: '#380E6B',
    penUpBodyColor: '#CE93D8', // Light Purple
    penUpHeadColor: '#BA68C8',
    speed: 5,
  },
];

export const DEFAULT_TURTLE_STYLE = TURTLE_STYLES[0]; // Default to Sea Turtle
