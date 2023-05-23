import { TimeHelper } from "../parse/time.helper";



/**
 * @description
 * Helps with DOM mutation detection
 */
export class ObserverHelper {

  /**
   * @description
   * Resolves after a certain node has been added to the DOM,
   * triggers as much as the content mutates.
   *
   * @param parent The parent wrapper element
   * @param target The target child(ren) to watch for
   * @param callback The function to call after every mutation
   *
   * @returns Unsubscription function
   */
  static onAdded(parent: HTMLElement, target: string, callback: () => void): () => void {

    // Last update timestamp
    let lastUpdated = 0;

    // Update timeout in milliseconds
    const timeout = 1000;

    // Defining mutation observer on the target
    const observer = new MutationObserver(async mutations => {

      // If any posts were added
      if (

        // Checking if update tick has ellapsed
        TimeHelper.ellapsed(lastUpdated, timeout)

        // Mutation checks
        && mutations.some(e =>

          // Checking if any nodes were added
          e.addedNodes.length > 0

          // Checking if any of target elements were added
          && Array.from(e.addedNodes).some((e) => e.nodeName.toLowerCase() === 'figure' && (e as HTMLElement).closest(target))
        )
      ) {

        // Updating timestamp
        lastUpdated = Date.now();

        // Triggering callback
        callback();
      }
    });

    // Observe mutations on the target
    observer.observe(parent, { childList: true, subtree: true });

    // Returns unsubscription function
    return () => observer.disconnect();
  }

  /**
   * @description
   * Resolves after a certain node has been added to the DOM,
   * triggers only once and then discards.
   *
   * @param parent The parent wrapper element
   * @param target The target child(ren) to watch for
   */
  static onAddedOnce(parent: HTMLElement, target: string): Promise<void> {
    return new Promise(resolve => {

      // If target already exists
      if (parent.querySelector(target)) {

        // Resolve the promise as the target already exists in the DOM
        resolve();

        // If not, watch for it
      } else {

        // Unsubscription function
        let unsubscribe: () => void;

        // Subscribing to the mutation change
        unsubscribe = this.onAdded(parent, target, () => {
          resolve();
          unsubscribe();
        });
      }
    });
  }
}