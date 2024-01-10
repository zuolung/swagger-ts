export const template = `
import { $$importTypes } from "./types"

/**
 * @description $$description
*/
export async function $$requestName(
  params:$$importTypes['request']
): $$importTypes['response'] {

  return Api(\`$$url\`, params, {
    method: "$$method",
    requestKeys: {
      inPath: $$inPath,
      inQuery: $$inQuery,
      inFormData: $$inFormData,
      inBody: $$inBody,
    } 
  })
}
`