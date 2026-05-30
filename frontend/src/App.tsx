import { Outlet } from "react-router-dom";
import TempNav from "../public/tempnav";

const App = () => {
  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-neutral-950">
      <TempNav />
      <div className="flex-1 min-h-0 w-full flex">
        <Outlet />
      </div>
    </div>
  );
};

export default App;
