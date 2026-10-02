import type { Post } from "../../core/domain/post";



/**
 * @description
 * A reactions panel mounted in a Patreon post card.
 */
export interface ICardEmbed {

  /**
   * @description
   * Stable React key for the panel.
   */
  key: string;

  /**
   * @description
   * The Patreon post card.
   */
  card: HTMLElement;

  /**
   * @description
   * The element inserted into the card that the panel renders into.
   */
  host: HTMLElement;

  /**
   * @description
   * The Patreon post id of the card.
   */
  postId: string;

  /**
   * @description
   * The tracked post, or null while posts are loading.
   */
  post: Post | null;

  /**
   * @description
   * Whether the post is known not to be tracked: a video post of the creator
   * that moderators could track.
   */
  untracked: boolean;
}

/**
 * @description
 * The set of panels currently mounted on the page, as an external store
 * React can subscribe to with `useSyncExternalStore`.
 */
export class CardRegistry {
  private readonly embeds = new Map<HTMLElement, ICardEmbed>();

  private readonly listeners = new Set<() => void>();

  private snapshot: ReadonlyArray<ICardEmbed> = [];

  /**
   * @description
   * Subscribes to changes.
   *
   * @param listener - Called after every change
   * @returns A function that unsubscribes
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  };

  /**
   * @description
   * Returns the mounted panels. The array is replaced on every change, so it
   * can be compared by reference.
   *
   * @returns The mounted panels
   */
  readonly getSnapshot = (): ReadonlyArray<ICardEmbed> => this.snapshot;

  /**
   * @description
   * Returns the panel mounted in a card.
   *
   * @param card - The post card
   * @returns The panel, if any
   */
  get(card: HTMLElement): ICardEmbed | undefined {
    return this.embeds.get(card);
  }

  /**
   * @description
   * Lists the mounted panels.
   *
   * @returns The mounted panels
   */
  values(): Array<ICardEmbed> {
    return [...this.embeds.values()];
  }

  /**
   * @description
   * Adds or replaces a card's panel.
   *
   * @param embed - The panel
   */
  set(embed: ICardEmbed): void {
    this.embeds.set(embed.card, embed);
    this.emit();
  }

  /**
   * @description
   * Removes a card's panel.
   *
   * @param card - The post card
   */
  delete(card: HTMLElement): void {
    if (this.embeds.delete(card)) {
      this.emit();
    }
  }

  /**
   * @description
   * Publishes a new snapshot to subscribers.
   */
  private emit(): void {
    this.snapshot = [...this.embeds.values()];
    this.listeners.forEach(listener => listener());
  }
}
