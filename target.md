# ESP32 EPD EVK UPPER

## 1. 硬件

下位机是ESP32S3，可以通过串口或者tcp通讯
此上位机是以网页实现的，网页上通过串口或者tcp通讯控制下位机并传输数据，ip地址为局域网内地址，不考虑外网使用

## 2. 功能

首先实现 tcp通讯，能够输入目标地址和端口，然后连接成功后，可以发送消息给下位机（发送功能测试用，实际上并不通过编辑消息的方式发送）

## 3. 通讯协议
- 上下位机通讯协议如下

```c
#define PROTO_HEAD          0xAA
#define PROTO_MAX_DATA_LEN  4096    /* 单帧最大 DATA 长度，可按需调整 */

/* ── CRC16-MODBUS ─────────────────────────────────────────── */
static uint16_t crc16_modbus(const uint8_t *data, size_t len)
{
    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < len; i++)
    {
        crc ^= data[i];
        for (int j = 0; j < 8; j++)
        {
            if (crc & 1)
            {
                crc = (crc >> 1) ^ 0xA001;
            }
            else
            {
                crc >>= 1;
            }
        }
    }
    return crc;
}

void proto_send(proto_channel_t ch, uint8_t cmd, const uint8_t *data, uint16_t len)
{
    if (len > PROTO_MAX_DATA_LEN)
    {
        ESP_LOGE(TAG, "send len %u > MAX %u", len, PROTO_MAX_DATA_LEN);
        return;
    }

    /* 构造帧: HEAD + CMD + LEN_H + LEN_L + DATA + CRC_L + CRC_H */
    size_t frame_len = 4 + len + 2;
    uint8_t *frame = (uint8_t *)malloc(frame_len);
    if (frame == NULL)
    {
        ESP_LOGE(TAG, "send malloc failed");
        return;
    }

    size_t pos = 0;
    frame[pos++] = PROTO_HEAD;
    frame[pos++] = cmd;
    frame[pos++] = (uint8_t)(len >> 8);
    frame[pos++] = (uint8_t)(len & 0xFF);
    if (len > 0 && data != NULL)
    {
        memcpy(frame + pos, data, len);
        pos += len;
    }

    uint16_t crc = crc16_modbus(frame, pos);
    frame[pos++] = (uint8_t)(crc & 0xFF); /* CRC 低字节在前 */
    frame[pos++] = (uint8_t)(crc >> 8);

    send_via_channel(ch, frame, pos);
    free(frame);
}

```

## A. 本项目目标 打勾表示已完成
- [x] 网页需要在手机和电脑上都能正常操作
- [x] 实现ip地址和端口输入框，以及连接按钮，连接成功后显示连接成功，连接失败显示连接失败，并为输入框加上一定程度的校验
- [x]一个文本输入框，用于输入要发送的消息，一个发送按钮，用于发送消息
- [x]一个文本框，用于显示接收到的消息
- [x] 新增一个后台页面，将消息发送功能和接收消息功能放到这个页面里
- [x] 实现串口通讯，能够选择串口号和波特率，连接成功后可以发送消息给下位机，并显示接收到的消息（串口功能暂不考虑手机端的效果）
- [x] 串口通讯和tcp通讯同时只会启用一个，一起连上后另一个会禁用
- [x] 串口通讯和tcp通公用所有发送消息的控件和方法，以及消息接收串口
- [x] 实现图片抖动和取模功能
    - [x] 选择图片后有个地方可以显示原始图片的尺寸
    - [x] 一个按钮选择图片，加载上图片后设置分辨率，再选择抖动色板（例如黑白1bit 黑白红1bit 黑白黄红2bit）
    - [x] 分辨率设置按钮在加载图片前为禁用，加载图片后设为该图片的宽和高，不使用固定值
    - [x] 以上选择好后点击转换可以显示抖动后的图片，前后两张图在不同的控件里显示方便对比
    - [x] 上面转换图片后也对图片进行取模操作，在后台页面预览数据
- [ ] 后面这些数据会经过协议转换向下位机发送，暂时不处理这条
- [ ] 抖动算法可在多种算法中选，暂时不处理这条
- [x] 设备连接 控制台 图片都懂与取模页面等需要添加折叠支持
- [x] 加入一个新按钮，弹出新窗口来显示转换后的图片，当然图片未转换时禁用或隐藏。新页面按照刚才解决预览问题的方式

## B.待修复
