// @ts-ignore
import prettier from 'prettier';

export default async function (req: any, res: any) {
  if (req.body) {
    const data = JSON.parse(req.body || '{}')

    try {
      const c = await formatTs(data.data || '')
      await awaitTime()
      res.status(200).json({ success: true, data: c });
    } catch(err) {
      res.status(200).json({ success: false, data: data.data, message: err?.toString() });
    }
  }
}

/**
 * 代码格式化
 * @param str ts代码
 * @returns
 */
function formatTs(str: string) {
  // 空对象处理
  str = str?.replace(/\{\}/g, "Record<string, any>");

  // eslint-disable-next-line import/no-named-as-default-member
  const res = prettier.format(str, {
    parser: "typescript",
  });

  return res
}

function awaitTime(t = 500){
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, t)
  })
}