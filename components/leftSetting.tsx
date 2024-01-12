import { Button, Drawer } from "antd";
import { useEffect, useState } from "react";
import CodeView from "react-ace";
import { template } from "../utils/request-template";
import { IData } from "../types";

type Props = {
  data: IData
  parseTs: any
}

export default function LeftSetting(props: Props) {
  const { data, parseTs } = props

  const [open, setOpen] = useState(false);
  const [requestTemplate, setRequestTemplate] = useState(template);
  const [requestTemplateUed, setRequestTemplateUed] = useState(template);

  useEffect(() => {
    setRequestTemplate(localStorage.getItem("REQUEST_TEMPLATE") || template);
    setRequestTemplateUed(localStorage.getItem("REQUEST_TEMPLATE") || template);
  }, []);

  const onSaveTemp = () => {
    setRequestTemplateUed(requestTemplate);
    localStorage.setItem("REQUEST_TEMPLATE", requestTemplate);
    setOpen(false);
    if (data.currentApi) {
      parseTs({});
    }
  };

  return (
    <>
      <Drawer
        title="请求方法模版设置"
        open={open}
        width={800}
        onClose={() => setOpen(false)}
        style={{ position: "relative" }}
      >
        修改下面模板字符串，合理使用$$的变量字符
        <CodeView
          mode="typescript"
          theme="kuroir"
          name="blah2"
          height="600px"
          width="700px"
          fontSize={13}
          showGutter={true}
          value={requestTemplate}
          onChange={(e) => {
            setRequestTemplate(e);
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            position: "absolute",
            bottom: 0,
            right: 0,
            padding: "16px 24px",
            width: "100%",
          }}
        >
          <Button
            style={{ marginRight: 20 }}
            onClick={() => {
              setRequestTemplate(template);
            }}
          >
            重置
          </Button>
          <Button type="primary" onClick={onSaveTemp}>
            保存
          </Button>
        </div>
      </Drawer>

      <svg
        onClick={() => {
          setOpen(true);
          setRequestTemplate(requestTemplateUed);
        }}
        style={{ position: "fixed", right: -20, top: "46%", cursor: "pointer" }}
        viewBox="0 0 1024 1024"
        width="40"
        height="40"
      >
        <path
          d="M967.882752 603.308032c26.207232-104.832-2.62144-173.251584-2.62144-173.251584l-100.272128-4.922368c-8.786944-31.470592-21.655552-61.147136-38.00576-88.600576l67.64544-76.797952c-55.595008-92.654592-124.363776-120.651776-124.363776-120.651776l-74.48064 67.513344c-27.746304-16.140288-57.759744-28.643328-89.506816-37.108736l-6.390784-100.893696c-104.827904-26.211328-173.251584 2.625536-173.251584 2.625536l-4.7616 96.979968c-31.289344 7.86432-61.060096 19.470336-88.580096 34.787328l-70.501376-63.904768c0 0-68.768768 27.997184-124.363776 120.651776 17.671168 20.058112 52.43904 43.088896 54.524928 72.580096 0.514048 7.28064-33.462272 93.239296-34.927616 93.313024l-90.230784 4.427776c0 0-28.828672 68.41856-2.625536 173.251584l89.423872 5.666816c8.444928 35.557376 21.997568 69.04832 39.94112 99.762176l-58.875904 64.949248c0 0 27.997184 68.768768 120.651776 124.363776l67.101696-59.101184c30.400512 18.198528 63.587328 32.063488 98.861056 40.890368l4.36224 88.844288c0 0 68.422656 28.832768 173.251584 2.625536l5.876736-92.72832c35.72224-9.469952 69.250048-24.103936 99.827712-43.199488l71.151616 62.669824c92.658688-55.590912 120.655872-124.363776 120.655872-124.363776l-64.81408-71.501824c15.968256-28.69248 27.952128-59.809792 35.791872-92.572672L967.882752 603.308032zM516.528128 735.343616c-118.956032 0-215.389184-96.433152-215.389184-215.39328 0-118.956032 96.433152-215.389184 215.389184-215.389184s215.39328 96.433152 215.39328 215.389184C731.921408 638.911488 635.48416 735.343616 516.528128 735.343616z"
          fill="#8bbe25"
          p-id="7163"
        ></path>
      </svg>
    </>
  );
}
