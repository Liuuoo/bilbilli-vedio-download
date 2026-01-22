// ==UserScript==
// @name         B站视频链接提取器
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  提取B站视频链接，UI小巧可拖动，支持自动命名与PowerShell，支持画质选择
// @author       Gemini
// @match        *://www.bilibili.com/video/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        #bili-extractor-btn {
            position: fixed; 
            left: 20px; 
            top: 50%; 
            transform: translateY(-50%); /* 初始垂直居中 */
            z-index: 999999; 
            background-color: #00AEEC; 
            color: white;
            padding: 6px 10px; /* 缩小内边距 */
            border-radius: 6px; 
            cursor: move; /* 鼠标变为移动图标 */
            box-shadow: 0 2px 6px rgba(0,0,0,0.3); 
            font-weight: bold;
            font-size: 12px; /* 缩小字体 */
            border: 1px solid #009CD6;
            user-select: none; /* 防止拖动时选中文字 */
            transition: background-color 0.2s; /* 仅背景色过渡，位置不过渡以免拖动延迟 */
        }
        #bili-extractor-btn:hover { background-color: #009CD6; }
        
        #bili-extractor-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 700px; max-width: 90%; background: white; z-index: 1000000;
            padding: 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: none; color: #333; font-family: sans-serif;
        }
        #bili-extractor-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 999999; display: none;
        }
        .be-textarea { width: 100%; height: 60px; margin-top: 5px; font-family: monospace; font-size: 12px; }
        .be-btn { padding: 5px 10px; margin-top: 5px; cursor: pointer; background: #eee; border: 1px solid #ddd; }
        .be-section { margin-bottom: 15px; }
        .be-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px; display:flex; justify-content:space-between;}
        .be-select { width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #00AEEC; border-radius: 4px; font-size: 14px; background-color: #f0faff; }
    `);

    function createUI() {
        const btn = document.createElement('div');
        btn.id = 'bili-extractor-btn';
        btn.innerHTML = '下载'; // 只显示两个字
        btn.title = '长按可拖动，点击提取';
        document.body.appendChild(btn);

        const overlay = document.createElement('div');
        overlay.id = 'bili-extractor-overlay';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.id = 'bili-extractor-modal';
        modal.innerHTML = `<div class="be-title"><span>提取结果</span><span id="be-close" style="cursor:pointer">&times;</span></div><div id="be-content"></div>`;
        document.body.appendChild(modal);

        // --- 拖动逻辑开始 ---
        let isDragging = false;
        let hasMoved = false; // 用于区分点击和拖动
        let startX, startY;

        btn.addEventListener('mousedown', function(e) {
            // 只响应左键
            if (e.button !== 0) return;

            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            
            // 获取当前按钮相对于视口的位置
            const rect = btn.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            // 移除 CSS 的 transform 居中，改为绝对定位，防止跳动
            btn.style.transform = 'none';
            btn.style.left = rect.left + 'px';
            btn.style.top = rect.top + 'px';

            function onMouseMove(moveEvent) {
                if (!isDragging) return;
                
                // 判断移动距离是否超过阈值（防手抖）
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    hasMoved = true;
                }

                if (hasMoved) {
                    // 更新位置
                    btn.style.left = (moveEvent.clientX - offsetX) + 'px';
                    btn.style.top = (moveEvent.clientY - offsetY) + 'px';
                }
            }

            function onMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // 点击事件：只有当未发生拖动时才触发
        btn.addEventListener('click', function(e) {
            if (hasMoved) {
                // 如果是拖动行为，阻止默认点击
                e.preventDefault();
                e.stopPropagation();
            } else {
                extractLinks();
            }
        });
        // --- 拖动逻辑结束 ---

        overlay.onclick = closeModal;
        document.getElementById('be-close').onclick = closeModal;
    }

    function closeModal() {
        document.getElementById('bili-extractor-modal').style.display = 'none';
        document.getElementById('bili-extractor-overlay').style.display = 'none';
    }

    function sanitizeFilename(name) {
        return name.replace(/[\\/:*?"<>|]/g, '_').trim();
    }

    function extractLinks() {
        document.getElementById('bili-extractor-modal').style.display = 'block';
        document.getElementById('bili-extractor-overlay').style.display = 'block';
        const contentDiv = document.getElementById('be-content');
        
        // 获取标题
        let title = document.title.split('_')[0];
        title = sanitizeFilename(title);

        // 获取 playinfo
        let playinfo = (typeof unsafeWindow !== 'undefined' ? unsafeWindow.__playinfo__ : null) || window.__playinfo__;
        
        if (!playinfo) {
             const scripts = document.getElementsByTagName('script');
             for (let s of scripts) {
                 if (s.innerHTML.includes('__playinfo__')) {
                     const m = s.innerHTML.match(/window\.__playinfo__\s*=\s*({.+?})(?:;|<\/script)/);
                     if (m) { playinfo = JSON.parse(m[1]); break; }
                 }
             }
        }

        if (!playinfo || !playinfo.data || !playinfo.data.dash) {
            contentDiv.innerHTML = '<p style="color:red">无法获取 DASH 流信息 (可能是 FLV 格式或未加载)。</p>';
            return;
        }

        const dash = playinfo.data.dash;
        // 视频流列表
        const videoList = dash.video || [];
        // 音频流 (通常取第一个即可)
        const audioUrl = dash.audio && dash.audio.length > 0 ? dash.audio[0].baseUrl : '';
        const referer = "https://www.bilibili.com";
        const ua = navigator.userAgent;

        const vName = `"${title}_video.m4s"`;
        const aName = `"${title}_audio.m4s"`;
        const outName = `"${title}.mp4"`;

        // 1. 生成画质选择下拉框
        let selectHtml = `<select id="be-quality-select" class="be-select">`;
        videoList.forEach((v, index) => {
            // 生成可读的描述，比如 "1920x1080 (Codec ID: 7, 3000kbps)"
            const kbps = v.bandwidth ? (v.bandwidth / 1024).toFixed(0) : '?';
            const info = `${v.width}x${v.height} | ID:${v.id} | ${kbps}kbps`;
            selectHtml += `<option value="${index}">${info}</option>`;
        });
        selectHtml += `</select>`;

        // 2. 准备容器
        contentDiv.innerHTML = `
            <div class="be-section">
                <div class="be-label">选择画质:</div>
                ${selectHtml}
            </div>
            <div id="be-commands-container"></div>
        `;

        // 3. 定义更新命令的函数
        function updateCommands(index) {
            const videoObj = videoList[index];
            const videoUrl = videoObj.baseUrl;

            const curlVideo = `curl.exe -L -H "Referer: ${referer}" -H "User-Agent: ${ua}" "${videoUrl}" -o ${vName}`;
            const curlAudio = audioUrl ? `curl.exe -L -H "Referer: ${referer}" -H "User-Agent: ${ua}" "${audioUrl}" -o ${aName}` : '';
            const ffmpegCmd = audioUrl ? `ffmpeg -i ${vName} -i ${aName} -c copy ${outName}` : `ffmpeg -i ${vName} -c copy ${outName}`;

            let comboCmd = "";
            if (audioUrl) {
                 comboCmd = `${curlVideo} ; ${curlAudio} ; ${ffmpegCmd} ; del ${vName} ; del ${aName}`;
            } else {
                 comboCmd = `${curlVideo} ; ${ffmpegCmd} ; del ${vName}`;
            }

            const container = document.getElementById('be-commands-container');
            container.innerHTML = `
                <div class="be-section">
                    <div style="color:#00AEEC; font-weight:bold; margin-bottom:5px">🚀 一键全自动 (PowerShell) - ${videoObj.width}x${videoObj.height}</div>
                    <div style="font-size:12px; color:#666; margin-bottom:5px">下载视频 + 下载音频 + 合并 + 删除临时文件</div>
                    <textarea class="be-textarea" id="c-combo" style="height:80px; border:2px solid #00AEEC">${comboCmd}</textarea>
                    <button class="be-btn" style="background:#00AEEC; color:white; border:none" onclick="
                        document.getElementById('c-combo').select();
                        document.execCommand('copy');
                    ">复制一键命令</button>
                </div>
                
                <details>
                    <summary style="cursor:pointer; color:#999; font-size:12px; margin-bottom:10px">查看分步命令 (出错时使用)</summary>
                    <div class="be-section">
                        <div><strong>视频流 (${videoObj.width}x${videoObj.height}):</strong></div>
                        <textarea class="be-textarea" id="c-v">${curlVideo}</textarea>
                        <button class="be-btn" onclick="document.getElementById('c-v').select();document.execCommand('copy');">复制 Video 命令</button>
                    </div>
                    ${audioUrl ? `
                    <div class="be-section">
                        <div><strong>音频流:</strong></div>
                        <textarea class="be-textarea" id="c-a">${curlAudio}</textarea>
                        <button class="be-btn" onclick="document.getElementById('c-a').select();document.execCommand('copy');">复制 Audio 命令</button>
                    </div>` : ''}
                    <div class="be-section">
                        <div><strong>合并命令:</strong></div>
                        <textarea class="be-textarea" id="c-m">${ffmpegCmd}</textarea>
                        <button class="be-btn" onclick="document.getElementById('c-m').select();document.execCommand('copy');">复制合并命令</button>
                    </div>
                </details>
            `;
        }

        // 4. 绑定事件和初始化
        const selectEl = document.getElementById('be-quality-select');
        selectEl.addEventListener('change', function() {
            updateCommands(this.value);
        });

        // 初始化显示默认（第一个）画质
        if (videoList.length > 0) {
            updateCommands(0);
        }
    }

    setTimeout(createUI, 1500);
})();