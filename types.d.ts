export type IData = {
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
    responseJson?: string
  };
};