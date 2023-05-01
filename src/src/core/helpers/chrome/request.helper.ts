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
   */
  static wait(): Promise<void> {
    return new Promise((resolve) => {

      // Request count
      let numRequests = 0;

      /**
       * @description
       * Increments count when a request is about to be sent
       */
      const onBeforeRequest = () => {
        numRequests++;
      };

      /**
       * @description
       * Decrements count when a request is about to be sent
       */
      const onCompleted = () => {
        numRequests--;

        if (numRequests === 0) {
          resolve();

          chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
          chrome.webRequest.onCompleted.removeListener(onCompleted);
        }
      };

      chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, { urls: ["<all_urls>"] }, ["requestBody"]);
      chrome.webRequest.onCompleted.addListener(onCompleted, { urls: ["<all_urls>"] }, ["responseHeaders"]);

      setTimeout(onCompleted, this.MAX_WAIT);
    });
  }
}