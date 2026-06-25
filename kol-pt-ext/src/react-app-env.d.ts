/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

declare namespace JSX {
  type Element = import("react").JSX.Element;
  type IntrinsicElements = import("react").JSX.IntrinsicElements;
  // eslint-disable-next-line ts/no-empty-object-type
  interface ElementAttributesProperty { props: {} }
  // eslint-disable-next-line ts/no-empty-object-type
  interface ElementChildrenAttribute { children: {} }
}
