export const apiDemo = `import lodash from 'lodash'

// 符合restfullApi标准的可以不考虑requestKeys参数
type Options = {
  method: "GET" | "POST" | "DELETE" | "PUT" | "get" | "post" | "delete" | "put",
  paramsFormData?: boolean
}

export default function Api<TRes>(
  url: string,
  params: {
    inbody?: unknown
    inPath?: unknown
    inQuery?: unknown
  },
  options: Options
): Promise<TRes> {
  const { paramsFormData, method } = options
  const { inPath = {}, inQuery = {}, inbody = undefined } = params

  Object.keys(inPath || {})?.forEach(p => {
    // @ts-ignore 替换如：{id}
    url = url.replace(\`{\${p}}\`, inPath[p])
  })

  const res = fetch(method == "GET" ? url : getNewUrl(url, inQuery), {
    method: method,
    body: paramsFormData ? createFormData(inbody || {}) :  JSON.stringify(inbody || {}),
    headers: {
      'Content-Type': paramsFormData ? 'multipart/form-data' :  'application/json'
    }
  }).then((res) => {
    return res.json();
  });

  return res;
}

function createFormData (inbody: any) {
  const data = new FormData()
  for (const key in inbody) {
    data.append(key, inbody[key])
  }

  return data
}

function getNewUrl(url: string, params: any) {
  let res = url;
  const keys = Object.keys(params);
  keys.map((k, i) => {
    const data = encodeURIComponent(params[k]);
    if (i === 0) {
      res += "?";
      res += \`\${k}=\${data}\`;
    } else if (i < keys.length) {
      res += \`&\${k}=\${data}\`;
    } else {
      res += \`\${k}=\${data}\`;
    }
  });

  return res;
}`