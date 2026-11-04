import { BookOpen, Gem, House, ShoppingBag, Sparkles, Tag, Zap, type LucideIcon } from 'lucide-react-native';

// Icons from the Home chips (bolt, sparkles, bag, home) extended to the backend's six categories
const ICONS: [RegExp, LucideIcon][] = [
  [/electronic/i, Zap],
  [/beauty/i, Sparkles],
  [/fashion/i, ShoppingBag],
  [/home/i, House],
  [/accessor/i, Gem],
  [/school|book|station/i, BookOpen],
];

export const categoryIcon = (name: string): LucideIcon => ICONS.find(([re]) => re.test(name))?.[1] ?? Tag;
