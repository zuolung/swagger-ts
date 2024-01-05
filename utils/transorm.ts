import { pinyin } from "pinyin-pro";
import { versionCompatible } from "./common";

const defKeySpecialMark = '__@#_#@' // definitions引用标识后缀，方便代码字符的replace

/**
 * 过滤符合restful标准的参数类型
 * @param parameters 请求字段描述
 * @param method 请求方法
 * @returns
 */
function restfullApiParamsFilter(parameters: Record<string, any>, method: string) {
  const parametersNew = [];
  let filterMap = {
    get: "query",
    post: "body",
    put: "body",
    delete: "body",
  };
  // @ts-ignore
  let filter = filterMap[method] || "body";
  for (const key in parameters) {
    const item = parameters[key];
    if (item.in === filter) {
      parametersNew.push(item);
    }
  }

  return parametersNew;
}
let recursionKeys = [] // 需要递归，当前文件已经创建的变量
/**
 * 转换defination中的Ts代码
 * @param definitions 所有definitions
 * @param deps 当前接口引用的definitions
 * @param codes 接口当前转换的代码
 */
function createSwaggerBaseType(definitions: { [x: string]: any; }, deps: string | any[], codes: string) {
  const allFormatDefKeys = Object.keys(definitions)
  let codesCache: any[] = []
  let suffixCode = ''
  for (const key in definitions) {
    if (deps.includes(key)) {
      workNextUsed(key)
    }
  }

  function workNextUsed(key: string , parentKeys?: string[]) {
    let usedDefsKey: string[] = [].concat(parentKeys || [] as any)
    const def = definitions[key];
    const parseResult = parseDef(def);
    // 替换基类中没有的引用
    parseResult.dependencies?.forEach((d) => {
      if (!allFormatDefKeys.includes(d)) {
        parseResult.codes = parseResult.codes.replace(d, "any");
      }
    });

    // 解决递归引用问题
    if (usedDefsKey.includes(key)) {
      const index = usedDefsKey.indexOf(key)
      suffixCode += `\n export type ${key.replace(defKeySpecialMark, '')} = ${parseResult.codes} \n`
      codes = codesCache[index]
      recursionKeys.push(key)
      codesCache = []
      parseResult.dependencies?.forEach(item => {
        workNextUsed(item, usedDefsKey.splice(0, index))
      })

      return
    }
    codesCache.push(codes)
    // @ts-ignore
    deps = deps.concat(parseResult.dependencies || [])

    while (codes.includes(key)) {
      codes = codes.replace(key, parseResult.codes)
    }

    codes = codes.replace(/\n\[\]/, '[]') + suffixCode

    parseResult.dependencies?.forEach(item => {
      workNextUsed(item, [key])
    })
  }

  return codes;
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
  map?: Record<string, string>,
) {
  // 使用到的接口的描述集合
  const result = {
    codes: '',
  };
  const { definitions } = versionCompatible({
    data: data,
  });
  const paths = data["paths"];

  const _map = map || {}

  for (const key in paths) {
    if (apiUrls && !apiUrls.includes(key)) continue
    const method = _map[key] || Object.keys(paths[key])[0] as string;
    const item = paths[key][method];
    // 请求数据拼装
    let reqCodes = "";

    let parameters: Record<string, any> = versionCompatible({
      requestParams: item,
      data: data,
    }).pathsRequestParams;

    // restfulApi请求参数规则
    parameters = restfullApiParamsFilter(parameters, method);
    let reqDeps: any[] = []
    for (const km in parameters) {
      let it = parameters[km];
      let name = it.name;
      if (it.in === "body") {
        it = it.schema;
        name = "";
      }
      const { codes, dependencies } = parseDef(it, name);
      reqCodes += `${codes}`;
      reqDeps = reqDeps.concat(dependencies)
    }

    if (reqCodes.includes(":")) {
      reqCodes = `{
          ${reqCodes}
        }`;
    }

    if (!reqCodes) reqCodes = "undefined \n";

    reqCodes = createSwaggerBaseType(definitions, reqDeps, reqCodes)

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

      resCodes = createSwaggerBaseType(definitions, resParseResult.dependencies || [], resCodes)
    } else {
      resCodes = "undefined";
    }
    
    const typeName = getRequestTypeName(key);
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

  return result
}
/**
 *
 * @param key
 * @param required
 * @param requireArr
 * @returns
 */
function ifNotRequired(key: string | undefined, required: boolean, requireArr: string | any[] | undefined) {
  if (required === false) return true;
  if (requireArr && requireArr.length && !requireArr.includes(key || '')) return true;

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
  const result = workUnit(def, kk);
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
    if (key && key.includes(".")) return "";
    // 中文作为字段名的时候，移除无效字符
    if (key && key.match(/[\u4e00-\u9fa5]/g)) {
      key = key.replace(/[\.\,\，\.\-\*\\\/]/g, "");
    }
    const noRequired = ifNotRequired(key, data.required, requiredArr)
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
        if ($value) commentsParams["value"] = $value;
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
            },
            key,
            true,
            requiredArr
          );
        } else if (items__ && !isBaseType(type__)) {
          if (items__.properties) res += `{ \n `;
          res += workUnit(
            {
              ...items__,
              description: data.description,
              rule: 2,
            },
            key,
            true,
            requiredArr
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
      if (data.rule) commentsParams["value"] = data.rule;
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
