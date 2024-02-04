import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  ConfigProvider,
  Menu,
  message,
  Select,
  Spin,
  notification,
  Tabs,
  Tooltip,
  Tag,
} from "antd";
import Head from "next/head";
import zhCN from "antd/locale/zh_CN";
import style from "../style";
import { transform, wordFirstBig } from "../utils/transorm";
// @ts-ignore
import { CopyToClipboard } from "react-copy-to-clipboard";
import CodeView from "react-ace";
import "ace-builds/src-noconflict/theme-kuroir";
import "ace-builds/src-noconflict/mode-typescript";
import useDeepCompareEffect from "use-deep-compare-effect";
import { apiDemo } from "../utils/api-demo-string";
import Header from "../components/header";
import { IData } from "../types";
import LeftSetting from "../components/leftSetting";
import { createMock } from "../utils/mock";
import Footer from "../components/footer";

const defaultData = {
  options: [
    {
      url: "http://121.43.101.170:30002/swagger/docs/v1/UFX.SCM.Cloud.LowCodeCenter",
      title: "Demo xxxx",
    },
  ],
  current: undefined,
  currentUrl: "",
};

message.config({ top: 250 });

export default function () {
  const [data, setData] = useState<IData>(defaultData);
  const [openkey, setOpenkey] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("1");

  useEffect(() => {
    let d = localStorage.getItem("DATA");
    d = d ? JSON.parse(d || "{}") : defaultData;

    setData(d as any);
    setTimeout(() => {
      setLoading(false);
    }, 700);
  }, []);

  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (hash && data.current) {
      setSelectedKey(hash);
      const apis = data.current.paths[hash];
      if (apis) {
        const apiItem = apis[Object.keys(apis)[0]];
        if (apiItem.tags) {
          setOpenkey(apiItem.tags[0]);
        }
      }
    }
  }, [data.current]);

  const parseTs = async (m = {} as any) => {
    const c: IData = JSON.parse(JSON.stringify(data));
    const apis = data.current.paths[selectedKey];
    if (!apis) return
    setLoading(true);

    return transform(data.current, selectedKey.split(","), m).then(
      async (res) => {
        // @ts-ignore
        try {
          const formatRes = await fetch(`/api/format-code`, {
            method: "post",
            body: JSON.stringify(res),
          })
            .then((res) => res.text())
            .then((res) => JSON.parse(res));

          if (!formatRes.success) notification.error({ message: "格式化失败" });

          res.codes = formatRes.data.codes;
          res.requestCodes = formatRes.data.requestCodes;

          const method = m[selectedKey] || Object.keys(apis)[0];
          const apiItem = data.current.paths[selectedKey][method];
          c.currentApi = {
            code: res?.codes || "",
            requestCodes: res?.requestCodes || "",
            url: selectedKey,
            desc: apiItem.summary,
            method: method,
            methods: Object.keys(apis),
            moduleName: apiItem.tags[0],
            // @ts-ignore
            requestExtraInfo: res.requestExtraInfo?.[selectedKey],
          };

          setData(c);
          localStorage.setItem("DATA", JSON.stringify(c));
        } catch (err: any) {
          console.info(err)
          notification.error({
            message: `格式化错误${err?.msg || ""}`,
            description: `格式化错误${err?.message || ""}`,
          });
        } finally {
          setLoading(false);
        }
      }
    );
  };

  useDeepCompareEffect(() => {
    if (selectedKey) {
      parseTs({});
      setTab('1')
    }
  }, [[selectedKey], data.current]);

  const fetchService = async (currentUrl: string) => {
    setLoading(true);
    let c: IData = JSON.parse(JSON.stringify(data));
    const res: any = await fetch(
      `/api/swagger-json?url=${encodeURIComponent(currentUrl)}`
    )
      .then((res) => res.text())
      .then((res) => JSON.parse(res));
    if (res.success) {
      if (currentUrl !== data.currentUrl) {
        setSelectedKey("");
        window.location.hash = "";
        c.currentApi = undefined;
      }
      c.current = res.data;
      c.currentUrl = currentUrl;
      setData(c);
      localStorage.setItem("DATA", JSON.stringify(c));
    } else {
      notification.error({
        message: "swaggerJson请求错误",
        description: res?.message,
      });
    }
    setLoading(false);
  };

  const menus = useMemo(() => {
    const res: any = [];
    if (data?.current) {
      data?.current?.tags?.map((item: any) => {
        const d: any = {};
        d.key = item.name;
        d.label = item.name;
        d.children = [];
        for (const k in data.current.paths) {
          const apis = data.current.paths[k];
          const apiItem = apis[Object.keys(apis)[0]];
          if (apiItem.tags.includes(item.name)) {
            d.children.push({
              key: k,
              label: k,
            });
          }
        }
        res.push(d);
      });
    }

    return res;
  }, [data?.current]);

  const currentRequestCodes = useMemo(() => {
    if (!data.currentApi?.requestExtraInfo || !data.currentApi?.requestCodes) {
      return "";
    }

    return removeUndefinedReqTypes(
      data.currentApi?.requestCodes,
      data.currentApi?.requestExtraInfo?.reqTypes
    );
  }, [data.currentApi]);

  const codesByTab = useMemo(() => {
    return {
      "1": data.currentApi?.code,
      "2": currentRequestCodes,
      "3": data.currentApi?.responseJson
    }[tab]
  }, [data, currentRequestCodes, tab])

  const tabChange = async (e: string, unset?: boolean) => {
    if (!unset) setTab(e)
    if (e === '3') {
      return new Promise(async resolve => {
        setLoading(true)
        // @ts-ignore
        const responseJson = createMock(data.current, data.current?.paths[data?.currentApi?.url]?.[data?.currentApi?.method || ''])
        const formatRes = await fetch(`/api/format-code`, {
          method: "post",
          body: JSON.stringify({ responseJson }),
        })
          .then((res) => res.text())
          .then((res) => JSON.parse(res));
          let c: IData = JSON.parse(JSON.stringify(data));
          setLoading(false)
        if (c.currentApi) {
          c.currentApi.responseJson = formatRes?.data.responseJson
  
          setData(c)
          resolve(formatRes?.data.responseJson)
        }
      })
    }
  }

  const openMock = async () => {
    const responseJson = await tabChange('3', true)
    window.open(`/api/mock?data=${responseJson || '{}'}`)
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#8bbe25",
        },
      }}
    >
      {/** 页面头部 */}
      <Header
        loading={loading}
        reload={fetchService}
        setData={setData}
        onChange={(e) => setSelectedKey(e)}
        data={data}
      />

      {/** 页面头部 */}
      <LeftSetting data={data} parseTs={parseTs} />

      {/** 页面空数据 */}
      {!data?.current && (
        <div className="page-empty">
          <svg fill="#cbdaad" viewBox="0 0 1024 1024" width="150" height="150">
            <path d="M745.3 0H278.7c-52.3 0-99.4 31.9-118.8 80.5L4.6 468.6c-3 7.6-4.6 15.6-4.6 23.8V960c0 35.3 28.7 64 64 64h896c35.3 0 64-28.7 64-64V492.3c0-8.1-1.6-16.2-4.6-23.8l-155.2-388C844.7 31.9 797.7 0 745.3 0zM278.7 64h466.7c26.2 0 49.7 15.9 59.4 40.2L946.3 458c4.2 10.5-3.5 21.9-14.9 21.9H755.6c-13.8 0-26 8.8-30.4 21.9l-14 42.1-14 42.1c-4.4 13.1-16.6 21.9-30.4 21.9H357.2c-13.8 0-26-8.8-30.4-21.9l-14-42.1-14-42.1c-4.4-13.1-16.6-21.9-30.4-21.9H92.6c-11.3 0-19.1-11.4-14.9-21.9l141.5-353.8C229 79.9 252.5 64 278.7 64zM928 960H96c-17.7 0-32-14.3-32-32V576c0-17.7 14.3-32 32-32h143.6c3.4 0 6.5 2.2 7.6 5.5l26.3 78.8c8.7 26.1 33.2 43.8 60.7 43.8h355.7c27.5 0 52-17.6 60.7-43.8l26.3-78.8c1.1-3.3 4.1-5.5 7.6-5.5H928c17.7 0 32 14.3 32 32v352c0 17.7-14.3 32-32 32z"></path>
          </svg>
          <span className="desc">请添加/选择swagger服务</span>
        </div>
      )}

      {/** swagger内容主体 */}
      {data?.current && (
        <div className="main">
          <div className="menu">
            <Menu
              inlineIndent={20}
              style={{ height: "calc(100vh - 46px)" }}
              openKeys={openkey ? [openkey] : []}
              selectedKeys={selectedKey ? [selectedKey] : []}
              items={menus}
              theme="light"
              mode="inline"
              onOpenChange={(e) => setOpenkey(e[e.length - 1] || "")}
              onSelect={(e) => {
                setSelectedKey(e.key);
                window.location.hash = e.key;
              }}
            />
          </div>
          {data.currentApi ? (
            <div className="api-content">
              <div className="api-info">
                <div className="info-title">{data.currentApi?.desc}</div>
                <div className="info-row">
                  <div className="info-l">请求路径:</div>
                  <div 
                    className="info-r" 
                    style={{ color: '#8bbe25', textDecoration: 'underline', cursor: 'pointer' }} 
                    onClick={openMock}
                  >
                      {data.currentApi?.url}
                  </div>
                  <Select
                    style={{ width: 120, marginLeft: 20 }}
                    size="small"
                    value={data.currentApi?.method}
                    onChange={(v) =>
                      parseTs({
                        [data.currentApi?.url || ""]: v,
                      })
                    }
                  >
                    {data.currentApi?.methods?.map((item) => (
                      <Select.Option key={item} value={item}>
                        {item}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                <div className="info-row">
                  <div className="info-l">请求参数类型:</div>
                  <div className="info-r">
                    {data.currentApi.requestExtraInfo?.reqTypes?.map(
                      (it: string) => <Tag key={it}>{it}</Tag>
                    )}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-l">content-type:</div>
                  <div className="info-r">
                    {data.currentApi.requestExtraInfo?.reqBodyIsFormData
                      ? "multipart/form-data"
                      : "application/json"}
                  </div>
                </div>
              </div>
              <Tabs
                activeKey={tab}
                onChange={tabChange}
                items={[
                  {
                    key: "1",
                    label: "请求类型",
                  },
                  {
                    key: "2",
                    label: "请求方法",
                  },
                  {
                    key: "3",
                    label: "响应Demo",
                  },
                ]}
              />
              <div className="code-box">
                <Tooltip title="封装的Api请求方法推荐">
                  <span className="api-demo-btn" onClick={showRequestDemo}>
                    api
                  </span>
                </Tooltip>
                <CopyToClipboard
                  text={codesByTab || ''}
                  onCopy={() => {
                    message.success({
                      content: "已复制",
                    });
                  }}
                >
                  <svg
                    className="copy-icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="16639"
                    width="15"
                    height="15"
                  >
                    <path
                      fill="#777"
                      d="M896 810.666667l-128 0c-23.466667 0-42.666667-19.2-42.666667-42.666667 0-23.466667 19.2-42.666667 42.666667-42.666667l106.666667 0c12.8 0 21.333333-8.533333 21.333333-21.333333L896 106.666667c0-12.8-8.533333-21.333333-21.333333-21.333333L448 85.333333c-12.8 0-21.333333 8.533333-21.333333 21.333333l0 21.333333c0 23.466667-19.2 42.666667-42.666667 42.666667-23.466667 0-42.666667-19.2-42.666667-42.666667L341.333333 85.333333c0-46.933333 38.4-85.333333 85.333333-85.333333l469.333333 0c46.933333 0 85.333333 38.4 85.333333 85.333333l0 640C981.333333 772.266667 942.933333 810.666667 896 810.666667zM682.666667 298.666667l0 640c0 46.933333-38.4 85.333333-85.333333 85.333333L128 1024c-46.933333 0-85.333333-38.4-85.333333-85.333333L42.666667 298.666667c0-46.933333 38.4-85.333333 85.333333-85.333333l469.333333 0C644.266667 213.333333 682.666667 251.733333 682.666667 298.666667zM576 298.666667 149.333333 298.666667c-12.8 0-21.333333 8.533333-21.333333 21.333333l0 597.333333c0 12.8 8.533333 21.333333 21.333333 21.333333l426.666667 0c12.8 0 21.333333-8.533333 21.333333-21.333333L597.333333 320C597.333333 307.2 588.8 298.666667 576 298.666667z"
                      p-id="16640"
                    ></path>
                  </svg>
                </CopyToClipboard>
                <CodeView
                  mode="typescript"
                  theme="kuroir"
                  name="blah2"
                  height="calc(100vh - 270px)"
                  width="800px"
                  fontSize={13}
                  readOnly
                  showGutter={true}
                  value={codesByTab || ''}
                  setOptions={{
                    enableBasicAutocompletion: false,
                    enableLiveAutocompletion: false,
                    enableSnippets: false,
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="page-empty" style={{ flex: 1 }}>
              <svg
                fill="#cbdaad"
                viewBox="0 0 1024 1024"
                width="140"
                height="140"
              >
                <path
                  d="M745.3 0H278.7c-52.3 0-99.4 31.9-118.8 80.5L4.6 468.6c-3 7.6-4.6 15.6-4.6 23.8V960c0 35.3 28.7 64 64 64h896c35.3 0 64-28.7 64-64V492.3c0-8.1-1.6-16.2-4.6-23.8l-155.2-388C844.7 31.9 797.7 0 745.3 0zM278.7 64h466.7c26.2 0 49.7 15.9 59.4 40.2L946.3 458c4.2 10.5-3.5 21.9-14.9 21.9H755.6c-13.8 0-26 8.8-30.4 21.9l-14 42.1-14 42.1c-4.4 13.1-16.6 21.9-30.4 21.9H357.2c-13.8 0-26-8.8-30.4-21.9l-14-42.1-14-42.1c-4.4-13.1-16.6-21.9-30.4-21.9H92.6c-11.3 0-19.1-11.4-14.9-21.9l141.5-353.8C229 79.9 252.5 64 278.7 64zM928 960H96c-17.7 0-32-14.3-32-32V576c0-17.7 14.3-32 32-32h143.6c3.4 0 6.5 2.2 7.6 5.5l26.3 78.8c8.7 26.1 33.2 43.8 60.7 43.8h355.7c27.5 0 52-17.6 60.7-43.8l26.3-78.8c1.1-3.3 4.1-5.5 7.6-5.5H928c17.7 0 32 14.3 32 32v352c0 17.7-14.3 32-32 32z"
                  p-id="13839"
                ></path>
              </svg>
              <span className="desc">待选择接口</span>
            </div>
          )}
        </div>
      )}

      <Footer />

      <style jsx global>
        {style}
      </style>
      
      {loading && (
        <div className="loading-box">
          <div className="mask"></div>
          <Spin size="large" className="loading" />
        </div>
      )}
      <Head>
        <title>个人接口开发工具</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </ConfigProvider>
  );
}

function showRequestDemo() {
  Modal.confirm({
    footer: null,
    title: "api封装推荐",
    maskClosable: true,
    width: 1100,
    style: { top: 20 },
    content: (
      <div className="code-box">
        <CopyToClipboard
          text={apiDemo || ""}
          onCopy={() => {
            message.success({
              content: "已复制",
            });
          }}
        >
          <svg
            className="copy-icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="16639"
            width="15"
            height="15"
          >
            <path
              fill="#777"
              d="M896 810.666667l-128 0c-23.466667 0-42.666667-19.2-42.666667-42.666667 0-23.466667 19.2-42.666667 42.666667-42.666667l106.666667 0c12.8 0 21.333333-8.533333 21.333333-21.333333L896 106.666667c0-12.8-8.533333-21.333333-21.333333-21.333333L448 85.333333c-12.8 0-21.333333 8.533333-21.333333 21.333333l0 21.333333c0 23.466667-19.2 42.666667-42.666667 42.666667-23.466667 0-42.666667-19.2-42.666667-42.666667L341.333333 85.333333c0-46.933333 38.4-85.333333 85.333333-85.333333l469.333333 0c46.933333 0 85.333333 38.4 85.333333 85.333333l0 640C981.333333 772.266667 942.933333 810.666667 896 810.666667zM682.666667 298.666667l0 640c0 46.933333-38.4 85.333333-85.333333 85.333333L128 1024c-46.933333 0-85.333333-38.4-85.333333-85.333333L42.666667 298.666667c0-46.933333 38.4-85.333333 85.333333-85.333333l469.333333 0C644.266667 213.333333 682.666667 251.733333 682.666667 298.666667zM576 298.666667 149.333333 298.666667c-12.8 0-21.333333 8.533333-21.333333 21.333333l0 597.333333c0 12.8 8.533333 21.333333 21.333333 21.333333l426.666667 0c12.8 0 21.333333-8.533333 21.333333-21.333333L597.333333 320C597.333333 307.2 588.8 298.666667 576 298.666667z"
              p-id="16640"
            ></path>
          </svg>
        </CopyToClipboard>
        <CodeView
          mode="typescript"
          theme="kuroir"
          name="blah2"
          height="560px"
          width="1000px"
          fontSize={13}
          showGutter={true}
          readOnly
          value={apiDemo}
        />
      </div>
    ),
  });
}

function removeUndefinedReqTypes(codes: string, types: string[]) {
  let codesArr = codes.split("\n");

  ["path", "body", "query"].forEach((item: string) => {
    if (types?.indexOf(item) < 0) {
      let index = -1;
      // 找到第一个引用的参数
      codesArr.map((it, i) => {
        if (it.includes(`["request${wordFirstBig(item)}"]`) && index < 0) {
          index = i;
        }
      });
      codesArr.splice(index, 1);
    }
  });

  return codesArr.join("\n");
}
