import { Outlet } from "react-router-dom";

const App = () => {
  return (
    <div className="min-h-screen w-full bg-bg flex justify-center items-start md:items-center p-4">
      <Outlet />
    </div>
  );
};

export default App;
