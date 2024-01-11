export const template = `
import { $$importTypes } from "./types"

/**
 * @description $$description
*/
export async function $$requestName(
  params: {
    inpath: $$importTypes['requestPath']
    inbody: $$importTypes['requestBody']
    inQuery: $$importTypes['requestQuery']
  }
) {

  return Api<$$importTypes['response']>(\`$$url\`, params, {
    method: "$$method",
    paramsFormData: $$paramsFormData,
  })
}
`