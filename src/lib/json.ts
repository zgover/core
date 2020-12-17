/**
 * Interface to describe for class method
 * to generate JSON
 *
 * @export
 * @interface toJSON
 * @template T
 */
export interface toJSON<T> {
  toJSON(): T
}