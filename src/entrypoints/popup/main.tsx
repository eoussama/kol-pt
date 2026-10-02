import React from "react";

import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { ThemeRoot } from "../../components/theme/ThemeRoot";
import { router } from "../../core/const/router.const";
import { usePopupTheme } from "../../hooks/popup-theme.hook";

import "../../styles/index.scss";



/**
 * @description
 * The popup, in Patreon's light or dark appearance.
 *
 * @returns The popup
 */
function Popup(): JSX.Element {
  usePopupTheme();

  return (
    <ThemeRoot>
      <RouterProvider router={router} />
    </ThemeRoot>
  );
}

// Attaching react
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
