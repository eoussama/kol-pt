import embedCss from "../../styles/embed.css?inline";



/**
 * @description
 * Marks the element inside a shadow root that React renders into.
 */
const CONTAINER_ATTRIBUTE = "data-kol-pt-container";

/**
 * @description
 * Marks the page stylesheet that registers the panels' custom properties.
 */
const PROPERTIES_ID = "kol-pt-properties";

/**
 * @description
 * Tailwind's `@property` rules. Browsers only honor them at document level,
 * so they are copied out of the shadow roots' stylesheet onto the page; they
 * only declare `--tw-*` variables, which Patreon does not use.
 */
const PROPERTY_RULES = /@property\s[^{]+\{[^}]*\}/g;

/**
 * @description
 * Clicks Patreon must not see. Seen from the page, an event from a shadow root
 * comes from its host, a plain element, so Patreon takes a click on one of the
 * panels' buttons for a click on the post card itself, and acts on it.
 */
const CLICK_EVENTS = ["click", "dblclick", "auxclick"] as const;

/**
 * @description
 * Keys Patreon must not see while typing in the panels' fields: they could
 * trigger its shortcuts. Escape still reaches the page, where the panels'
 * dialogs and menus listen for it.
 */
const KEY_EVENTS = ["keydown", "keyup", "keypress"] as const;

/**
 * @description
 * Whether an event comes from a field the user types in.
 *
 * @param event - The event
 * @returns True for inputs, text areas and editable content
 */
function isTyping(event: Event): boolean {
  const [target] = event.composedPath();

  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/**
 * @description
 * Keeps the panels' clicks and typing to themselves. They have been handled
 * by then: React listens inside the shadow root.
 *
 * @param host - The shadow host
 */
function isolateEvents(host: HTMLElement): void {
  for (const type of CLICK_EVENTS) {
    host.addEventListener(type, event => event.stopPropagation());
  }

  for (const type of KEY_EVENTS) {
    host.addEventListener(type, (event) => {
      if (isTyping(event) && (event as KeyboardEvent).key !== "Escape") {
        event.stopPropagation();
      }
    });
  }
}

/**
 * @description
 * Registers the panels' custom properties on the page, once.
 *
 * @param doc - The page
 */
function registerProperties(doc: Document): void {
  if (doc.getElementById(PROPERTIES_ID)) {
    return;
  }

  const style = doc.createElement("style");

  style.id = PROPERTIES_ID;
  style.textContent = (embedCss.match(PROPERTY_RULES) ?? []).join("\n");
  doc.head.append(style);
}

/**
 * @description
 * Returns the element to render into inside a host's shadow root, creating
 * the shadow root, its stylesheet and the element the first time. The
 * shadow root keeps the panels' styles and Patreon's apart. A style element
 * is used rather than an adopted stylesheet, which Firefox does not allow
 * content scripts to share with the page.
 *
 * @param host - The element on the page that hosts a panel
 * @returns The element React renders into
 */
export function getShadowContainer(host: HTMLElement): HTMLElement {
  const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  const existing = root.querySelector<HTMLElement>(`[${CONTAINER_ATTRIBUTE}]`);

  if (existing) {
    return existing;
  }

  const doc = host.ownerDocument;
  const style = doc.createElement("style");
  const container = doc.createElement("div");

  registerProperties(doc);
  isolateEvents(host);
  style.textContent = embedCss;
  container.setAttribute(CONTAINER_ATTRIBUTE, "");
  container.className = "kolpt-root";
  root.append(style, container);

  return container;
}

/**
 * @description
 * Adds the host of the panels' overlays (dialogs, menus, tooltips) to the
 * page: an empty element at the end of the body, above everything else.
 *
 * Patreon re-renders its page at times (signed in, mostly) and drops elements
 * it does not know, which would leave the overlays rendering into a detached
 * element: the host is put back whenever that happens, its shadow root and
 * what React rendered there intact.
 *
 * @param doc - The page
 * @returns The element overlays render into, and a function removing it
 */
export function createOverlayContainer(doc: Document = document): { container: HTMLElement; remove: () => void } {
  const host = doc.createElement("div");
  const attach = () => {
    if (!host.isConnected) {
      (doc.body ?? doc.documentElement).append(host);
    }
  };
  const observer = new MutationObserver(attach);

  host.setAttribute("data-kol-pt-overlays", "");
  host.style.position = "relative";
  host.style.zIndex = "2147483647";
  attach();
  observer.observe(doc.documentElement, { childList: true, subtree: true });

  return {
    container: getShadowContainer(host),
    remove: () => {
      observer.disconnect();
      host.remove();
    },
  };
}
