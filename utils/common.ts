import { formatBaseTypeKey } from "./transorm"

function versionCompatible(dna: any) {
  const { data, requestParams, responseData } = dna
  const swaggerVersion = data['swagger'] || data['openapi']
  let definitions = {}
  let pathsRequestBody = undefined
  let pathsResponseData = undefined
  let reqBodyIsFormData = false

  if (/^3\./.test(swaggerVersion)) {
    definitions = data['components']['schemas']
    if (requestParams) {
      if (requestParams['requestBody']?.['content']?.['multipart/form-data']) {
        reqBodyIsFormData = true
      }
      pathsRequestBody =
        requestParams['requestBody']?.['content']?.['application/json'] ||
        requestParams['requestBody']?.['content']?.['multipart/form-data'] ||
        requestParams['requestBody']?.['content']?.['text/json'] 
    }
    if (responseData) {
      pathsResponseData =
        responseData?.['responses']?.['200']?.['content']?.[
          'application/json'
        ] || responseData?.['responses']?.['200']?.['content']?.['text/json']
    }
  } else if (/^2\./.test(swaggerVersion)) {
    definitions = data['definitions']
    if (requestParams) {
      // @ts-ignore
      pathsRequestBody = filterRepeatName(requestParams['parameters']).filter(it => {
        if (it.in === 'formData') reqBodyIsFormData = true
        return it.in === 'body' || it.in === 'formData'
      })
    }

    if (responseData) {
      pathsResponseData = responseData?.['responses']?.['200']
    }
  }

  // 格式化 definitions的key
  const newDefinitions = {}
  for (const k in definitions) {
    // @ts-ignore
    newDefinitions[formatBaseTypeKey(k)] = definitions[k]
  }

  return {
    definitions: newDefinitions,
    pathsRequestBody,
    pathsResponseData,
    reqBodyIsFormData,
  }
}
// 低版本有可能有重复申明的请求字段类型
function filterRepeatName(arr: any[]) {
  const keys: any[] = []
  const newArr: any[] = []

  if (arr) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] && !keys.includes(arr[i].name)) {
        newArr.push(arr[i])
        keys.push(arr[i].name)
      }
    }
  }

  return newArr
}

export { versionCompatible }
