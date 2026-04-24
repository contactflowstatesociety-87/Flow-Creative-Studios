
import { DropdownOption } from './types';

export const PHOTO_ANGLES: DropdownOption[] = [
  { id: '1', label: 'Eye Level 3 4 View', tooltip: 'Classic angled portrait view; signals professional balance; best for people/products.' },
  { id: '2', label: 'Low Angle Hero', tooltip: 'Shooting from below; signals power/dominance; best for large products or fashion.' },
  { id: '3', label: 'High Angle Overview', tooltip: 'Shooting from above; signals approachability/detail; best for flat-lays or interiors.' },
  { id: '4', label: 'Top Down Flat Lay', tooltip: 'Perfect vertical view; signals organization/modernity; best for ecommerce/apparel.' },
  { id: '5', label: 'Close Up Detail Macro', tooltip: 'Extreme detail focus; signals craftsmanship/texture; best for hardware/fabric.' },
  { id: '6', label: 'Wide Environmental', tooltip: 'Broad view of scene; signals lifestyle/context; best for brand storytelling.' },
  { id: '7', label: 'Over The Shoulder', tooltip: 'POV from behind subject; signals intimacy/perspective; best for lifestyle UGC.' },
  { id: '8', label: 'Symmetric Front On', tooltip: 'Centrally aligned view; signals order/precision; best for editorial fashion.' }
];

export const LENS_LOOKS: DropdownOption[] = [
  { id: '1', label: '24mm Wide', tooltip: 'Expansive view; signals energy/modernity; best for urban streets.' },
  { id: '2', label: '35mm Street', tooltip: 'Natural journalistic look; signals authenticity; best for documentary lifestyle.' },
  { id: '3', label: '50mm Natural', tooltip: 'Close to human eye; signals realism/honesty; best for general use.' },
  { id: '4', label: '85mm Portrait', tooltip: 'Flattering compression; signals elegance; best for high-end fashion.' },
  { id: '5', label: '105mm Macro', tooltip: 'Intense detail focus; signals precision; best for product closeups.' },
  { id: '6', label: 'Telephoto Compression', tooltip: 'Flattens depth; signals cinematic scale; best for cityscapes.' },
  { id: '7', label: 'Shallow DOF Bokeh', tooltip: 'Blurry background; signals luxury/focus; best for separating subjects.' },
  { id: '8', label: 'Deep Focus Crisp', tooltip: 'Everything is sharp; signals clarity/honesty; best for technical catalog.' }
];

export const VIDEO_MOTION: DropdownOption[] = [
  { id: '1', label: 'Locked Tripod', tooltip: 'Static camera; signals stability; best for product features.' },
  { id: '2', label: 'Slow Push In', tooltip: 'Moving toward subject; signals intrigue; best for revealing details.' },
  { id: '3', label: 'Slow Pull Out', tooltip: 'Moving away; signals context; best for ending a scene.' },
  { id: '4', label: 'Side Slide Dolly', tooltip: 'Parallel horizontal movement; signals high production value.' },
  { id: '5', label: 'Arc Orbit 90', tooltip: 'Rotating around subject; signals 3D form; best for hero product shots.' },
  { id: '6', label: 'Handheld Natural', tooltip: 'Slight organic movement; signals UGC/authentic vibe.' },
  { id: '7', label: 'Gimbal Follow', tooltip: 'Smooth tracking; signals modern tech; best for walking shots.' },
  { id: '8', label: 'Top Down Drift', tooltip: 'Floating overhead; signals premium minimalism.' }
];

export const VIDEO_FRAMING: DropdownOption[] = [
  { id: '1', label: 'Extreme Close Up', tooltip: 'Focus on tiny details; signals high fidelity.' },
  { id: '2', label: 'Close Up', tooltip: 'Shoulder-up view; signals emotional connection.' },
  { id: '3', label: 'Medium', tooltip: 'Waist-up view; signals standard interaction.' },
  { id: '4', label: 'Medium Wide', tooltip: 'Knee-up view; signals movement and body language.' },
  { id: '5', label: 'Wide', tooltip: 'Full environment; signals scale and story.' },
  { id: '6', label: 'Full Body', tooltip: 'Head to toe; signals fashion fit/pose.' },
  { id: '7', label: 'Product Table Top', tooltip: 'Focus on surface; signals utility/commercial.' },
  { id: '8', label: 'Cinematic Hero Frame', tooltip: 'Perfectly balanced wide-angle; signals epic story.' }
];

export const LIGHTING: DropdownOption[] = [
  { id: '1', label: 'Soft Studio Key', tooltip: 'Gentle shadows; signals luxury/beauty.' },
  { id: '2', label: 'Hard Key Dramatic', tooltip: 'Strong shadows; signals grit/premium tech.' },
  { id: '3', label: 'Golden Hour', tooltip: 'Warm sunset light; signals lifestyle/emotion.' },
  { id: '4', label: 'Overcast Diffused', tooltip: 'Shadowless even light; signals realism/clarity.' },
  { id: '5', label: 'Neon Night City', tooltip: 'Cyberpunk glows; signals tech/futurism.' },
  { id: '6', label: 'Office Fluorescent Real', tooltip: 'Cool industrial light; signals work/corporate.' },
  { id: '7', label: 'Window Light Natural', tooltip: 'Side-lit soft light; signals home/lifestyle.' },
  { id: '8', label: 'Backlit Rim Light', tooltip: 'Subject glow from behind; signals hero status.' }
];

export const STYLE: DropdownOption[] = [
  { id: '1', label: 'Ultra Real Commercial', tooltip: 'Crisp high-budget ad; signals quality.' },
  { id: '2', label: 'Editorial Fashion', tooltip: 'Vogue-style high contrast; signals luxury.' },
  { id: '3', label: 'Cinematic Film Still', tooltip: 'Movie-like color grading; signals story.' },
  { id: '4', label: 'Clean Ecom Catalog', tooltip: 'Pure white/neutral backgrounds; signals utility.' },
  { id: '5', label: 'Street Documentary', tooltip: 'Gritty and real; signals authenticity.' },
  { id: '6', label: 'Luxury Minimal', tooltip: 'Clean lines and muted tones; signals wealth.' },
  { id: '7', label: 'Tech Futuristic', tooltip: 'Neon accents and clean metal; signals innovation.' },
  { id: '8', label: 'Lifestyle UGC Premium', tooltip: 'iPhone-style high quality; signals relatability.' }
];

export const SCENE: DropdownOption[] = [
  { id: '1', label: 'Urban Commuter Street', tooltip: 'Busy city sidewalks; signals modern life.' },
  { id: '2', label: 'Modern Office Lobby', tooltip: 'Glass and steel; signals professionalism.' },
  { id: '3', label: 'Coffee Shop Work Session', tooltip: 'Warm interiors; signals productivity.' },
  { id: '4', label: 'Airport Terminal Travel', tooltip: 'Transit vibes; signals motion/adventure.' },
  { id: '5', label: 'Hotel Room Business', tooltip: 'Sleek luxury interiors; signals traveler.' },
  { id: '6', label: 'Train Or Subway Commute', tooltip: 'Industrial motion; signals urban grit.' },
  { id: '7', label: 'Outdoor Adventure Trail', tooltip: 'Natural landscapes; signals durability.' },
  { id: '8', label: 'Vacation Resort Walk', tooltip: 'Sun and palm trees; signals leisure.' }
];

export const BRAND_PRESETS: DropdownOption[] = [
  { id: 'none', label: 'None', tooltip: 'No brand specific styling.' },
  { id: 'nike', label: 'NIKE', tooltip: 'High-energy, athletic, dramatic shadows, grit, performance focus.' },
  { id: 'apple', label: 'Apple', tooltip: 'Ultra-minimal, clean white/gray backgrounds, soft product shadows, tech-chic.' },
  { id: 'northface', label: 'North Face', tooltip: 'Rugged, earthy tones, natural outdoor lighting, durability focus.' },
  { id: 'liquiddeath', label: 'Liquid Death', tooltip: 'Gritty, punk-rock aesthetic, high contrast, dark metal vibes.' },
  { id: 'malbon', label: 'Malbon Golf', tooltip: 'Heritage sportswear, casual luxury, lush green natural tones, lifestyle focus.' }
];

export const QUALITY_OPTIONS = ['2K', '4K', '6K'];
export const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
export const VIDEO_DURATIONS = ['6s', '9s', '15s'];

export const RECON_ANGLES = [
  'Front View',
  'Back View',
  'Left Side',
  'Right Side',
  'Top View',
  'Bottom View',
  'Macro Logo',
  'Macro Texture'
];

export const SMART_SUGGESTION_RULES = [
  { scene: 'Urban Commuter Street', style: 'Tech Futuristic', lighting: 'Neon Night City', suggestion: 'Try using "Telephoto Compression" for a cinematic cyberpunk look.' },
  { scene: 'Modern Office Lobby', style: 'Luxury Minimal', lighting: 'Soft Studio Key', suggestion: 'Perfect for hero product shots. Use "85mm Portrait" for depth.' },
  { scene: 'Coffee Shop Work Session', style: 'Lifestyle UGC Premium', lighting: 'Window Light Natural', suggestion: 'Maximize authenticity with "35mm Street" lens look.' },
  { scene: 'Airport Terminal Travel', style: 'Ultra Real Commercial', lighting: 'Hard Key Dramatic', suggestion: 'Creates a powerful traveler aesthetic. Try "Low Angle Hero".' },
  { scene: 'Outdoor Adventure Trail', style: 'Street Documentary', lighting: 'Golden Hour', suggestion: 'Evokes emotion and durability. Use "Wide Environmental".' },
  { scene: 'Hotel Room Business', style: 'Editorial Fashion', lighting: 'Backlit Rim Light', suggestion: 'High-end luxury vibe. "Shallow DOF Bokeh" is recommended.' },
  { scene: 'Train Or Subway Commute', style: 'Cinematic Film Still', lighting: 'Office Fluorescent Real', suggestion: 'Creates a moody, cinematic urban story.' },
  { scene: 'Vacation Resort Walk', style: 'Lifestyle UGC Premium', lighting: 'Golden Hour', suggestion: 'The ultimate social media travel look.' },
];
