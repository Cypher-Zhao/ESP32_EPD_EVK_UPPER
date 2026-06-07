const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const net = require('net');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, 'public')));

// 每个 WebSocket 客户端的连接状态
const clientState = new Map();

wss.on('connection', (ws) => {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const state = { tcpClient: null, serialPort: null, mode: null };
  clientState.set(id, state);
  console.log(`[WS] 新连接: ${id}`);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch {
      return send(ws, { type: 'error', message: '无效的消息格式' });
    }

    switch (msg.type) {
      case 'tcp-connect':       return handleTcpConnect(ws, msg, state);
      case 'tcp-disconnect':    return handleTcpDisconnect(ws, state);
      case 'serial-list':       return handleSerialList(ws);
      case 'serial-connect':    return handleSerialConnect(ws, msg, state);
      case 'serial-disconnect': return handleSerialDisconnect(ws, state);
      case 'send':              return handleSend(ws, msg, state);
      case 'proto-send':        return handleProtoSend(ws, msg, state);
      default: send(ws, { type: 'error', message: `未知消息类型: ${msg.type}` });
    }
  });

  ws.on('close', () => {
    cleanup(state);
    clientState.delete(id);
    console.log(`[WS] 断开: ${id}`);
  });

  ws.on('error', () => cleanup(state));
});

function send(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

// ==================== TCP ====================
function handleTcpConnect(ws, msg, state) {
  const { host, port } = msg;
  if (!host || !port) return send(ws, { type: 'error', message: 'IP地址和端口不能为空' });
  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535)
    return send(ws, { type: 'error', message: '端口必须是 1-65535 之间的数字' });

  cleanup(state);

  console.log(`[TCP] 正在连接 ${host}:${portNum} ...`);
  const client = new net.Socket();
  client.setTimeout(5000);

  client.connect(portNum, host, () => {
    console.log(`[TCP] 已连接 ${host}:${portNum}`);
    client.setTimeout(0);
    client.setKeepAlive(true, 3000);
    state.tcpClient = client;
    state.mode = 'tcp';
    send(ws, { type: 'tcp-connected', message: `已连接到 ${host}:${portNum}`, host, port: portNum });
  });

  client.on('data', (data) => {
    send(ws, { type: 'received', data: data.toString('utf-8'), bytes: Array.from(data) });
  });

  client.on('timeout', () => {
    console.log(`[TCP] 连接超时 ${host}:${portNum}`);
    client.destroy();
    send(ws, { type: 'error', message: `连接超时: ${host}:${portNum}` });
  });

  client.on('error', (err) => {
    let errorMsg = `连接失败: ${err.message}`;
    if (err.code === 'ECONNREFUSED') errorMsg = `连接被拒绝: ${host}:${portNum}`;
    else if (err.code === 'ENOTFOUND') errorMsg = `无法解析主机名: ${host}`;
    else if (err.code === 'EHOSTUNREACH') errorMsg = `无法访问主机: ${host}`;
    console.error(`[TCP] 错误: ${errorMsg}`);
    send(ws, { type: 'error', message: errorMsg });
    state.tcpClient = null;
    state.mode = null;
  });

  client.on('close', () => {
    console.log(`[TCP] 连接关闭 ${host}:${portNum}`);
    state.tcpClient = null;
    state.mode = null;
    send(ws, { type: 'tcp-disconnected', message: 'TCP 连接已关闭' });
  });
}

function handleTcpDisconnect(ws, state) {
  if (state.tcpClient) {
    state.tcpClient.destroy();
    state.tcpClient = null;
    state.mode = null;
    send(ws, { type: 'tcp-disconnected', message: '已断开 TCP 连接' });
  }
}

// ==================== Serial ====================
async function handleSerialList(ws) {
  try {
    const ports = await SerialPort.list();
    const list = ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer || '',
      vendorId: p.vendorId || '',
      productId: p.productId || ''
    }));
    send(ws, { type: 'serial-list', ports: list });
  } catch (err) {
    send(ws, { type: 'error', message: `获取串口列表失败: ${err.message}` });
  }
}

function handleSerialConnect(ws, msg, state) {
  const { path: portPath, baudRate } = msg;
  if (!portPath) return send(ws, { type: 'error', message: '请选择串口' });
  const baud = parseInt(baudRate, 10) || 115200;

  cleanup(state);

  console.log(`[Serial] 正在连接 ${portPath} @ ${baud}`);
  const port = new SerialPort({ path: portPath, baudRate: baud });

  port.on('open', () => {
    console.log(`[Serial] 已连接 ${portPath} @ ${baud}`);
    state.serialPort = port;
    state.mode = 'serial';
    send(ws, { type: 'serial-connected', message: `已连接串口 ${portPath} @ ${baud}`, path: portPath, baudRate: baud });
  });

  port.on('data', (data) => {
    send(ws, { type: 'received', data: data.toString('utf-8'), bytes: Array.from(data) });
  });

  port.on('error', (err) => {
    console.error(`[Serial] 错误: ${err.message}`);
    send(ws, { type: 'error', message: `串口错误: ${err.message}` });
    state.serialPort = null;
    state.mode = null;
  });

  port.on('close', () => {
    console.log(`[Serial] 连接关闭 ${portPath}`);
    state.serialPort = null;
    state.mode = null;
    send(ws, { type: 'serial-disconnected', message: '串口已断开' });
  });
}

function handleSerialDisconnect(ws, state) {
  if (state.serialPort) {
    state.serialPort.close();
    state.serialPort = null;
    state.mode = null;
    send(ws, { type: 'serial-disconnected', message: '已断开串口' });
  }
}

// ==================== 通用发送 ====================
function handleSend(ws, msg, state) {
  const data = msg.data || '';
  if (state.mode === 'tcp' && state.tcpClient && !state.tcpClient.destroyed) {
    state.tcpClient.write(data, (err) => {
      if (err) send(ws, { type: 'error', message: `发送失败: ${err.message}` });
      else send(ws, { type: 'sent', data });
    });
  } else if (state.mode === 'serial' && state.serialPort && state.serialPort.isOpen) {
    state.serialPort.write(data, (err) => {
      if (err) send(ws, { type: 'error', message: `发送失败: ${err.message}` });
      else send(ws, { type: 'sent', data });
    });
  } else {
    send(ws, { type: 'error', message: '未连接到设备，请先连接' });
  }
}

// ==================== 协议发送 ====================
function handleProtoSend(ws, msg, state) {
  const { frame } = msg; // 前端构建好的协议帧 (字节数组)
  if (!frame || !Array.isArray(frame)) {
    return send(ws, { type: 'error', message: '无效的协议帧数据' });
  }
  const buf = Buffer.from(frame);
  if (state.mode === 'tcp' && state.tcpClient && !state.tcpClient.destroyed) {
    state.tcpClient.write(buf, (err) => {
      if (err) send(ws, { type: 'error', message: `协议发送失败: ${err.message}` });
      else send(ws, { type: 'proto-sent', hex: buf.toString('hex').toUpperCase() });
    });
  } else if (state.mode === 'serial' && state.serialPort && state.serialPort.isOpen) {
    state.serialPort.write(buf, (err) => {
      if (err) send(ws, { type: 'error', message: `协议发送失败: ${err.message}` });
      else send(ws, { type: 'proto-sent', hex: buf.toString('hex').toUpperCase() });
    });
  } else {
    send(ws, { type: 'error', message: '未连接到设备，请先连接' });
  }
}

// ==================== 清理 ====================
function cleanup(state) {
  if (state.tcpClient) { state.tcpClient.destroy(); state.tcpClient = null; }
  if (state.serialPort) { state.serialPort.close(() => {}); state.serialPort = null; }
  state.mode = null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  ESP32 EPD EVK 上位机`);
  console.log(`  服务已启动: http://localhost:${PORT}`);
  console.log(`========================================`);
});
