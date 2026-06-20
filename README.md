# ESP32 EPD EVK 上位机

基于浏览器的 ESP32 墨水屏（EPD）评估套件上位机控制工具，纯前端实现，无需安装任何软件。

## 功能特性

### 设备连接
- **WebSocket 连接** — 通过局域网 WiFi 直连 ESP32 设备
- **Web Serial 连接** — 通过 USB 串口连接（Chrome / Edge 89+）

### 屏幕控制
- 全屏刷新（黑 / 白 / 黄 / 红）
- 显示指定 ID 的图片（支持 16 个图片槽位）
- 获取设备状态 / 固件版本

### 图片处理
- 上传图片并设置目标分辨率
- Floyd-Steinberg 抖动算法，支持三种调色板：
  - 黑白 1-bit
  - 黑白红 1-bit
  - 黑白黄红 2-bit
- 自动生成 EPD 硬件格式的模数据（列主序，FPC 右侧）
- 分块写入 ESP32 Flash（擦除 + 写入协议）

### WiFi 配置
- 设置 SSID / 密码
- 连接 / 断开 WiFi
- 获取 WiFi 状态

### 调试工具
- 协议消息实时显示（带过滤）
- 收发数据 Hex 视图
- 快捷命令面板

## 通信协议

自定义二进制协议，帧格式如下：

```
┌──────┬──────┬──────────┬──────────┬──────────┐
│ 0xAA │ CMD  │ LEN (2B) │   DATA   │ CRC (2B) │
│ 头码 │ 命令 │ 长度大端 │  数据载荷 │ CRC16校验 │
└──────┴──────┴──────────┴──────────┴──────────┘
```

CRC 校验使用 CRC-16/MODBUS。设备响应错误时，命令码置 `cmd | 0x80`。

### 命令列表

| 命令码 | 名称 | 说明 |
|--------|------|------|
| `0x00` | 心跳 | 心跳检测 |
| `0x01` | Flash 擦除 | 擦除 Flash 区域 |
| `0x02` | Flash 写入 | 写入 Flash 数据 |
| `0x05` | 状态信息 | 获取设备状态 |
| `0x10` | 全屏刷新 | 全屏刷新指定颜色 |
| `0x11` | 显示图片 | 显示指定 ID 的图片 |
| `0x21` | 版本 | 获取固件版本 |
| `0x30` | 设置 SSID | 设置 WiFi 名称 |
| `0x31` | 设置密码 | 设置 WiFi 密码 |
| `0x32` | WiFi 状态 | 获取 WiFi 状态 |
| `0x33` | 连接 WiFi | 连接 WiFi 网络 |
| `0x34` | 断开 WiFi | 断开 WiFi 连接 |

### 错误代码

| 代码 | 说明 |
|------|------|
| 1 | 命令错误 |
| 2 | 参数长度错误 |
| 3 | CRC 错误 |
| 4 | 执行错误 |

## 页面说明

| 页面 | 说明 |
|------|------|
| [index.html](public/index.html) | 主界面 — 设备连接、图片处理、屏幕控制、WiFi 配置 |
| [console.html](public/console.html) | 控制台 — 深色主题的独立调试终端 |
| [serial-test.html](public/serial-test.html) | 串口测试 — Web Serial API 诊断工具 |

## 在线使用

部署到 GitHub Pages 后直接访问即可，无需安装。

**推荐浏览器：** Chrome 或 Edge 89+

> **注意：** Web Serial API 仅在 `localhost` 或 `https://` 下可用；WebSocket 的 `ws://` 在 `https://` 页面上会被浏览器阻止，需使用 `wss://` 或通过 HTTP 访问。

## 本地运行

本项目是纯静态页面，直接用浏览器打开 `public/index.html` 即可，或使用任意 HTTP 服务器：

```bash
# Python
python -m http.server 8080 -d public

# Node.js (npx)
npx serve public
```

## 部署

参见 [DEPLOY.md](DEPLOY.md)。

推送到 `master` 分支后，GitHub Actions 会自动部署到 GitHub Pages。

## 项目结构

```
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions 部署配置
├── public/
│   ├── index.html           # 主界面（65KB，含全部功能）
│   ├── console.html         # 调试控制台
│   └── serial-test.html     # 串口测试工具
├── DEPLOY.md                # 部署说明
└── README.md                # 本文件
```
