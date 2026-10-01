/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly WXT_FIREBASE_API_KEY?: string;
  readonly WXT_FIREBASE_AUTH_DOMAIN?: string;
  readonly WXT_FIREBASE_DATABASE_URL?: string;
  readonly WXT_FIREBASE_PROJECT_ID?: string;
  readonly WXT_FIREBASE_STORAGE_BUCKET?: string;
  readonly WXT_FIREBASE_MEASUREMENT_ID?: string;
  readonly WXT_FIREBASE_APP_ID?: string;
  readonly WXT_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly WXT_YOUTUBE_DATA_API_KEY?: string;
  readonly WXT_CREATOR_NAME?: string;
  readonly WXT_PATREON_URL?: string;
  readonly WXT_FIREGUARD_URL?: string;
}

declare namespace JSX {
  type Element = import("react").JSX.Element;
  type IntrinsicElements = import("react").JSX.IntrinsicElements;
  // eslint-disable-next-line ts/no-empty-object-type
  interface ElementAttributesProperty { props: {} }
  // eslint-disable-next-line ts/no-empty-object-type
  interface ElementChildrenAttribute { children: {} }
}
