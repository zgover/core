import * as Aglyn from '@aglyn/aglyn'
import { components } from '../mui'
import { BUNDLE_ID } from './constants/bundle-common'
import { registerLegacyMuiPlugin } from './legacy-plugin'

// These ids are persisted in screen documents and must never change
// without a document migration.
const PERSISTED_COMPONENT_IDS = [
  'muiAppBar',
  'muiButton',
  'muiContainer',
  'muiList',
  'muiListItem',
  'muiListItemText',
  'muiStack',
  'muiToolbar',
  'muiTypography',
]

describe('plugins-ui-mui', () => {
  it('registers the mui plugin dependency with the legacy runtime', () => {
    registerLegacyMuiPlugin()
    expect(Aglyn.plugins.getDependency(BUNDLE_ID)).toBeTruthy()
  })

  it('is idempotent', () => {
    registerLegacyMuiPlugin()
    expect(() => registerLegacyMuiPlugin()).not.toThrow()
  })

  it('keeps the persisted legacy component ids in the bundle', () => {
    const ids = components.map((i) => i.schema.$id).sort()
    expect(ids).toEqual(PERSISTED_COMPONENT_IDS)
  })
})
