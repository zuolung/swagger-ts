// @ts-ignore
import prettier from 'prettier';
import { NextApiResponse } from 'next'
// 转一下
export default async function (req: any, res: NextApiResponse) {
  if (req.query) {

    res.setHeader('Content-type', 'text/plain; charset=utf-8')

    const nData = req.query.data.replace(/\{\}/g, '"$Object@"').replace(/\[\]/g, '"$Array@"')

    let mockData = await prettier.format(nData, {
      semi: false,
      parser: "json",
    });

    mockData = mockData.replace(/\"\$Object\@\"/g, '{}').replace(/\"\$Array\@\"/g, '[]')

    res.status(200).end(mockData);
  }
}