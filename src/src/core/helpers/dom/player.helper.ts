import { URLHelper } from "../parse/url.helper";



export class PlayerHelper {

  /**
   * @description
   * Attaches raw vimeo video to patreon post.
   * This essentially replaces the original iframe with
   * a newer one that sources to the raw vimeo video.
   *
   * @param post The target post
   */
  static attach(post: HTMLDivElement): void {

    // Getting the media container, this is the element that contains the video's thumbnail
    const mediaEl = (post.querySelector('[data-tag="media-container"]') as HTMLDataElement).parentElement;

    if (mediaEl) {

      // Swaping the iframe's source
      this.updateSrc(post);

      // Getting the thumbnail's play button element
      const playButton = mediaEl.querySelector('button[title="Start playback"]') as HTMLDivElement;

      // Simulating a button click on the play button, this is done to trigger the iframe into loading
      if (playButton) {
        playButton.click();
      }
    }
  }

  /**
   * @description
   * Updates a patreom embed src with the target, raw, vimeo link.
   *
   * @param post The target post that contains the iframe
   */
  private static updateSrc(post: HTMLDivElement): void {
    const observer = new MutationObserver(mutations => {

      // Watching added mutations
      if (mutations.some(e => e.addedNodes.length > 0)) {

        // Getting the target iframe to decode and update
        const patreonEmbed = post.querySelector('iframe') as HTMLIFrameElement;

        // Decoding the raw link
        const src = URLHelper.decode(patreonEmbed?.src);

        // Updating the source
        patreonEmbed.src = src;

        // Unsubscribing from mutation observable
        observer.disconnect();
      }
    });

    // Observe mutations on post card
    observer.observe(post, { childList: true, subtree: true });
  }
}