# Web Serial 串口功能说明

## 概述

本项目已集成 Web Serial API 功能，允许浏览器直接访问客户端设备的串口，无需在服务器端处理串口通信。

## 浏览器支持

Web Serial API 需要以下浏览器支持：
- ✅ Chrome 89+
- ✅ Edge 89+
- ✅ Opera 75+
- ❌ Firefox（不支持）
- ❌ Safari（不支持）

## 使用方法

### 1. 访问方式

**必须使用 HTTPS 或 localhost 访问**，Web Serial API 要求安全上下文。

- 本地访问：`http://localhost:3000`
- 远程访问：需要配置 HTTPS

### 2. 连接步骤

1. 在"串口连接"标签页，点击 **「选择串口」** 按钮
2. 在弹出的设备选择对话框中选择你的 USB 串口设备
3. 选择波特率（默认 115200）
4. 点击 **「连接」** 按钮
5. 连接成功后即可在控制台发送和接收数据

### 3. 支持的设备

Web Serial API 支持所有标准串口设备：
- USB 转串口适配器 (CP2102, CH340, FT232 等)
- Arduino 开发板
- ESP32/ESP8266 开发板
- STM32 开发板
- 其他 CDC ACM 设备

## 与 WebUSB 的区别

| 特性 | Web Serial API | WebUSB |
|------|----------------|--------|
| 复杂度 | 简单易用 | 复杂，需要处理接口和端点 |
| 兼容性 | 更好 | 需要设备支持 |
| 自动识别 | 自动识别串口设备 | 需要手动配置 |
| 推荐度 | ⭐⭐⭐ 推荐 | 仅在特殊情况下使用 |

## 测试串口功能

访问 `http://localhost:3000/serial-test.html` 可以单独测试 Web Serial 功能。

## 故障排除

### 问题：浏览器不支持 Web Serial API

**解决方案：**
1. 使用 Chrome 89+ 或 Edge 89+ 浏览器
2. 确保通过 HTTPS 或 localhost 访问

### 问题：选择设备时没有显示任何设备

**解决方案：**
1. 确保设备已通过 USB 连接到电脑
2. 检查设备管理器中是否识别到设备
3. 某些设备可能需要安装驱动程序
4. 尝试使用其他 USB 端口

### 问题：连接失败

**解决方案：**
1. 检查是否有其他程序正在使用该串口（如 Arduino IDE、PuTTY 等）
2. 尝试断开并重新连接设备
3. 检查浏览器控制台是否有错误信息

### 问题：无法发送/接收数据

**解决方案：**
1. 确认波特率设置正确
2. 检查设备是否需要特定的串口参数（数据位、停止位、校验位）
3. 尝试使用测试页面验证基本通信

## 安全注意事项

- Web Serial API 需要用户明确授权才能访问设备
- 每次连接都需要用户选择设备
- 只能访问用户授权的设备

## 开发者说明

### Web Serial API 主要方法

```javascript
// 请求串口
const port = await navigator.serial.requestPort();

// 打开串口
await port.open({
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  bufferSize: 1024
});

// 读取数据
const reader = port.readable.getReader();
const { value, done } = await reader.read();
reader.releaseLock();

// 写入数据
const writer = port.writable.getWriter();
await writer.write(data);
writer.releaseLock();

// 关闭串口
await port.close();
```

### 监听设备连接/断开事件

```javascript
// 监听新设备连接
navigator.serial.addEventListener('connect', (e) => {
  console.log('新设备连接:', e.target);
});

// 监听设备断开
navigator.serial.addEventListener('disconnect', (e) => {
  console.log('设备断开:', e.target);
});
```
