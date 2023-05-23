/**
 * @description
 * Interface that enforces search filtrage logic on mdoels
 */
export interface ISearch {

  /**
   * @description
   * Checks if model matches search query
   *
   * @param search The search query to check against
   */
  match(search: string): boolean;
}