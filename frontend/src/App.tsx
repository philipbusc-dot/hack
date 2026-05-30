import { Outlet } from "react-router-dom";

/** Root shell: command-center backdrop + routed feature view. */
const App = () => {
  return (
    <div className="min-h-screen bg-bg font-sans text-ink antialiased">
      {/* Signature backdrop: two radial glows + a faint 30px grid.
          Fixed layer so it survives scroll. Expressed purely with
          Tailwind arbitrary background utilities. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-bg [background-image:radial-gradient(900px_600px_at_100%_0%,rgba(164,210,51,0.06),transparent_60%),radial-gradient(900px_600px_at_0%_0%,rgba(57,184,161,0.05),transparent_60%),linear-gradient(rgba(120,160,140,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,160,140,0.03)_1px,transparent_1px)] [background-size:100%_100%,100%_100%,30px_30px,30px_30px]"
      />
      <Outlet />
    </div>
  );
};

export default App;
