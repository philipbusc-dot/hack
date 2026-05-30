import { lazy, Suspense } from "react";

// Lazy-load the globe page: react-globe.gl + three.js are heavy (~1MB+),
// so we only download them when the user actually opens /map — the rest
// of the app loads fast.
const MapPage = lazy(() => import("../pages/MapPage"));

export const mapRoutes = [
  {
    path: "map",
    element: (
      <Suspense
        fallback={
          <div className="fixed inset-0 grid place-items-center bg-[#0A1613] text-[#A4D233]">
            Loading globe…
          </div>
        }
      >
        <MapPage />
      </Suspense>
    ),
  },
];
