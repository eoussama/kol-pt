// Registers jest-dom's DOM matchers (toBeInTheDocument, toHaveTextContent...)
// with Vitest's expect. See https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/vitest";



// Browser APIs Radix (behind the shadcn/ui components) relies on and jsdom
// lacks: element sizes, pointer capture and scrolling into view.
globalThis.ResizeObserver ??= class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;
Element.prototype.scrollIntoView ??= () => undefined;
