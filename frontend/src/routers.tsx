import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { connectRoutes } from "./modules/connect/routers/connect.router";
import { countryReportRoutes } from "./modules/countryReport/routers/countryReport.router";
import { mapRoutes } from "./modules/map/routers/map.router";
import { profileRoutes } from "./modules/profile/routers/profile.router";

const mainRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      ...connectRoute,
      ...countryReportRoutes,
      ...mapRoutes,
      ...profileRoutes,
    ],
  },
]);

export default mainRouter;
