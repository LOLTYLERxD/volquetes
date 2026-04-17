import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toaster";

const appName = import.meta.env.VITE_APP_NAME || 'T.G Volquetes';

const pagesJsx = import.meta.glob("./Pages/**/*.jsx", { eager: true });
const pagesTsx = import.meta.glob("./Pages/**/*.tsx", { eager: true });

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => {
    const page = pagesTsx[`./Pages/${name}.tsx`] ?? pagesJsx[`./Pages/${name}.jsx`];
    if (!page) throw new Error(`Página no encontrada: ${name}`);
    return (page as any).default;
  },

  setup({ el, App, props }) {
    createRoot(el).render(
      <>
        <App {...props} />
        <Toaster />
      </>
    );
  },
});