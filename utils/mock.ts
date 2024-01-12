import { versionCompatible } from "./common";
import { formatBaseTypeKey, isBaseType } from "./transorm"
import { mock } from 'mockjs'


export function createMock(data: any, apiItem: any) {
  const { definitions, pathsResponseData } = versionCompatible({
    data: data,
    responseData: apiItem
  });

  const d = work(pathsResponseData)

  function work(data: any, kk?: string) {
    let mm: any
    const d = data?.schema?.$ref || data.$ref

    if (d) {
      const key = formatBaseTypeKey(d)
      // @ts-ignore
      const next = definitions[key]

      return work(next)
    } else if (data.type === "object" || data.schema?.type === "object") {
      const properties = data.properties || data.schema?.properties;
      if (data.example && typeof data.example === 'object') {
        return data.example
      }

      mm = {}
      if (properties) {
        for (const name in properties) {
          mm[name] = work(properties[name], name)
        }
      }

      return mm

    } else if (data.type === "array" || data.schema?.type === "array") {
      const type__ = data.type || data.schema?.type || {};
      const items__ = data.items || data.schema?.items || {};
      if (data.example && typeof Array.isArray(data.example) && data.example.length) {
        return data.example
      }
      const randomArrlength = mock("@integer(1, 3)")

      mm = []
      for (let i = 0; i < randomArrlength; i++) {
        mm.push(work(items__))
      }

      return mm
    } else if (data.type && isBaseType(data.type)) {
      if (data.enum) {
        return randomEnum(data.enum)
      }
      if (data.example) {
        return data.example
      }
      if (data.type === 'boolean') {
        if (kk === 'success') return true
        return Math.random() > 0.5 ? false : true
      }

      if (data.format === "date-time") {
        return mock('@datetime()')
      }

      if (data.type === 'string') {
        return mock('@cword(2, 3)')
      }

      if (['integer', 'float', 'double'].includes(data.type)) {
        let range = '1, 2000'
        if (data.type === 'double') data.type === 'float'
        if (data.type === 'float') {
          range = '0, 10'
        }
        return mock(`@${data.type}(${range})`)
      }

    }

  }

  console.info(d)

  return JSON.stringify(d)
}

function randomEnum(arr: any[]) {
  const ran = Math.floor(Math.random() * (arr.length - 0));

  return arr[ran];
}