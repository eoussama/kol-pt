import { HOST_ATTRIBUTE } from "./selectors";



/**
 * @description
 * Card watcher options.
 */
export interface ICardWatcherOptions {

  /**
   * @description
   * Called, debounced, whenever the page's markup changed in a way that may
   * have added or removed post cards.
   */
  onChange: () => void;

  /**
   * @description
   * Stops the watcher when aborted.
   */
  signal: AbortSignal;

  /**
   * @description
   * The subtree to observe. Defaults to `document.body`, since Patreon may
   * replace `main#main-content` on navigation.
   */
  root?: Node;

  /**
   * @description
   * Quiet period before `onChange` runs, in milliseconds.
   */
  debounceMs?: number;

  /**
   * @description
   * Longest delay before `onChange` runs during continuous mutations, in
   * milliseconds.
   */
  maxWaitMs?: number;
}

/**
 * @description
 * Checks whether a node is, or is inside, an element the extension inserted.
 *
 * @param node - The node to check
 * @returns True if the node belongs to the extension
 */
function isOwnNode(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;

  return element?.closest(`[${HOST_ATTRIBUTE}]`) != null;
}

/**
 * @description
 * Checks whether a mutation may have added or removed post cards. Mutations
 * the extension caused itself are ignored, otherwise inserting a panel would
 * trigger another scan.
 *
 * @param record - The mutation record
 * @returns True if the page should be rescanned
 */
function isRelevant(record: MutationRecord): boolean {
  if (isOwnNode(record.target)) {
    return false;
  }

  const nodes = [...record.addedNodes, ...record.removedNodes];

  return nodes.some(node => node.nodeType === Node.ELEMENT_NODE && !(node as Element).hasAttribute(HOST_ATTRIBUTE));
}

/**
 * @description
 * Watches the page for post cards being added or removed, including cards
 * rendered after load, infinite scroll and client-side navigation.
 * `onChange` runs once immediately, then at most once per quiet period.
 *
 * @param options - The watcher options
 */
export function watchCards(options: ICardWatcherOptions): void {
  const { onChange, signal, debounceMs = 150, maxWaitMs = 1000 } = options;
  const root = options.root ?? document.body;

  if (signal.aborted) {
    return;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let firstPendingAt: number | null = null;

  const flush = () => {
    timer = undefined;
    firstPendingAt = null;

    if (!signal.aborted) {
      onChange();
    }
  };

  const schedule = () => {
    const now = Date.now();

    firstPendingAt ??= now;
    clearTimeout(timer);

    const waited = now - firstPendingAt;
    const delay = Math.max(0, Math.min(debounceMs, maxWaitMs - waited));

    timer = setTimeout(flush, delay);
  };

  const observer = new MutationObserver((records) => {
    if (records.some(isRelevant)) {
      schedule();
    }
  });

  observer.observe(root, { childList: true, subtree: true });

  signal.addEventListener("abort", () => {
    observer.disconnect();
    clearTimeout(timer);
  }, { once: true });

  onChange();
}
