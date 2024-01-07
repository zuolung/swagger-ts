const style = `

* {
  margin: 0;
  padding: 0;
  font-family: monospace;
}

a {
  text-decoration: none;
}
.header {
  background-color: #8bbe25;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  overflow: hidden;
}

.header-right {
  display: flex;
  align-items: center;
}

.h-left {
  display: flex;
  align-items: center;
}

.page-title {
  margin-left: 10px;
  font-weight: 700;
  color: #fff;
  font-size: 20px;
}

.logo {
  width: 30px;
  height: 30px;
  display: block;
}

.switch-data {
  width: 22px;
  height: 22px;
}

.switch-data path {
  fill: #fff;
  cursor: pointer;
}

.page-empty {
  display: flex;
  justify-content: center;
  height: calc(100vh - 50px);
  align-items: center;
  color: #cbdaad;
  flex-direction: column;
}

.page-empty .desc {
  margin-top: 20px;
  font-size: 20px;
}

.swagger-services {
  padding: 20px;
  font-size: 12px;
}

.s-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.s-add {
  cursor: pointer;
  display: flex;
  width: 100%;
  justify-content: center;
}

.s-row path {
  fill: #666;
}

.main {
  display: flex;
}

.menu {
  height: calc(100vh - 46px);
  overflow-y: scroll;
  overflow-x: hidden;
  width: 300px;
}

.ant-menu-title-content {
  position: relative;
  left: -10px;
  font-size: 12px !important;
}

.api-content {
  padding: 20px;
}

.code-box {
  padding: 12px 0px;
  background: #e8e9e8;
  border-radius: 12px;
  position: relative;
}

.code-box .copy-icon {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 999;
  cursor: pointer;
}

.info-title {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 16px;
}

.ace-kuroir .ace_comment {
  background: unset !important;
}

.ace_gutter-cell  {
  color: #b6b6b6 !important;
}

.info-row {
  display: flex;
  margin-bottom: 14px;
  align-items: center;
}

.info-l {
  padding-right: 8px;
}

.ant-menu-submenu-open  .ant-menu-submenu-title {
  font-weight: 500;
}

.ant-menu-item-selected {
  background: #8bbe25 !important;
  color: #fff !important;
  font-weight: 500;
}

.loading-box {
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
}

.loading-box .mask {
  width: 100vw;
  height: 100vh;
  background: #a1b7a4;
  opacity: 0.1;
  z-index: 1000;
  position: absolute;
  left: 0;
  top: 0;
}

.loading-box .loading {
  z-index: 100111;
  position: absolute;
  left: 50%;
  top: 50%;
}

.unsearching-select, .unsearching-select .ant-select-selector {
  background-color: #8bbe25 !important;
  border: none !important;
}

.unsearching-select .ant-select-selection-item {
  display: none;
}

.unsearching-select :where(.css-dev-only-do-not-override-13q396f).ant-select:not(.ant-select-customize-input) .ant-select-selector {
  background-color: #8bbe25 !important;
}

:where(.css-dev-only-do-not-override-13q396f).ant-menu-inline.ant-menu-root .ant-menu-item >.ant-menu-title-content, :where(.css-dev-only-do-not-override-13q396f).ant-menu-inline.ant-menu-root .ant-menu-submenu-title >.ant-menu-title-content {
  direction: rtl;
}
`

export default style