import type { ReportCallback } from "web-vitals";



/**
 * @description
 * Report web vitals metrics using the provided callback
 *
 * @param onPerfEntry - Callback to receive performance metrics
 */
function reportWebVitals(onPerfEntry?: ReportCallback) {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onINP(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
}

export default reportWebVitals;
