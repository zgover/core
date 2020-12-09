/**
 * Interface properties for a timestamp lifecycle
 *
 * @export
 * @interface StampedModel
 * @extends {DocumentData}
 */
export interface StampedModel {
  created?: number
  updated?: number
  deleted?: number
}