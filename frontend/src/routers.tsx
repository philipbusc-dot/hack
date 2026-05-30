import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { additionRoutes } from "./modules/addition/routers/addition.router";
import { multiplicationRoutes } from "./modules/multiplication/routers/multiplication.router";
import { aiRoutes } from "./modules/ai/routers/ai.router";

const mainRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/ai" replace /> },
      ...aiRoutes,
      ...additionRoutes,
      ...multiplicationRoutes,
    ],
  },
]);

export default mainRouter;
