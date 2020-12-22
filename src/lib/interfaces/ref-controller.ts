import { CrudModel } from "./crud"
import { Ref } from './dod'
import { Initializable } from './initializable'

/**
 * Describes the base model object
 *
 * @export
 * @interface BaseModel
 * @extends {Initializable}
 * @extends {Crud<T>}
 * @extends {toJSON<T>}
 * @template T
 */
export interface RefController<T extends Ref.Base> extends Initializable, CrudModel<T> {



}