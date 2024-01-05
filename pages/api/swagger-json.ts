import fetch from "node-fetch";
import * as jsonp from 'jsonc-parser'

export default async function (req: any, res: any) {
  if (req.query.url) {
    try {
      const r = await getSwagger(req.query.url)

      if (r && r.paths) {
        res.status(200).json({ success: true, data: r });
      } else {
        res.status(200).json({ success: false, message: `swagger json地址无效: ${req.query.url}` });
      }

    } catch(err) {
      res.status(200).json({ success: false, data: undefined, message: err?.toString() });
    }
  }
}

function getSwagger(url: string) {
  return fetch(url)
  .then((resp) => resp.text())
  .then((contents) => {
    contents = contents.replace(/\:\/\//g, '')
    const res = jsonp.parse(contents)
    return res
  })
}