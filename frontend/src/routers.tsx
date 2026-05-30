import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { additionRoutes } from "./modules/addition/routers/addition.router";
import { multiplicationRoutes } from "./modules/multiplication/routers/multiplication.router";
import { connectRoutes } from "./modules/connect/routers/connect.router";

const mainRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [...connectRoutes, ...additionRoutes, ...multiplicationRoutes],
  },
]);

export default mainRouter;
