/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { DdfForms } from '../../../../forms'
import { Req } from '../../../../lib/api/helpers'
import httpRequestMethod from '../../../../lib/api/middleware/http-request-method'
import { rateLimiterFactory } from '../../../../lib/api/middleware/rate-limit'
import { handleMiddleware } from '../../../../lib/api/tools/middleware'


/**
 * Form submission functionality JSON api
 * directory & file name explanation `h = handle`, `f = form`, `[id] = form ID`
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 */
function formHandler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: {
      id, ...params
    },
    method,
  } = req

  // const json = Res.Error.createSessionCookie
  // Logger.traceError(json, error)

  // Ensure Form ID exists
  // if (!DdfForms.isValidFormId(id)) {
  //   return res.status(400).end(`Bad Request`)
  // }
  //
  // const formSchema = DdfForms.getFormSchemaFromId(id)


  res.status(200).json({ success: true, code: 200 })
}

export default handleMiddleware(
  rateLimiterFactory({ limit: 3 }),
  httpRequestMethod([Req.Method.POST])
)(formHandler)
// export default formHandler
