/**
 * 删除表单数据
 * @url /api/lowcodecenter/form-struct-data
 * @method delete
 * @requestFrom body,query
 */
export type ApiLowcodecenterFormstructdata = {
  requestBody: string[];

  requestQuery: {
    formId: string;
  };

  response: {
    message: string | null;
    msg: string | null;
    code: number;
    error: {
      code: string | null;
      message: string | null;
      details: string | null;
      data: Record<string, any>;
      validationErrors:
        | {
            message: string | null;
            members: string[] | null;
          }[]
        | null;
    };
  };
};