import {
  Accessibility, BookOpen, BriefcaseBusiness, Building2, CircleEqual,
  Cpu, Droplets, HandCoins, HeartHandshake, HeartPulse, House,
  Leaf, Lightbulb, Package, Recycle, Scale, Sprout, Stethoscope,
  Trees, Truck, Users, Utensils, Waves, Wrench, type LucideIcon,
} from 'lucide-react';

const causeIcons: Record<number, LucideIcon> = {
  1: House, 2: Utensils, 3: HeartPulse, 4: BookOpen, 5: CircleEqual,
  6: Droplets, 7: Lightbulb, 8: BriefcaseBusiness, 9: Cpu,
  10: Accessibility, 11: Building2, 12: Recycle, 13: Leaf,
  14: Waves, 15: Trees, 16: Scale, 17: HeartHandshake,
};
const resourceIcons: Record<string, LucideIcon> = {
  Funding: HandCoins, Volunteers: Users, Equipment: Wrench,
  'Food and supplies': Utensils, Transportation: Truck,
  'Venue or facilities': Building2, 'Training or expertise': BookOpen,
  'Medical resources': Stethoscope, Other: Package,
};

export function CauseIcon({id, size=22}: {id:number; size?:number}) {
  const Icon = causeIcons[id] || Sprout;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true"/>;
}
export function ResourceIcon({type, size=19}: {type:string; size?:number}) {
  const Icon = resourceIcons[type] || Package;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true"/>;
}
