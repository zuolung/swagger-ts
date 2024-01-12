// @ts-ignore
import prettier from 'prettier';
import { NextApiResponse } from 'next'
// 转一下
export default async function (req: any, res: NextApiResponse) {
  if (req.query) {

    res.setHeader('Content-type', 'text/plain; charset=utf-8')

    const mockData = await prettier.format(req.query.data, {
      semi: false,
      parser: "json",
    });

    res.status(200).end(mockData);
  }
}