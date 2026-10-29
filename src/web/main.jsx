import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Landing } from "./landing/Landing.jsx";
import { initLanding } from "./landing/controller.js";

function Root() {
  useEffect(() => {
    document.body.classList.add("app-mounted");
    initLanding();
  }, []);

  return <Landing />;
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<Root />);
}
