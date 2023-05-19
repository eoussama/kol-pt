import { URLHelper } from '../parse/url.helper';



/**
 * @description
 * Helper that handles Vimeo player operations
 */
export class PlayerHelper {

  /**
   * @description
   * Attaches raw vimeo video to patreon post.
   * This essentially replaces the original iframe with
   * a newer one that sources to the raw vimeo video.
   *
   * @param post The target post
   */
  static attach(post: HTMLDivElement): Promise<void> {
    return new Promise(async resolve => {

      // Getting the media container, this is the element that contains the video's thumbnail
      const mediaEl = (post.querySelector('[data-tag="media-container"]')?.parentElement ?? post.querySelector('.sc-jefHZX')) as HTMLDataElement;

      if (mediaEl) {
        await new Promise(rslv => setTimeout(() => rslv(0), 100));

        // Getting the thumbnail's play button element
        const playButton = mediaEl.querySelector('button[title="Start playback"]') as HTMLDivElement;

        // The media button is still not clicked
        if (playButton) {

          // Swaping the iframe's source
          this.updateSrc(post).finally(() => resolve());

          // Simulating a button click on the play button, this is done to trigger the iframe into loading
          playButton.click();

          // In case the user has already pressed on the media player button
        } else {

          // Updating the iframe
          this.updateVideo(post);

          // Resolving promise
          resolve();
        }
      }
    });
  }

  /**
   * @description
   * Updates a patreom embed src with the target, raw, vimeo link.
   *
   * @param post The target post that contains the iframe
   */
  private static updateSrc(post: HTMLDivElement): Promise<void> {
    return new Promise(resolve => {
      const observer = new MutationObserver(mutations => {

        // Watching added mutations
        if (mutations.some(e => e.addedNodes.length > 0)) {

          // Updating the iframe
          this.updateVideo(post);

          // Unsubscribing from mutation observable
          observer.disconnect();

          // Finishing
          resolve();
        }
      });

      // Observe mutations on post card
      observer.observe(post, { childList: true, subtree: true });
    });
  }

  /**
   * @description
   * Updates iframe video src
   *
   * @param post The target post that contains the iframe
   */
  private static updateVideo(post: HTMLDivElement): void {

    // Getting the target iframe to decode and update
    const patreonEmbed = post.querySelector('iframe') as HTMLIFrameElement;

    if (patreonEmbed) {

      // Decoding the raw link
      const src = URLHelper.decode(patreonEmbed?.src);

      // Updating the source
      patreonEmbed.src = src;
    }
  }
}