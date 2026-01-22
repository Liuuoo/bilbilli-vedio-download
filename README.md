### 下载ffmpeg
参考文档ffmpeg安装指南
### 如何安装
1. 确保你的浏览器安装了 Tampermonkey 或 Violentmonkey 扩展。
2. 点击扩展图标 -> 添加新脚本。
3. 复制bilibili_extractor.user.js中的代码
4. 保存 (Ctrl+S)。
5. 刷新 Bilibili 视频页面，你会在页面左侧看到一个 “提取B站视频” 的悬浮按钮。

### 如何使用
1. 点进需要下载的视频
2. 点击悬浮按钮
3. 复制给出的链接
4. 打开终端并cd到想下载到的文件夹
5. 粘贴等待即可
### 脚本功能
- 自动获取：直接从当前页面内存中读取 window.__playinfo__，不需要重新请求。
- 生成命令：自动生成带 Referer 防盗链头的 curl 下载命令和 ffmpeg 合并命令，方便你直接复制到终端运行。
- 安全：脚本只在本地运行，不会上传任何数据。

![alt text](<Video Project.gif>)
