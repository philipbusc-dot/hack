import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import App from "./App";
import ProtectedRoute from "./middlewares/ProtectedRoute";
import { aiRoutes } from "./modules/ai/routers/ai.router";
import { authRoutes } from "./modules/auth/routers/auth.router";
import { connectRoutes } from "./modules/connect/routers/connect.router";
import { countryReportRoutes } from "./modules/countryReport/routers/countryReport.router";
import { mapRoutes } from "./modules/map/routers/map.router";
import { profileRoutes } from "./modules/profile/routers/profile.router";
import { RiskRouter } from "./modules/riskScore/routers/risk.router";

const mainRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/map" replace /> },
      // Public — login / signup.
      ...authRoutes,
      // Pathless gate: every feature below requires a logged-in user.
      // (Nested layout routes like /risk render correctly via this Outlet.)
      // Admin-only actions (editing map/reference data) are enforced
      // server-side via requireAdmin.
      {
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          ...aiRoutes,
          ...connectRoutes,
          ...RiskRouter,
          ...countryReportRoutes,
          ...mapRoutes,
          ...profileRoutes,
        ],
      },
    ],
  },
]);

export default mainRouter;
