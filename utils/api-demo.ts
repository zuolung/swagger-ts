import lodash from 'lodash'

type Options = {
  method: "GET" | "POST" | "DELETE" | "PUT" | "get" | "post" | "delete" | "put",
  requestKeys: {
    inPath?: string[],        // params在url上的属性集合如/{id}
    inQuery?: string[],       // params在query上的属性集合
    inFormData?: string[],    // params在formData上的属性集合
    inBody?: string[],        // params在body上的属性集合
  }
}

export default function Api<T extends Record<string, any>, TRes>(
  url: string,
  params: T,
  options: Options
): Promise<TRes> {
  const { method, requestKeys } = options
  const queryParams = lodash.pick(params, requestKeys?.inQuery || [])
  const bodyParams = lodash.pick(params, requestKeys?.inBody || [])
  const formDataParams = lodash.pick(params, requestKeys?.inFormData || [])  as any

  requestKeys?.inPath?.forEach(p => {
    // @ts-ignore
    url = url.replace(`{${p}}`, params[p])
  })

  const res = fetch(method == "GET" ? url : getNewUrl(url, queryParams), {
    method: method,
    body: method == "GET" ? null : (requestKeys?.inFormData ? formDataParams : JSON.stringify(bodyParams)),
    headers: {
      'Content-Type': requestKeys?.inFormData ? 'multipart/form-data' :  'application/json'
    }
  }).then((res) => {
    return res.json();
  });

  return res;
}

function getNewUrl(url: string, params: any) {
  let res = url;
  const keys = Object.keys(params);
  keys.map((k, i) => {
    const data = encodeURIComponent(params[k]);
    if (i === 0) {
      res += "?";
      res += `${k}=${data}`;
    } else if (i < keys.length) {
      res += `&${k}=${data}`;
    } else {
      res += `${k}=${data}`;
    }
  });

  return res;
}