import type { Metadata } from 'next';
import './globals.css';
import './product.css';
import { MotionEffects } from '@/components/ui/motion-effects';
export const metadata: Metadata = { title: 'ImpactLink — Connecting Resources to Real Needs', description: 'A partnership workspace for NGOs, contributors, and communities. Connect resources with local causes.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><MotionEffects/>{children}</body></html>; }
