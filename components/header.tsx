import { Dispatch, SetStateAction, useState } from "react";
import { logo } from "../resource/base64";
import { Button, Input, Modal, Radio, Select, message } from "antd";
import { IData } from "../types";

type Props = {
  data: IData;
  onChange: (v: string) => void;
  reload: (v: string) => void;
  loading: boolean
  setData: Dispatch<SetStateAction<IData>>
};

export default function Header(props: Props) {
  const { data, onChange, reload, loading, setData } = props;
  const [show, setShow] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [checked, setChecked] = useState("");

  const onConfirm = async () => {
    const currentUrl = checked;
    if (!currentUrl) {
      return message.error("选择服务");
    }
    let c: IData = JSON.parse(JSON.stringify(data));

    if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(currentUrl)) {
      await reload(currentUrl);
      setShow(false)
    } else {
      message.error("swagger json的地址无效");
    }
    localStorage.setItem("DATA", JSON.stringify(c));
  };

  const options = data?.options;

  const changeService = (index: number, key: string, value: string) => {
    const c: IData = JSON.parse(JSON.stringify(data));
    if (c) {
      // @ts-ignore
      c.options[index][key] = value;
    }

    setData(c);
  };

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

  const addService = () => {
    const c: IData = JSON.parse(JSON.stringify(data));
    if (c) {
      c.options.push({ url: "", title: "" });
    }

    setData(c);
  };

  return (
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
            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >=
            0
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
          style={
            !isSearching
              ? { width: 40, transition: "0s All" }
              : {
                  width: 340,
                  marginRight: 14,
                  fontSize: 12,
                  transition: "0s All",
                }
          }
          onChange={(v) => {
            onChange?.(v);
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
            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >=
            0
          }
          size="small"
          style={{ width: 240, marginRight: 14, fontSize: 12 }}
          placeholder="select service"
          value={data?.currentUrl}
          onChange={(v) => reload?.(v)}
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
            onClick={() => reload(data.currentUrl)}
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
    </div>
  );
}
