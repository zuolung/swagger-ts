import { pinyin } from "pinyin-pro";
import { versionCompatible } from "./common";
import { template } from "./request-template";

const defKeySpecialMark = "__@#_#@"; // definitions引用标识后缀，方便代码字符的replace
let i = 0;

let suffixCodes = '' // 递归引用或者多次调用的类型的类型的代码 
let hasDefinationKeys: string[] = []

/**
 * 转换defination中的Ts代码
 * @param definitions 所有definitions
 * @param deps 当前接口引用的definitions
 * @param codes 接口当前转换的代码
 */
function createSwaggerBaseType(
  definitions: { [x: string]: any },
  deps: string[],
  codes: string
) {
  const allFormatDefKeys = Object.keys(definitions);
  let deps_ = [...new Set(deps)];
  let hasReplacedCodesBefore: Record<string, string> = {}
  let depsStack = []
  let level = 0
  while (deps_?.length && i < 20) {
    level++
    let nextDeps: string[] = []
    for (let i = 0; i < deps_.length; i++) {
      const it = deps_[i]

      const def = definitions[it];
      const parseResult = parseDef(def);
      // 替换基类中没有的引用
      parseResult.dependencies?.forEach((d) => {
        if (!allFormatDefKeys.includes(d)) {
          parseResult.codes = parseResult.codes.replace(d, "any");
        }
      });

      const reg = new RegExp(it, "g");
      const defKey = resetDefName(it.replace(defKeySpecialMark, ''))

      if (!hasReplacedCodesBefore[it]) {
        hasReplacedCodesBefore[it] = codes
        if (hasDefinationKeys.includes(it)) {
          codes = codes.replace(reg, defKey);
        } else {
          codes = codes.replace(reg, parseResult.codes);
          nextDeps = nextDeps.concat(parseResult.dependencies)
        }

      } else {
        codes = hasReplacedCodesBefore[it]
        codes = codes.replace(reg, defKey);
        parseResult.codes = parseResult.codes.replace(reg, defKey);
        let d = depsStack.filter(arr => arr.includes(it))?.[0] || []
        nextDeps = d.filter(item => item !== it) || []
        hasReplacedCodesBefore = {}
        hasDefinationKeys.push(it)

        suffixCodes += `\n export type ${defKey} = ${createSwaggerBaseType(
          definitions, parseResult.dependencies, parseResult.codes)} \n`
      }
    }
    depsStack.push(deps_)

    deps_ = [...new Set(nextDeps)]
  }

  codes = codes.replace(/\n\[\]/g, '[]')

  return codes;
}
/**
 * 倒数第一个驼峰字符串
 */
function resetDefName(str: string) {
  let bCount = 0
  let newStr = ''
  for (let i = str.length - 1; i >=0; i--) {
      if (bCount < 4) {
        newStr = str[i] + newStr
      }
      if (/[A-Z]/.test(str[i])) {
        bCount += 1
      }
  }

  return newStr
}

/**
 *
 * @param data swagger数据
 * @param apiUrls 需要哪些接口
 * @param map 是否有接口指定了请求方法
 */
export async function transform(
  data: Record<string, any>,
  apiUrls?: string[],
  map?: Record<string, string>
) {
  // 使用到的接口的描述集合
  const result = {
    codes: "",
    requestCodes: "",
  };
  suffixCodes = ''
  const { definitions } = versionCompatible({
    data: data,
  });
  const paths = data["paths"];

  const _map = map || {};
  let apiInfos = []

  for (const key in paths) {
    if (apiUrls && !apiUrls.includes(key)) continue;
    const method = _map[key] || (Object.keys(paths[key])[0] as string);
    const item = paths[key][method];
    // 请求数据拼装
    let reqCodes = "";

    let parameters: any = versionCompatible({
      requestParams: item,
      data: data,
    }).pathsRequestParams;

    let reqDeps: any[] = [];
    let $$inPath: string[] = []
    let $$inQuery: string[] = []
    let $$inFormData: string[] = []

    // // restfulApi请求参数规则
    if (Array.isArray(parameters)) {
      for (const km in parameters) {
        let it = parameters[km];
        if (!['header', 'cookie'].includes(it.in) && !it.name?.includes('[0].')) {
          let name = it.name;
          if (it.in === 'path')  $$inPath.push(`"${it.name}"`)
          if (it.in === 'query')  $$inQuery.push(`"${it.name}"`)
          if (it.in === 'formData')  $$inFormData.push(`"${it.name}"`)
          if (it.in === "body" && parameters.length === 1) {
            it = it.schema;
            name = "";
          }
          const { codes, dependencies } = parseDef(it, name);
          reqCodes += `${codes}`;
          reqDeps = reqDeps.concat(dependencies);
        }
      }
    } else {
      const { codes, dependencies } = parseDef(parameters);
      reqCodes += `${codes}`;
      reqDeps = reqDeps.concat(dependencies);
    }

    if (reqCodes.includes(":")) {
      reqCodes = `{
          ${reqCodes}
        }`;
    }

    if (!reqCodes) reqCodes = "undefined \n";

    reqCodes = createSwaggerBaseType(definitions, reqDeps, reqCodes);

    // 响应数据拼装
    let resCodes = ``;
    const responseItem = versionCompatible({
      responseData: item,
      data: data,
    }).pathsResponseData;

    if (
      responseItem &&
      responseItem?.schema &&
      (responseItem?.schema?.type === "object" || responseItem?.schema.$ref)
    ) {
      const schema = responseItem;
      const resParseResult = parseDef(schema);
      resCodes += resParseResult.codes;

      resCodes = createSwaggerBaseType(
        definitions,
        resParseResult.dependencies || [],
        resCodes || "undefined"
      );
    } else {
      resCodes = "undefined";
    }


    let defKey = responseItem?.schema?.$ref
      ?.replace("#/components/schemas/", "")
      ?.replace("#/definitions/", "");
    let hasResponseData = false;
    defKey = formatBaseTypeKey(defKey)

    if (defKey) {
      // @ts-ignore
      const responseData = definitions[defKey];
      if (responseData?.type === "object" && responseData?.properties?.data) {
        hasResponseData = true;
      }
    }

    console.info($$inPath, $$inQuery)

    const typeName = getRequestTypeName(key);
    apiInfos.push({
      url: key,
      name: typeName,
      desc: item.summary,
      method: method,
      reponseFromData: hasResponseData ? `${typeName}['data']` : "undefined",
      inFormData: $$inFormData,
      inPath: $$inPath,
      inQuery: $$inQuery,
    })

    result.codes += `
    /**
     * ${item.summary || "--"}
     * @url ${key}
     * @method ${method}
     */
    export type ${typeName} = {
      request: ${reqCodes}
      response: ${resCodes}
    }
    `;
  }

  result.codes += suffixCodes

  if (apiInfos.length) {
    apiInfos.forEach(it => {
      result.requestCodes += template.replace('$$importTypes', it.name)
      .replace('$$description', it.desc)
      .replace('$$requestName', 'Api' + it.name)
      .replace(/\$\$importTypes/g, it.name)
      .replace('$$url', it.url)
      .replace('$$method', it.method)
      .replace('$$inFormData', `[${it.inFormData.join(',')}]`)
      .replace('$$inPath', `[${it.inPath.join(',')}]`)
      .replace('$$inQuery', `[${it.inQuery.join(',')}]`)
    })
  }

  return result;
}
/**
 *
 * @param key
 * @param required
 * @param requireArr
 * @returns
 */
function ifNotRequired(
  key: string | undefined,
  required: boolean,
  requireArr: string | any[] | undefined,
  level: number
) {
  if (required === false) return true;
  if (requireArr && requireArr?.length && !(requireArr?.includes(key || "") && level === 1))
    return true;

  return false;
}
/**
 *
 * @param def 字段描述的数据
 * @param kk 字段的key
 * @returns
 */
function parseDef(def: Record<string, any>, kk?: string) {
  const dependencies: any[] = [];
  const result = workUnit(def, kk, false, def.required);
  let level = 0
  /**
   *
   * @param data 字段描述数据
   * @param key  字段名称
   * @param noMark 后续是否不需要换行
   * @param requiredArr 必填字段有哪些
   * @returns string
   */
  function workUnit(
    data: Record<string, any>,
    key?: string,
    noMark?: boolean,
    requiredArr?: string[]
  ) {
    level = 1
    if (key && key.includes(".")) return "";
    // 中文作为字段名的时候，移除无效字符
    if (key && key.match(/[\u4e00-\u9fa5]/g)) {
      key = key.replace(/[\.\,\，\.\-\*\\\/]/g, "");
    }
    const noRequired = ifNotRequired(key, data.required, requiredArr, level)
      ? "?"
      : "";
    const ifNull = data?.nullable === true ? " | null" : "";

    let res = "";
    if (data.type && isBaseType(data.type)) {
      let type__ = resetTypeName(data.type);
      let $value = "";
      const $description = data.description;
      if (key) {
        if (type__ === "string" || type__ === "number") {
          if (data.default) $value = data.default;
          if (data.enum)
            $value = `[${data.enum
              .map((it: string | string[]) => {
                if (!it.includes(`'`) && !it.includes(`"`)) return `"${it}"`;
                return it;
              })
              .join(",")}]`;
          if (data.format === "date-time") {
            $value = `#datetime()`;
          }
        }

        // 枚举数据处理
        if ((type__ === "string" || type__ === "number") && data.enum) {
          type__ = `(${data.enum
            .map((item: any, i: number) => {
              if (i !== data.enum.length - 1) {
                return `"${item}" |`;
              } else {
                return `"${item}"`;
              }
            })
            .join("")})`;
        }

        const commentsParams: Record<string, any> = {};
        if ($description) commentsParams["description"] = $description;

        const comments = createComments(commentsParams);

        return `${comments}${key}${noRequired}:${type__}${ifNull}${
          noMark ? "" : " \n"
        }`;
      } else return type__;
    } else if (data.type === "object" || data.schema?.type === "object") {
      const properties = data.properties || data.schema?.properties;
      const curRequiredArr =
        data.required && Array.isArray(data.required) ? data.required : [];

      if (!properties) {
        if (
          !data.additionalProperties ||
          JSON.stringify(data.additionalProperties) === "{}"
        ) {
          if (key) {
            res = `${key}${noRequired}:{}${noMark ? "" : "\n"}`;
          } else {
            res = `{}${noMark ? "" : "\n"}`;
          }
        } else {
          const nextWork = workUnit(
            data.additionalProperties,
            undefined,
            undefined,
            curRequiredArr
          );
          if (key) {
            res = `${key}${noRequired}:Record<string, ${nextWork || "null"}>${
              noMark ? "" : "\n"
            }`;
          } else {
            res = `Record<string, ${nextWork}>${noMark ? "" : "\n"}`;
          }
        }
      } else {
        if (!key) res += `{ \n `;

        for (const kk in properties) {
          const item = properties[kk];
          res += workUnit(item, kk, undefined, curRequiredArr);
        }

        if (!key) res += `} ${noMark ? "" : "\n"}`;
      }
    } else if (data.type === "array" || data.schema?.type === "array") {
      const type__ = data.type || data.schema?.type || {};
      const items__ = data.items || data.schema?.items || {};
      if (Object.keys(items__).length === 0) {
        res += `${key}${noRequired}:any[] ${noMark ? "" : "\n"}  `;
      } else {
        if (type__ && isBaseType(type__)) {
          res += workUnit(
            {
              ...items__,
              description: data.description,
              required: data.required,
            },
            key,
            true,
            data.required
          );
        } else if (items__ && !isBaseType(type__)) {
          if (items__.properties) res += `{ \n `;
          res += workUnit(
            {
              ...items__,
              description: data.description,
              required: data.required,
              rule: 2,
            },
            key,
            true,
            data.required
          );
          if (items__.properties) res += `} ${noMark ? "" : "\n"}`;
        } else if (data.items?.$ref) {
          const $ref = formatBaseTypeKey(data.items?.$ref);
          dependencies.push($ref);
          res += workUnit({ type: $ref }, key, true);
        }
        res += `[] ${ifNull} ${noMark ? "" : "\n"} `;
      }
    } else if (data.schema?.$ref || data.$ref) {
      const commentsParams: Record<string, any> = {};
      // if (data.rule) commentsParams["value"] = data.rule;
      if (data.description) commentsParams["description"] = data.description;

      const comments = createComments(commentsParams);

      let $ref = formatBaseTypeKey(data.schema?.$ref || data?.$ref);
      if ($ref === "List") {
        $ref = "any[]";
      }
      if ($ref === "Map") {
        $ref = "Record<string, any>";
      }
      if ($ref === "Set") {
        $ref = "any[]";
      }
      dependencies.push($ref);
      return `${key ? `${comments}${key}${noRequired}:` : ""}${$ref}${ifNull}${
        noMark ? "" : " \n "
      }`;
    } else if (data.schema) {
      // v3版本兼容
      return workUnit(data.schema, key);
    }

    return res;
  }

  return {
    codes: result,
    dependencies: dependencies || [],
  };
}

function isBaseType(d?: string) {
  return !["object", "array"].includes(d || "");
}
/**
 * 映射新的基础类型名称
 * @param type
 * @returns
 */
function resetTypeName(type: string) {
  if (type === "file") return "string";
  if (type === "integer") return "number";
  if (type === "ref") return "string";
  return type;
}

function getRequestTypeName(url: string) {
  const arrUrl = url.split("/").map((item: string) => {
    // 防止使用 a/${xxId}/abc
    return item.replace("{", "").replace("}", "");
  });

  if (arrUrl.length > 1) {
    let n = "";
    for (let i = 0; i <= arrUrl.length; i++) {
      if (arrUrl[i]) {
        n += wordFirstBig(arrUrl[i]);
      }
    }
    n = n.replace(/\-/g, "").replace(/\./g, "");

    return n;
  } else {
    return arrUrl[0];
  }
}

export function wordFirstBig(str: string) {
  return str.substring(0, 1).toLocaleUpperCase() + str.substring(1);
}
/**
 * 格式化引用字段名称和基础类型字段名称
 * @param key
 * @returns
 */
export function formatBaseTypeKey(key: any) {
  let res = key;
  res = res
    .replace("#/components/schemas/", "")
    .replace("#/definitions/", "")
    .replace(/\`/g, "");

  res = res
    .split("«")
    .filter((it: any) => !!it)
    .join("_")
    .split("»")
    .filter((it: any) => !!it)
    .join("_");

  res = res.replace(/[^\u4e00-\u9fa5_a-zA-Z]/g, "");
  res = pinyin(res, { toneType: "none" });
  res = res.replace(/\s/g, "");

  return wordFirstBig(res) + defKeySpecialMark;
}
/**
 * 创建注释
 * @param params
 * @returns
 */
function createComments(params?: Record<string, any>) {
  let res = "";
  if (params && Object.keys(params).length > 0) {
    res += `/**
    `;
    for (const key in params) {
      res += ` * @${key} ${(params?.[key] + "")?.replace(/\*/g, "")}
      `;
    }
    res += `*/
    `;
  }

  return res;
}
