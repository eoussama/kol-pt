import React from "react";

import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { TooltipProvider } from "../../components/ui/tooltip";
import { router } from "../../core/const/router.const";
import { usePopupTheme } from "../../hooks/popup-theme.hook";

import "../../styles/popup.css";



/**
 * @description
 * The popup, in Patreon's light or dark appearance.
 *
 * @returns The popup
 */
function Popup(): JSX.Element {
  usePopupTheme();

  return (
    <TooltipProvider delay={300}>
      <RouterProvider router={router} />
    </TooltipProvider>
  );
}

// Attaching react
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
