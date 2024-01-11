import Api from './api-demo'
import { ApiLowcodecenterFormstructdata } from "./types";

/**
 * @description 删除表单数据
 */
export async function ApiApiLowcodecenterFormstructdata(params: {
  inbody: ApiLowcodecenterFormstructdata["requestBody"];
  inQuery: ApiLowcodecenterFormstructdata["requestQuery"];
}) {
  return Api<ApiLowcodecenterFormstructdata["response"]>(
    `/api/lowcodecenter/form-struct-data`,
    params,
    {
      method: "delete",
    },
  );
}