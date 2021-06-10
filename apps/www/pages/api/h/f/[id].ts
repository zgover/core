/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { DdfForms } from '../../../../forms'
import { Req, Res } from '../../../../lib/api/helpers'
import httpRequestMethod from '../../../../lib/api/middleware/http-request-method'
import { rateLimiterFactory } from '../../../../lib/api/middleware/rate-limit'
import { handleMiddleware } from '../../../../lib/api/tools/middleware'
import { saveFormSubmit } from '../../../../lib/firebase/form-submission'


/**
 * Form submission functionality JSON api
 * directory & file name explanation `h = handle`, `f = form`, `[id] = form ID`
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 */
async function formHandler(req: NextApiRequest, res: NextApiResponse) {
  const { query: { id, ...params } } = req
  // Ensure Form ID exists
  if (!DdfForms.isValidFormId(id)) {
    return Res.Error.handleJsonError(res, Res.Error.notFound)
  }
  const schema = DdfForms.getFormSchemaFromId(id)
  const missingValues = DdfForms.checkRequiredValues(params, schema)
  if (missingValues.length) {
    return Res.Error.handleJsonError(
      res,
      Res.Error.missingParams('Failed Validation', { errors: missingValues }),
    )
  }

  await saveFormSubmit(id, params)

  return res.status(200).json(Res.Data.success)
}

export default handleMiddleware(
  rateLimiterFactory({ limit: 3 }),
  httpRequestMethod([Req.Method.POST]),
)(formHandler)
// export default formHandler
