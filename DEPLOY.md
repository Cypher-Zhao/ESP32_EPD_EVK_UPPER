# 静态网页部署教程

本项目是纯前端项目，可以直接部署到 **GitHub Pages** 或 **Gitee Pages**，无需服务器。

---

## GitHub Pages

### 方式一：GitHub Actions 自动部署（推荐）

项目已包含 `.github/workflows/deploy.yml`，会自动将 `public/` 目录部署到 Pages。

**操作步骤：**

1. 在 GitHub 上创建仓库，将项目推送上去
2. 进入仓库 → **Settings** → **Pages** → **Source** 选择 **GitHub Actions**
3. 每次推送到 `main` 分支会自动部署

访问地址：`https://<用户名>.github.io/<仓库名>/`

### 方式二：静态文件手动部署

如果不用 Actions，也可以手动部署：

1. 进入仓库 → **Settings** → **Pages**
2. **Source** 选择 `Deploy from a branch`
3. 选择分支（如 `main`），目录选择 `/public`（或 `/docs`）
4. 保存后等待几分钟即可访问

> **注意**：GitHub Pages 只支持从根目录 `/` 或 `/docs` 部署，不能选择任意子目录。如果 `public/` 不行，需要把文件放到 `docs/` 目录下。

---

## Gitee Pages

Gitee 同样提供免费的静态 Pages 服务，且支持从**任意子目录**部署。

### 操作步骤

1. 在 Gitee 上创建仓库，将项目推送上去
2. 进入仓库 → **服务** → **Gitee Pages**
3. 部署目录选择 `public`
4. 点击 **启动**（首次使用需要实名认证并等待审核）
5. 部署完成后会显示访问地址

### Gitee Pages 设置说明

| 配置项 | 建议值 |
|--------|--------|
| 部署分支 | `master` 或 `main` |
| 部署目录 | `public` |
| 自定义域名 | 可选，绑定自己的域名 |
| HTTPS | 可选开启 |

### 自动更新

Gitee Pages 不会自动部署，每次推送代码后需要手动进入 **Gitee Pages** 页面点击 **更新**。

如果需要自动部署，可以在 Gitee 上配置 **WebHook** 或使用 CI/CD。

---

## 推送到仓库的步骤

### 1. 初始化 Git（如果还没有）

```bash
git init
git add .
git commit -m "初始提交"
```

### 2. 推送到 GitHub

```bash
git remote add origin https://github.com/<用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 3. 推送到 Gitee

```bash
git remote add gitee https://gitee.com/<用户名>/<仓库名>.git
git push -u gitee main
```

### 4. 同时推送到两个平台

可以配置多个 remote，一次推送两个：

```bash
# 在 .git/config 中添加
[remote "all"]
    url = https://github.com/<用户名>/<仓库名>.git
    url = https://gitee.com/<用户名>/<仓库名>.git
```

然后用 `git push all main` 同时推送。

---

## 常见问题

### Q: GitHub Pages 访问出现 404？
- 确认 Settings → Pages 已正确配置
- 如果用 Actions 部署，确认 Source 选的是 **GitHub Actions**
- 检查 Actions 运行是否成功（仓库 → Actions 标签页）

### Q: Gitee Pages 显示"审核中"？
- Gitee Pages 首次使用需要实名认证
- 审核一般 1-2 个工作日

### Q: 页面能打开但功能不正常？
- 本项目使用 **WebSocket** 和 **Web Serial API**
- WebSocket 连接需要页面通过 `http://` 访问（`https://` 下 `ws://` 会被浏览器拦截）
- Web Serial API 只支持 Chrome/Edge 89+ 浏览器
- GitHub Pages 和 Gitee Pages 默认使用 HTTPS，如需 WebSocket 直连 ESP32，建议本地 `http://` 访问或 ESP32 改用 `wss://`

### Q: 如何自定义域名？
- GitHub Pages：Settings → Pages → Custom domain 填写域名，配置 CNAME DNS 记录
- Gitee Pages：Gitee Pages 设置页面填写自定义域名，配置 CNAME DNS 记录
