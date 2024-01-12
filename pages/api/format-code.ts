// @ts-ignore
import prettier from 'prettier';

export default async function (req: any, res: any) {
  if (req.body) {
    const data = JSON.parse(req.body || '{}')

    try {
      if (data.codes) data.codes = await formatTs(data.codes || '')
      if (data.requestCodes) data.requestCodes = await formatTs(data.requestCodes || '')
      if (data.responseJson) data.responseJson = await formatTs(data.responseJson || '', 'json')
      await awaitTime()
      res.status(200).json({ success: true, data: data });
    } catch(err) {
      res.status(200).json({ success: false, data: data, message: err?.toString() });
    }
  }
}

/**
 * 代码格式化
 * @param str ts代码
 * @returns
 */
function formatTs(str: string, lang = 'typescript') {
  // 空对象处理
  str = str?.replace(/\{\}/g, "Record<string, any>");

  // eslint-disable-next-line import/no-named-as-default-member
  const res = prettier.format(str, {
    parser: lang,
  });

  return res
}

function awaitTime(t = 300){
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, t)
  })
}