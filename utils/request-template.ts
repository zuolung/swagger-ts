export const template = `
import { $$importTypes } from "./types"

/**
 * @description $$description
*/
export async function $$requestName(
  params:$$importTypes['request']
): $$importTypes['response'] {

  return Api.$$method(\`$$url\`, params, {
    requestKeys: {
      inPath: $$inPath,
      inQuery: $$inQuery,
      inFormData: $$inFormData,
    } 
  })
}
`