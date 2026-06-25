/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

declare namespace JSX {
  type Element = import('react').JSX.Element;
  type IntrinsicElements = import('react').JSX.IntrinsicElements;
  interface ElementAttributesProperty { props: {}; }
  interface ElementChildrenAttribute { children: {}; }
}
