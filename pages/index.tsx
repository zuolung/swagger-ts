import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  ConfigProvider,
  Input,
  Radio,
  Menu,
  message,
  Button,
  Select,
  Spin,
  notification,
  Tabs,
  Drawer,
  Tooltip,
  Tag,
} from "antd";
import Head from "next/head";
import zhCN from "antd/locale/zh_CN";
import { logo } from "../resource/base64";
import style from "../style";
import { transform, wordFirstBig } from "../utils/transorm";
// @ts-ignore
import { CopyToClipboard } from "react-copy-to-clipboard";
import CodeView from "react-ace";
import "ace-builds/src-noconflict/theme-kuroir";
import "ace-builds/src-noconflict/mode-typescript";
import useDeepCompareEffect from "use-deep-compare-effect";
import { template } from "../utils/request-template";
import { apiDemo } from "../utils/api-demo-string";

type IData = {
  options: {
    title: string;
    url: string;
  }[];
  current: any;
  currentUrl: string;
  currentApi?: {
    url: string;
    desc: string;
    code: string;
    method?: string;
    methods?: string[];
    moduleName: string;
    requestCodes?: string;
    requestExtraInfo?: any 
  };
};

const defaultData = {
  options: [
    {
      url: "",
      title: "",
    },
  ],
  current: undefined,
  currentUrl: "",
};

message.config({ top: 250 });

export default function () {
  const [data, setData] = useState<IData>(defaultData);
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState("");
  const [openkey, setOpenkey] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [tab, setTab] = useState("1");
  const [requestTemplate, setRequestTemplate] = useState(template);
  const [requestTemplateUed, setRequestTemplateUed] = useState(template);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setRequestTemplate(localStorage.getItem("REQUEST_TEMPLATE") || template);
    setRequestTemplateUed(localStorage.getItem("REQUEST_TEMPLATE") || template);
  }, []);

  useEffect(() => {
    let d = localStorage.getItem("DATA");
    d = d ? JSON.parse(d || "{}") : defaultData;
    // @ts-ignore
    if (d.currentUrl) setChecked(d.currentUrl);

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
    setLoading(true);
    return transform(data.current, selectedKey.split(","), m).then(
      async (res) => {
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

          const c: IData = JSON.parse(JSON.stringify(data));
          const apis = data.current.paths[selectedKey];
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
            requestExtraInfo: res.requestExtraInfo?.[selectedKey]
          };

          setData(c);
          localStorage.setItem("DATA", JSON.stringify(c));
        } catch (err: any) {
          notification.error({
            message: `格式化错误${err?.msg || ""}`,
            description: `格式化错误${err?.msg || ""}`,
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
    }
  }, [[selectedKey], data.current]);

  const options = data?.options;

  const changeService = (index: number, key: string, value: string) => {
    const c: IData = JSON.parse(JSON.stringify(data));
    if (c) {
      // @ts-ignore
      c.options[index][key] = value;
    }

    setData(c);
  };

  const addService = () => {
    const c: IData = JSON.parse(JSON.stringify(data));
    if (c) {
      c.options.push({ url: "", title: "" });
    }

    setData(c);
  };

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
      setShow(false);
    } else {
      notification.error({
        message: "swaggerJson请求错误",
        description: res?.message,
      });
    }
    setLoading(false);
  };

  const onConfirm = async () => {
    const currentUrl = checked;
    if (!currentUrl) {
      return message.error("选择服务");
    }
    let c: IData = JSON.parse(JSON.stringify(data));

    if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(currentUrl)) {
      fetchService(currentUrl);
    } else {
      message.error("swagger json的地址无效");
    }
    localStorage.setItem("DATA", JSON.stringify(c));
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

  const deleteOption = (item: { title: string; url: string }) => {
    let c: IData = JSON.parse(JSON.stringify(data));

    c.options = c.options.filter((it) => it.url !== item.url) || [];
    if (item.url === data?.currentUrl) {
      c.currentApi = undefined;
      c.currentUrl = "";
      setChecked("");
      window.location.hash = "";
    }

    setData(c);
    localStorage.setItem("DATA", JSON.stringify(c));
  };

  const onSaveTemp = () => {
    setRequestTemplateUed(requestTemplate);
    localStorage.setItem("REQUEST_TEMPLATE", requestTemplate);
    setOpen(false);
    if (selectedKey) {
      parseTs({});
    }
  };

  const currentRequestCodes = useMemo(() => {
    if (!data.currentApi?.requestExtraInfo || !data.currentApi?.requestCodes) {
      return ''
    }

    return removeUndefinedReqTypes(data.currentApi?.requestCodes, data.currentApi?.requestExtraInfo?.reqTypes)
  }, [data.currentApi])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#8bbe25",
        },
      }}
    >
      <style jsx global>
        {style}
      </style>
      {loading && (
        <div className="loading-box">
          <div className="mask"></div>
          <Spin size="large" className="loading" />
        </div>
      )}
      {/** 弹窗新增 */}
      <Modal
        title="新增swagger服务"
        open={show}
        onCancel={() => setShow(false)}
        onOk={onConfirm}
        width={1000}
        confirmLoading={loading}
      >
        <div className="swagger-services">
          {(options || []).map((item, index) => (
            <div className="s-row" key={`swagger-services${index}`}>
              <Input
                style={{ width: 700, marginRight: 14 }}
                placeholder="请输入json地址"
                value={item.url}
                onChange={(e) => {
                  changeService(index, "url", e.target.value);
                }}
              />
              <Input
                style={{ width: 150, marginRight: 14 }}
                placeholder="请输入标题"
                value={item.title}
                onChange={(e) => {
                  changeService(index, "title", e.target.value);
                }}
              />
              {options?.length > 1 && (
                <svg
                  onClick={() => deleteOption(item)}
                  style={{ marginRight: 18, cursor: "pointer" }}
                  viewBox="0 0 1024 1024"
                  width="18"
                  height="18"
                >
                  <path
                    d="M512 949.333333C270.933333 949.333333 74.666667 753.066667 74.666667 512S270.933333 74.666667 512 74.666667 949.333333 270.933333 949.333333 512 753.066667 949.333333 512 949.333333z m-151.466667-292.266666c10.666667 10.666667 29.866667 12.8 42.666667 2.133333l2.133333-2.133333 104.533334-102.4 102.4 102.4 2.133333 2.133333c12.8 10.666667 32 8.533333 42.666667-2.133333 12.8-12.8 12.8-32 0-44.8L554.666667 509.866667l102.4-102.4 2.133333-2.133334c10.666667-12.8 8.533333-32-2.133333-42.666666s-29.866667-12.8-42.666667-2.133334l-2.133333 2.133334-102.4 102.4-102.4-102.4-2.133334-2.133334c-12.8-10.666667-32-8.533333-42.666666 2.133334-12.8 12.8-12.8 32 0 44.8l102.4 102.4-102.4 102.4-2.133334 2.133333c-10.666667 12.8-10.666667 32 0 42.666667z"
                    fill="#666666"
                    p-id="19485"
                  ></path>
                </svg>
              )}
              <Radio
                checked={checked === item.url}
                onClick={() => setChecked(item.url)}
              />
            </div>
          ))}
          <Button onClick={addService} className="s-add">
            新增
          </Button>
        </div>
      </Modal>

      {/** 页面头部 */}
      <div className="header">
        <div className="h-left">
          <img src={logo} alt="" className="logo" />
          <span className="page-title">swagger-ts</span>
        </div>
        <div className="header-right">
          <Select
            className={isSearching ? "searching-select" : "unsearching-select"}
            showSearch
            onBlur={() => setIsSearching(false)}
            onFocus={() => setIsSearching(true)}
            filterOption={(input, option: any) =>
              option.props.children
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            suffixIcon={
              <svg viewBox="0 0 1024 1024" width="20" height="20">
                <path
                  d="M430.829268 124.878049c156.097561 0 280.97561 124.878049 280.97561 280.97561s-124.878049 280.97561-280.97561 280.97561-280.97561-124.878049-280.97561-280.97561S280.97561 124.878049 430.829268 124.878049M430.829268 0c-224.780488 0-405.853659 181.073171-405.853659 405.853659s181.073171 405.853659 405.853659 405.853659 405.853659-181.073171 405.853659-405.853659S655.609756 0 430.829268 0L430.829268 0z"
                  fill="#fff"
                ></path>
                <path
                  d="M674.341463 661.853659c-12.487805 0-24.97561 6.243902-31.219512 12.487805L624.390244 699.317073c-18.731707 18.731707-18.731707 49.95122 0 68.682927l243.512195 243.512195c6.243902 6.243902 18.731707 12.487805 31.219512 12.487805 12.487805 0 24.97561-6.243902 31.219512-12.487805l18.731707-18.731707c18.731707-18.731707 18.731707-49.95122 0-68.682927l-243.512195-243.512195C699.317073 668.097561 686.829268 661.853659 674.341463 661.853659L674.341463 661.853659z"
                  fill="#fff"
                ></path>
              </svg>
            }
            size="small"
            style={!isSearching ? { width: 40, transition: '0s All' } : { width: 340, marginRight: 14, fontSize: 12, transition: '0s All' }}
            onChange={(v) => {
              setSelectedKey(v);
              window.location.hash = v;
            }}
          >
            {Object.keys(data.current?.paths || {}).map((item) => (
              <Select.Option value={item} key={item}>
                {item}
              </Select.Option>
            ))}
          </Select>
          <Select
            showSearch
            filterOption={(input, option: any) =>
              option.props.children
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            size="small"
            style={{ width: 240, marginRight: 14, fontSize: 12 }}
            placeholder="select service"
            value={data?.currentUrl}
            onChange={(v) => fetchService(v)}
          >
            {data.options?.map((item) => (
              <Select.Option value={item.url} key={item.title}>
                {item.title}
              </Select.Option>
            ))}
          </Select>
          <svg
            onClick={() => setShow(true)}
            className="switch-data"
            viewBox="0 0 1024 1024"
            width="22"
            height="22"
          >
            <path
              d="M915.746268 0h-807.911811C48.273134 0 0 48.482772 0 107.834457v807.911811c0 59.561323 48.482772 107.834457 107.834457 107.834456h807.911811c59.561323 0 107.834457-48.482772 107.834456-107.834456v-807.911811c0-59.343622-48.482772-107.834457-107.834456-107.834457z m56.634456 915.746268c0 31.139276-25.495181 56.634457-56.634456 56.634456h-807.911811c-31.139276 0-56.634457-25.495181-56.634457-56.634456v-807.911811c0-31.139276 25.495181-56.634457 56.634457-56.634457h807.911811c31.139276 0 56.634457 25.495181 56.634456 56.634457v807.911811z m-267.288189-429.451087H537.293606V318.488189a25.688693 25.688693 0 0 0-25.704819-25.704819A25.688693 25.688693 0 0 0 485.875906 318.488189v167.806992H318.068913c-14.215055 0-25.704819 11.497827-25.704819 25.495181a25.688693 25.688693 0 0 0 25.704819 25.704819H485.875906v167.806992a25.688693 25.688693 0 0 0 25.704818 25.704819 25.688693 25.688693 0 0 0 25.704819-25.704819V537.495181H705.108661a25.688693 25.688693 0 0 0 25.704819-25.704819c0-14.206992-11.497827-25.495181-25.704819-25.495181z"
              fill="#ffffff"
            ></path>
          </svg>

          {data.currentUrl && (
            <svg
              onClick={() => fetchService(data.currentUrl)}
              style={{ marginLeft: 14, cursor: "pointer" }}
              viewBox="0 0 1024 1024"
              width="20"
              height="20"
            >
              <path
                fill="#fff"
                d="M975.80798 384.130331h-191.9609a47.98349 47.98349 0 0 1 0-95.966979H862.140185a416.332884 416.332884 0 1 0 64.660514 239.94439h0.808256a47.98349 47.98349 0 0 1 95.993922 0 29.986313 29.986313 0 0 1-0.808257 8.809995 511.626316 511.626316 0 1 1-94.97013-323.140918V144.185941a47.98349 47.98349 0 0 1 95.993922 0v191.960901a48.118199 48.118199 0 0 1-48.010432 47.983489z"
                p-id="21591"
              ></path>
            </svg>
          )}
        </div>
      </div>

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
              inlineIndent={12}
              style={{ height: 'calc(100vh - 46px)' }}
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
                  <div className="info-r">{data.currentApi?.url}</div>
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
                    {
                      data.currentApi.requestExtraInfo?.reqTypes?.map((it: string) => <Tag key={it}>{it}</Tag>)
                    }
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-l">content-type:</div>
                  <div className="info-r">
                    {data.currentApi.requestExtraInfo?.reqBodyIsFormData ? 'multipart/form-data' : 'application/json' }
                  </div>
                </div>
              </div>
              <Tabs
                activeKey={tab}
                onChange={(e) => setTab(e)}
                items={[
                  {
                    key: "1",
                    label: "请求类型",
                  },
                  {
                    key: "2",
                    label: "请求方法",
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
                  text={tab === '1' ? data.currentApi?.code : currentRequestCodes}
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
                  width="900px"
                  fontSize={13}
                  readOnly
                  showGutter={true}
                  value={
                    (tab === "1"
                      ? data.currentApi?.code
                      : currentRequestCodes) || ""
                  }
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
      <Drawer
        title="请求方法模版"
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
        width="40" height="40"
      >
        <path d="M967.882752 603.308032c26.207232-104.832-2.62144-173.251584-2.62144-173.251584l-100.272128-4.922368c-8.786944-31.470592-21.655552-61.147136-38.00576-88.600576l67.64544-76.797952c-55.595008-92.654592-124.363776-120.651776-124.363776-120.651776l-74.48064 67.513344c-27.746304-16.140288-57.759744-28.643328-89.506816-37.108736l-6.390784-100.893696c-104.827904-26.211328-173.251584 2.625536-173.251584 2.625536l-4.7616 96.979968c-31.289344 7.86432-61.060096 19.470336-88.580096 34.787328l-70.501376-63.904768c0 0-68.768768 27.997184-124.363776 120.651776 17.671168 20.058112 52.43904 43.088896 54.524928 72.580096 0.514048 7.28064-33.462272 93.239296-34.927616 93.313024l-90.230784 4.427776c0 0-28.828672 68.41856-2.625536 173.251584l89.423872 5.666816c8.444928 35.557376 21.997568 69.04832 39.94112 99.762176l-58.875904 64.949248c0 0 27.997184 68.768768 120.651776 124.363776l67.101696-59.101184c30.400512 18.198528 63.587328 32.063488 98.861056 40.890368l4.36224 88.844288c0 0 68.422656 28.832768 173.251584 2.625536l5.876736-92.72832c35.72224-9.469952 69.250048-24.103936 99.827712-43.199488l71.151616 62.669824c92.658688-55.590912 120.655872-124.363776 120.655872-124.363776l-64.81408-71.501824c15.968256-28.69248 27.952128-59.809792 35.791872-92.572672L967.882752 603.308032zM516.528128 735.343616c-118.956032 0-215.389184-96.433152-215.389184-215.39328 0-118.956032 96.433152-215.389184 215.389184-215.389184s215.39328 96.433152 215.39328 215.389184C731.921408 638.911488 635.48416 735.343616 516.528128 735.343616z"
         fill="#8bbe25" p-id="7163"></path>
      </svg>
      <Head>
        <title>Swagger Ts</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </ConfigProvider>
  );
}

function showRequestDemo() {
  const m = Modal.confirm({
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
  let codesArr = codes.split('\n');

  ['path', 'body', 'query'].forEach((item: string) => {
    if (types?.indexOf(item) < 0) {
      let index = -1
      codesArr.map((it, i) => {
         if (it.includes(`["request${wordFirstBig(item)}"]`) && index < 0) {
          index = i
         }
      })
      codesArr.splice(index, 1)
    }
  })

  return codesArr.join('\n')
}
