import type { SurvivorProfile } from "../types/connect.types";

export const mockSurvivors: SurvivorProfile[] = [
  {
    id: "1",
    name: "Alex",
    distance: "12 km",
    bio: "Just some survivor, wish life would go back the way it was tho...",
    age: 27,
    baseLocation: "Bunker Delta-6",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300",
    aiOpinion: "Alex shows high resource acquisition capabilities. Compatible.",
    supplies: [
      { label: "Medkit", value: 3, unit: "units" },
      { label: "Water Stock", value: 5, unit: "days" },
      { label: "Food Stock", value: 7, unit: "days" },
    ],
  },
  {
    id: "2",
    name: "Jordan",
    distance: "3.5 km",
    bio: "Combat medic. Seeking stable shelter and secure perimeter partners.",
    age: 29,
    baseLocation: "Sector 7 Ruins",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300&h=300",
    aiOpinion: "Medic skillset matches camp health projections. High priority.",
    supplies: [
      { label: "Medkit", value: 25, unit: "units" },
      { label: "Water Stock", value: 14, unit: "days" },
      { label: "Food Stock", value: 10, unit: "days" },
    ],
  },
  {
    id: "3",
    name: "Taylor",
    distance: "8 km",
    bio: "Greenhouse botanist. Growing crops in the wasteland is my passion.",
    age: 25,
    baseLocation: "Greenhouse Area 4",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300",
    aiOpinion: "Excellent decontamination profile and nutrition asset.",
    supplies: [
      { label: "Medkit", value: 8, unit: "units" },
      { label: "Water Stock", value: 21, unit: "days" },
      { label: "Food Stock", value: 30, unit: "days" },
    ],
  }
];
