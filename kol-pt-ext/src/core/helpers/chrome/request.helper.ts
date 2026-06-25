/**
 * @description
 * Helps with chrome web requests
 */
export class RequestHelper {
  /**
   * @description
   * The maximum number of milliseconds the wait for requests
   * is going to be.
   */
  private static readonly MAX_WAIT: number = 5000;

  /**
   * @description
   * Waits until all requests resolve
   *
   * @returns Promise that resolves when all pending requests complete
   */
  static wait(): Promise<void> {
    return new Promise((resolve) => {
      // Request count
      let numRequests = 0;

      /**
       * @description
       * Increments count when a request is about to be sent
       *
       * @returns undefined
       */
      const onBeforeRequest = (): undefined => {
        numRequests++;

        return undefined;
      };

      /**
       * @description
       * Decrements count when a request is about to be sent
       *
       * @param force - If true, forces resolution immediately
       * @returns void
       */
      const onCompleted = (force: boolean = false) => {
        // Force shutting
        if (force) {
          return resolve();
        }

        numRequests--;

        if (numRequests === 0) {
          resolve();

          chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
          chrome.webRequest.onCompleted.removeListener(() => onCompleted());
        }
      };

      chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, { urls: ["<all_urls>"] });
      chrome.webRequest.onCompleted.addListener(() => onCompleted(), { urls: ["<all_urls>"] });

      // Fallback timeout
      setTimeout(() => onCompleted(true), this.MAX_WAIT);
    });
  }
}
