import type { LucideIcon } from "lucide-react";
import { Cpu, Scan, Wand2, Zap } from "lucide-react";

export interface TechSlide {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  icon: LucideIcon;
  stats: string;
}

export const TECH_SLIDES: TechSlide[] = [
  {
    id: "cbct",
    title: "3D CBCT Imaging & AI Diagnostics",
    tagline: "Sub-Millimeter Precision",
    description:
      "Provides ultra-low radiation 3D bone and nerve mapping for zero-guesswork surgical & implant planning.",
    image:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=2000&q=85",
    icon: Scan,
    stats: "99.8% Accuracy",
  },
  {
    id: "intraoral",
    title: "Digital Intraoral 3D Scanning",
    tagline: "Goop-Free Impressions",
    description:
      "Captures 6,000 3D color frames per second, replacing uncomfortable traditional mold trays with instant digital smile previewing.",
    image:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2000&q=85",
    icon: Wand2,
    stats: "Instant 3D Mesh",
  },
  {
    id: "laser",
    title: "Precision Laser Dentistry",
    tagline: "Painless & Bloodless Care",
    description:
      "Minimally invasive soft and hard tissue laser treatments that accelerate healing time by 70% without needles.",
    image:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=2000&q=85",
    icon: Zap,
    stats: "70% Faster Healing",
  },
  {
    id: "cadcam",
    title: "CAD/CAM Same-Day Ceramic Milling",
    tagline: "Same-Day Restorations",
    description:
      "In-house robotics design and mill custom porcelain veneers and crowns in under 60 minutes.",
    image:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=2000&q=85",
    icon: Cpu,
    stats: "45-Min Crowns",
  },
];

export const TECH_AUTOPLAY_MS = 5000;
