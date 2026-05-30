import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import ProtectedRoute from "./middlewares/ProtectedRoute";
import { aiRoutes } from "./modules/ai/routers/ai.router";
import { authRoutes } from "./modules/auth/routers/auth.router";

const mainRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/ai" replace /> },
      ...authRoutes,
      // Protected feature routes — require a logged-in user.
      ...aiRoutes.map((r) => ({
        ...r,
        element: <ProtectedRoute>{r.element}</ProtectedRoute>,
      })),
    ],
  },
]);

export default mainRouter;
