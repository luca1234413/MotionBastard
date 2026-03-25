// Motion AI Assistant - App Logic
// Phase 2: Claude API integration, streaming responses, code extraction

(function () {
    // ===== DOM References =====
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const welcomeState = document.getElementById('welcomeState');
    const imgUploadBtn = document.getElementById('imgUploadBtn');
    const imgFileInput = document.getElementById('imgFileInput');

    const tabPreview = document.getElementById('tabPreview');
    const tabCode = document.getElementById('tabCode');
    const previewArea = document.getElementById('previewArea');
    const codeArea = document.getElementById('codeArea');

    const codeText = document.getElementById('codeText');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const executeBtn = document.getElementById('executeBtn');

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const settingsCancelBtn = document.getElementById('settingsCancelBtn');
    const settingsSaveBtn = document.getElementById('settingsSaveBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const modelSelect = document.getElementById('modelSelect');

    const statusDot = document.getElementById('statusDot');
    const statusComp = document.getElementById('statusComp');
    const statusLayer = document.getElementById('statusLayer');

    // ===== System Prompt (hardcoded Phase 2, remote Phase 5) =====
    const SYSTEM_PROMPT = `## Role

你是一个做了十几年动效的老炮儿，技术流，AE 和前端都玩得很溜。你对动画有洁癖，看不惯粗糙的活儿。你说话直接、毒舌，偶尔会嘲讽用户的想法（"你确定要做这个？2015 年的品味"），但骨子里是在帮他们做出更好的东西。你不会无脑夸用户的需求，觉得丑就会说，觉得方向错了会怼回去。但如果用户的想法确实好，你也会干脆利落地认。

废话少说，干活利索。代码之外的文字控制在 3-5 句以内。

---

## 需求完整性判断

一个可执行的动效需求需要四个要素：

1. **效果**：想要什么视觉效果
2. **场景**：用在哪（网页 / 视频 / App / 社交媒体）
3. **时长节奏**：多长、是否循环、缓动偏好
4. **风格**：调性或参考素材

四个要素齐全 → 进入路径判断。
有缺失 → 用最少的问题补齐（一次最多问 2 个）。
**需求不明确时不动手写代码，除非用户明确要求"先做一版看看"。**

---

## 用户环境（首次对话时收集，后续复用）

首次对话时自然地了解：AE 版本、已装的第三方插件（Trapcode、Red Giant 等）、操作系统、前端开发环境。不要一次全问，缺什么问什么。

---

## 核心工作流：需求分流

### 路径判断

#### → 前端代码路径（JS/CSS/React）
适用：UI 动效、SVG 动画、CSS 过渡、数据可视化、Lottie、交互动画、循环装饰动画
技术栈优先级：CSS Animation > Framer Motion > GSAP > Three.js > Canvas

#### → AE ExtendScript 路径
适用：第三方插件效果、3D 摄像机、复杂合成、视频级输出、运动跟踪、表达式驱动动画

#### → 混合路径
前端做基础 + AE 做后期，或 AE 出素材 + 前端引用

#### → 建议手动
手动操作比脚本更快时直接说明。

走 AE 路径时，先确认所需插件是否已安装。未安装则提供原生替代方案。

---

## 代码生成规范

### ExtendScript（AE .jsx）
- app.beginUndoGroup() / app.endUndoGroup() 包裹
- 可调参数提取到顶部 CONFIG 对象，附中文注释
- try-catch 包裹主逻辑
- ES3 语法（无 let/const/箭头函数/forEach）

### 前端动画代码
- 输出可直接运行的完整 HTML+CSS+JS 单文件
- 关键参数附注释

---

## 代码输出格式

当你生成代码时，必须用 markdown 代码块包裹，并标注语言：
- AE 脚本用 \\\`\\\`\\\`jsx
- 前端代码用 \\\`\\\`\\\`html 或 \\\`\\\`\\\`css 或 \\\`\\\`\\\`javascript

---

## 沟通风格

- **中文为主**，技术术语保留英文（如 keyframe、easing、comp）
- **毒舌但不越界**：嘲讽审美和技术判断，不攻击人
- **给理由**，每个建议都说为什么，但说一句够了，不要展开成教程
- **承认边界**，ExtendScript 搞不定的东西主动说`;

    // ===== State =====
    var conversationHistory = [];
    var pendingImages = [];
    var isStreaming = false;
    var MAX_IMAGES = 3;

    // ===== Image Preview Strip =====
    var inputImages = document.getElementById('inputImages');

    function renderPendingImages() {
        inputImages.innerHTML = '';
        pendingImages.forEach(function (dataUrl, index) {
            var thumb = document.createElement('div');
            thumb.className = 'input-img-thumb';

            var img = document.createElement('img');
            img.src = dataUrl;
            thumb.appendChild(img);

            var removeBtn = document.createElement('div');
            removeBtn.className = 'input-img-remove';
            removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            removeBtn.addEventListener('click', function () {
                pendingImages.splice(index, 1);
                renderPendingImages();
                updateUploadBtnState();
            });
            thumb.appendChild(removeBtn);

            inputImages.appendChild(thumb);
        });
    }

    function updateUploadBtnState() {
        if (pendingImages.length >= MAX_IMAGES) {
            imgUploadBtn.style.opacity = '0.3';
            imgUploadBtn.style.pointerEvents = 'none';
            imgUploadBtn.title = 'Max 3 images';
        } else {
            imgUploadBtn.style.opacity = '1';
            imgUploadBtn.style.pointerEvents = 'auto';
            imgUploadBtn.title = 'Upload reference image (max 3)';
        }
    }

    function addPendingImage(dataUrl) {
        if (pendingImages.length >= MAX_IMAGES) return;
        pendingImages.push(dataUrl);
        renderPendingImages();
        updateUploadBtnState();
    }

    // ===== Tab Switching =====
    tabPreview.addEventListener('click', function () {
        tabPreview.classList.add('active');
        tabCode.classList.remove('active');
        previewArea.style.display = 'flex';
        codeArea.classList.remove('active');
    });

    tabCode.addEventListener('click', function () {
        tabCode.classList.add('active');
        tabPreview.classList.remove('active');
        previewArea.style.display = 'none';
        codeArea.classList.add('active');
    });

    // ===== Chat UI =====
    function addMessage(text, type, images) {
        if (welcomeState) welcomeState.style.display = 'none';

        var msgDiv = document.createElement('div');
        msgDiv.className = 'msg msg-' + type;

        if (images && images.length > 0) {
            var imgRow = document.createElement('div');
            imgRow.style.cssText = 'display:flex;gap:4px;margin-bottom:6px;';
            images.forEach(function (dataUrl) {
                var img = document.createElement('img');
                img.className = 'msg-img';
                img.src = dataUrl;
                imgRow.appendChild(img);
            });
            msgDiv.appendChild(imgRow);
        }

        if (text) msgDiv.appendChild(document.createTextNode(text));

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    function createStreamingMessage() {
        if (welcomeState) welcomeState.style.display = 'none';
        var msgDiv = document.createElement('div');
        msgDiv.className = 'msg msg-ai';
        msgDiv.textContent = '...';
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    function addRouteTag(route) {
        var tagDiv = document.createElement('div');
        tagDiv.style.cssText = 'align-self: flex-start; margin-top: -4px;';
        var tag = document.createElement('span');
        tag.className = 'route-tag ' + (route === 'frontend' ? 'frontend' : 'ae');
        tag.textContent = route === 'frontend' ? '→ Frontend' : '→ AE Script';
        tagDiv.appendChild(tag);
        chatMessages.appendChild(tagDiv);
    }

    // ===== Code Extraction =====
    function extractCodeBlocks(fullText) {
        var blocks = [];
        var regex = /```(\w*)\n([\s\S]*?)```/g;
        var match;
        while ((match = regex.exec(fullText)) !== null) {
            blocks.push({ lang: match[1].toLowerCase(), code: match[2].trim() });
        }
        return blocks;
    }

    function getDisplayText(fullText) {
        return fullText.replace(/```\w*\n[\s\S]*?```/g, '').trim();
    }

    function detectRoute(lang) {
        if (lang === 'jsx' || lang === 'extendscript') return 'ae';
        if (['html', 'css', 'javascript', 'js', 'typescript', 'ts'].indexOf(lang) !== -1) return 'frontend';
        return null;
    }

    var currentCodeBlock = null;

    function pushCodeToPanel(codeBlock) {
        currentCodeBlock = codeBlock;
        codeText.textContent = codeBlock.code;

        var route = detectRoute(codeBlock.lang);
        if (route) addRouteTag(route);

        if (route === 'ae') {
            // AE path: show execute button, switch to code tab
            executeBtn.classList.remove('hidden');
            executeBtn.textContent = 'Confirm & Execute';
            tabCode.click();
        } else if (route === 'frontend') {
            // Frontend path: render preview, switch to preview tab
            executeBtn.classList.add('hidden');
            renderPreview(codeBlock);
            tabPreview.click();
        } else {
            executeBtn.classList.add('hidden');
            tabCode.click();
        }
    }

    // ===== AE Script Execution =====
    executeBtn.addEventListener('click', function () {
        if (!currentCodeBlock || !isConnectedToAE) return;

        executeBtn.textContent = 'Executing...';
        executeBtn.disabled = true;

        var script = currentCodeBlock.code;

        // Load host.jsx first (ensures environment), then execute the generated script
        var extensionPath = csInterface.getSystemPath('extension');
        var fullScript = '$.evalFile("' + extensionPath + '/jsx/host.jsx"); ' + script;

        csInterface.evalScript(fullScript, function (result) {
            executeBtn.disabled = false;

            if (result === 'EvalScript_ErrMessage' || (result && result.indexOf('Error') === 0)) {
                executeBtn.textContent = 'Error — Retry';
                addMessage('Script error: ' + (result || 'Unknown error'), 'ai');
            } else {
                executeBtn.textContent = 'Executed ✓';
                addMessage('Script executed successfully.', 'ai');
                setTimeout(function () {
                    executeBtn.textContent = 'Re-execute';
                }, 2000);
            }
        });
    });

    // ===== Frontend Preview =====
    var previewContainer = document.getElementById('previewContainer');
    var previewPlayBtn = document.getElementById('previewPlayBtn');
    var previewPauseBtn = document.getElementById('previewPauseBtn');
    var previewIframe = null;

    function renderPreview(codeBlock) {
        // Clear previous preview
        previewContainer.innerHTML = '';

        // Create iframe for sandboxed rendering
        previewIframe = document.createElement('iframe');
        previewIframe.style.cssText = 'width:100%;height:100%;border:none;background:#1e1e1e;';
        previewIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        previewContainer.appendChild(previewIframe);

        var code = codeBlock.code;
        var lang = codeBlock.lang;
        var htmlContent = '';

        if (lang === 'html') {
            // Full HTML — use as-is
            htmlContent = code;
        } else if (lang === 'css') {
            // CSS animation — wrap in HTML with a demo element
            htmlContent = '<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#1e1e1e;overflow:hidden;}' + code + '</style></head><body><div class="demo"></div></body></html>';
        } else if (lang === 'javascript' || lang === 'js') {
            // JS — wrap in HTML with canvas
            htmlContent = '<!DOCTYPE html><html><head><style>body{margin:0;background:#1e1e1e;overflow:hidden;}canvas{display:block;}</style></head><body><canvas id="canvas"></canvas><script>' + code + '<\/script></body></html>';
        } else {
            // Fallback: treat as HTML
            htmlContent = code;
        }

        // Write to iframe
        var doc = previewIframe.contentDocument || previewIframe.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Enable play/pause buttons
        previewPlayBtn.disabled = false;
        previewPauseBtn.disabled = false;
    }

    // Play/Pause toggle for preview
    previewPlayBtn.addEventListener('click', function () {
        if (!previewIframe) return;
        previewPlayBtn.classList.add('hidden');
        previewPauseBtn.classList.remove('hidden');

        // Reload iframe to restart animations
        var doc = previewIframe.contentDocument || previewIframe.contentWindow.document;
        var html = doc.documentElement.outerHTML;
        doc.open();
        doc.write(html);
        doc.close();
    });

    previewPauseBtn.addEventListener('click', function () {
        if (!previewIframe) return;
        previewPauseBtn.classList.add('hidden');
        previewPlayBtn.classList.remove('hidden');

        // Pause all animations in iframe
        try {
            var iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
            var style = iframeDoc.createElement('style');
            style.textContent = '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }';
            iframeDoc.head.appendChild(style);
        } catch (e) {}
    });

    // ===== Claude API =====
    function getApiKey() {
        return localStorage.getItem('motionai_api_key') || '';
    }

    function getModel() {
        return localStorage.getItem('motionai_model') || 'anthropic/claude-sonnet-4';
    }

    function getProvider() {
        return localStorage.getItem('motionai_provider') || 'openrouter';
    }

    function buildApiMessage(text, images) {
        var provider = getProvider();

        if (provider === 'openrouter') {
            // OpenAI format
            var content = [];
            if (images && images.length > 0) {
                images.forEach(function (dataUrl) {
                    content.push({ type: 'image_url', image_url: { url: dataUrl } });
                });
            }
            if (text) {
                content.push({ type: 'text', text: text });
            }
            return { role: 'user', content: content.length === 1 && content[0].type === 'text' ? text : content };
        } else {
            // Anthropic format
            var content = [];
            if (images && images.length > 0) {
                images.forEach(function (dataUrl) {
                    var parts = dataUrl.split(',');
                    var mimeMatch = parts[0].match(/data:(.*?);/);
                    var mediaType = mimeMatch ? mimeMatch[1] : 'image/png';
                    content.push({
                        type: 'image',
                        source: { type: 'base64', media_type: mediaType, data: parts[1] }
                    });
                });
            }
            if (text) {
                content.push({ type: 'text', text: text });
            }
            return { role: 'user', content: content };
        }
    }

    function buildRequestConfig(requestBody) {
        var provider = getProvider();
        var apiKey = getApiKey();

        if (provider === 'openrouter') {
            return {
                hostname: 'openrouter.ai',
                path: '/api/v1/chat/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey,
                    'HTTP-Referer': 'https://motion-ai-assistant.local',
                    'X-Title': 'Motion AI Assistant'
                }
            };
        } else {
            return {
                hostname: 'api.anthropic.com',
                path: '/v1/messages',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }
            };
        }
    }

    function buildRequestBody() {
        var provider = getProvider();

        if (provider === 'openrouter') {
            return JSON.stringify({
                model: getModel(),
                max_tokens: 4096,
                stream: true,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT }
                ].concat(conversationHistory)
            });
        } else {
            return JSON.stringify({
                model: getModel(),
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                stream: true,
                messages: conversationHistory
            });
        }
    }

    function parseSSEDelta(event) {
        var provider = getProvider();

        if (provider === 'openrouter') {
            // OpenAI format: choices[0].delta.content
            if (event.choices && event.choices[0] && event.choices[0].delta && event.choices[0].delta.content) {
                return event.choices[0].delta.content;
            }
        } else {
            // Anthropic format: delta.text
            if (event.type === 'content_block_delta' && event.delta && event.delta.text) {
                return event.delta.text;
            }
        }
        return null;
    }

    function resetStreamingState() {
        isStreaming = false;
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
    }

    async function streamChatResponse(userText, userImages) {
        var apiKey = getApiKey();
        if (!apiKey) {
            addMessage('请先在 Settings 中设置 API Key。', 'ai');
            settingsOverlay.classList.add('active');
            return;
        }

        isStreaming = true;
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';

        var apiMsg = buildApiMessage(userText, userImages);
        conversationHistory.push(apiMsg);

        var aiMsgDiv = createStreamingMessage();
        var fullText = '';

        var requestBody = buildRequestBody();
        var config = buildRequestConfig(requestBody);

        try {
            var nodeHttps = require('https');
            var nodeBuffer = require('buffer').Buffer;

            var options = {
                hostname: config.hostname,
                port: 443,
                path: config.path,
                method: 'POST',
                headers: Object.assign({}, config.headers, {
                    'Content-Length': nodeBuffer.byteLength(requestBody, 'utf8')
                })
            };

            await new Promise(function (resolve) {
                var req = nodeHttps.request(options, function (res) {
                    if (res.statusCode !== 200) {
                        var errData = '';
                        res.on('data', function (chunk) { errData += chunk; });
                        res.on('end', function () {
                            var errMsg = 'API Error: ' + res.statusCode;
                            try {
                                var errJson = JSON.parse(errData);
                                errMsg = errJson.error ? errJson.error.message : errMsg;
                            } catch (e) {}
                            aiMsgDiv.textContent = errMsg;
                            conversationHistory.pop();
                            resetStreamingState();
                            resolve();
                        });
                        return;
                    }

                    var sseBuffer = '';
                    res.setEncoding('utf8');

                    res.on('data', function (chunk) {
                        sseBuffer += chunk;
                        var lines = sseBuffer.split('\n');
                        sseBuffer = lines.pop();

                        for (var i = 0; i < lines.length; i++) {
                            var line = lines[i].trim();
                            if (!line.startsWith('data: ')) continue;
                            var data = line.substring(6);
                            if (data === '[DONE]') continue;

                            try {
                                var evt = JSON.parse(data);
                                var delta = parseSSEDelta(evt);
                                if (delta) {
                                    fullText += delta;
                                    var dt = getDisplayText(fullText);
                                    aiMsgDiv.textContent = dt || '...';
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                            } catch (e) {}
                        }
                    });

                    res.on('end', function () {
                        finishResponse(aiMsgDiv, fullText);
                        resolve();
                    });
                });

                req.on('error', function (e) {
                    aiMsgDiv.textContent = 'Connection error: ' + e.message;
                    conversationHistory.pop();
                    resetStreamingState();
                    resolve();
                });

                req.setTimeout(60000, function () {
                    req.destroy();
                    aiMsgDiv.textContent = 'Request timed out. Please try again.';
                    conversationHistory.pop();
                    resetStreamingState();
                    resolve();
                });

                req.write(requestBody);
                req.end();
            });

        } catch (nodeErr) {
            // Fallback: try fetch (may work in some CEP versions)
            try {
                var config2 = buildRequestConfig(requestBody);
                var fetchUrl = 'https://' + config2.hostname + config2.path;

                var response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: config2.headers,
                    body: requestBody
                });

                if (!response.ok) {
                    var errText = await response.text();
                    var errMsg = 'API Error: ' + response.status;
                    try { errMsg = JSON.parse(errText).error.message; } catch (e) {}
                    aiMsgDiv.textContent = errMsg;
                    conversationHistory.pop();
                    resetStreamingState();
                    return;
                }

                var reader = response.body.getReader();
                var decoder = new TextDecoder();
                var fetchBuffer = '';

                while (true) {
                    var result = await reader.read();
                    if (result.done) break;

                    fetchBuffer += decoder.decode(result.value, { stream: true });
                    var flines = fetchBuffer.split('\n');
                    fetchBuffer = flines.pop();

                    for (var j = 0; j < flines.length; j++) {
                        var fline = flines[j].trim();
                        if (!fline.startsWith('data: ')) continue;
                        var fdata = fline.substring(6);
                        if (fdata === '[DONE]') continue;
                        try {
                            var fevt = JSON.parse(fdata);
                            var fdelta = parseSSEDelta(fevt);
                            if (fdelta) {
                                fullText += fdelta;
                                aiMsgDiv.textContent = getDisplayText(fullText) || '...';
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        } catch (e) {}
                    }
                }

                finishResponse(aiMsgDiv, fullText);

            } catch (fetchErr) {
                aiMsgDiv.textContent = 'Error: ' + (fetchErr.message || 'Unknown error');
                conversationHistory.pop();
                resetStreamingState();
            }
        }
    }

    function finishResponse(aiMsgDiv, fullText) {
        var displayText = getDisplayText(fullText);
        if (!displayText && fullText) {
            aiMsgDiv.textContent = 'Code generated — see Code panel.';
        } else {
            aiMsgDiv.textContent = displayText || '';
        }

        var codeBlocks = extractCodeBlocks(fullText);
        if (codeBlocks.length > 0) {
            pushCodeToPanel(codeBlocks[codeBlocks.length - 1]);
        }

        conversationHistory.push({ role: 'assistant', content: fullText });
        resetStreamingState();
    }

    // ===== Send =====
    // ===== Send (base version, overridden in AE Bridge section) =====
    function handleSend() {
        if (isStreaming) return;

        var text = chatInput.value.trim();
        if (!text && pendingImages.length === 0) return;

        var images = pendingImages.length > 0 ? pendingImages.slice() : null;
        addMessage(text, 'user', images);
        chatInput.value = '';

        var sentImages = pendingImages.slice();
        pendingImages = [];
        renderPendingImages();
        updateUploadBtnState();

        streamChatResponse(text, sentImages);
    }

    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // ===== Clear Conversation =====
    clearBtn.addEventListener('click', function () {
        conversationHistory = [];
        pendingImages = [];
        renderPendingImages();
        updateUploadBtnState();
        chatMessages.innerHTML = '';

        var welcome = document.createElement('div');
        welcome.className = 'welcome';
        welcome.id = 'welcomeState';
        welcome.innerHTML = '<div class="welcome-title">Motion AI Assistant</div>' +
            '<div class="welcome-sub">Describe your motion effect — I\'ll figure out the best way to build it.</div>';
        chatMessages.appendChild(welcome);

        codeText.textContent = '// Generated code will appear here';
        executeBtn.classList.add('hidden');
    });

    // ===== Image Upload =====
    imgUploadBtn.addEventListener('click', function () {
        if (pendingImages.length >= MAX_IMAGES) return;
        imgFileInput.click();
    });

    imgFileInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (event) { addPendingImage(event.target.result); };
        reader.readAsDataURL(file);
        imgFileInput.value = '';
    });

    document.addEventListener('paste', function (e) {
        if (pendingImages.length >= MAX_IMAGES) return;
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                var file = items[i].getAsFile();
                var reader = new FileReader();
                reader.onload = function (event) { addPendingImage(event.target.result); };
                reader.readAsDataURL(file);
                break;
            }
        }
    });

    // ===== Copy Code =====
    copyCodeBtn.addEventListener('click', function () {
        var code = codeText.textContent;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(function () {
                copyCodeBtn.textContent = 'Copied!';
                setTimeout(function () { copyCodeBtn.textContent = 'Copy'; }, 1500);
            });
        }
    });

    // ===== Settings =====
    var providerSelect = document.getElementById('providerSelect');

    settingsBtn.addEventListener('click', function () {
        apiKeyInput.value = localStorage.getItem('motionai_api_key') || '';
        modelSelect.value = localStorage.getItem('motionai_model') || 'anthropic/claude-sonnet-4';
        providerSelect.value = localStorage.getItem('motionai_provider') || 'openrouter';
        updateModelOptions();
        settingsOverlay.classList.add('active');
    });

    settingsCancelBtn.addEventListener('click', function () {
        settingsOverlay.classList.remove('active');
    });

    settingsSaveBtn.addEventListener('click', function () {
        localStorage.setItem('motionai_api_key', apiKeyInput.value.trim());
        localStorage.setItem('motionai_model', modelSelect.value);
        localStorage.setItem('motionai_provider', providerSelect.value);
        settingsOverlay.classList.remove('active');
    });

    settingsOverlay.addEventListener('click', function (e) {
        if (e.target === settingsOverlay) settingsOverlay.classList.remove('active');
    });

    // Show/hide model groups based on provider
    function updateModelOptions() {
        var p = providerSelect.value;
        document.getElementById('modelsOpenRouter').style.display = p === 'openrouter' ? '' : 'none';
        document.getElementById('modelsAnthropic').style.display = p === 'anthropic' ? '' : 'none';

        // Auto-select first visible option if current is hidden
        var current = modelSelect.value;
        var currentOption = modelSelect.querySelector('option[value="' + current + '"]');
        if (currentOption && currentOption.parentElement.style.display === 'none') {
            var visible = modelSelect.querySelector('optgroup[style=""] option, optgroup:not([style]) option');
            if (visible) modelSelect.value = visible.value;
        }
    }

    providerSelect.addEventListener('change', updateModelOptions);

    // ===== Resize Handle =====
    var rightPanel = document.getElementById('rightPanel');
    var mainContainer = document.querySelector('.main');
    var isDragging = false;

    rightPanel.addEventListener('mousedown', function (e) {
        var rect = rightPanel.getBoundingClientRect();
        if (e.clientX > rect.left + 5) return;
        isDragging = true;
        rightPanel.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        var mainRect = mainContainer.getBoundingClientRect();
        var rightWidth = mainRect.right - e.clientX;
        if (rightWidth < 180) rightWidth = 180;
        if (mainRect.width - rightWidth < 200) rightWidth = mainRect.width - 200;
        rightPanel.style.width = rightWidth + 'px';
    });

    document.addEventListener('mouseup', function () {
        if (!isDragging) return;
        isDragging = false;
        rightPanel.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });

    // ===== AE Bridge =====
    var csInterface = new CSInterface();
    var isConnectedToAE = !!window.__adobe_cep__;
    var lastCompContext = null;

    function pollAEStatus() {
        if (!isConnectedToAE) return;

        csInterface.evalScript('getStatusInfo()', function (result) {
            try {
                var info = JSON.parse(result);
                if (info.connected) {
                    statusDot.classList.add('connected');
                    statusComp.textContent = info.comp || 'No composition open';
                    if (info.layer) {
                        statusLayer.textContent = info.layer.name + ' (' + info.layer.type + ')';
                    } else {
                        statusLayer.textContent = 'No layer selected';
                    }
                }
            } catch (e) {
                statusDot.classList.remove('connected');
                statusComp.textContent = 'AE not responding';
                statusLayer.textContent = '';
            }
        });
    }

    function fetchCompContext(callback) {
        if (!isConnectedToAE) {
            callback(null);
            return;
        }

        csInterface.evalScript('getCompContext()', function (result) {
            try {
                var ctx = JSON.parse(result);
                if (!ctx.error) {
                    lastCompContext = ctx;
                    callback(ctx);
                } else {
                    callback(null);
                }
            } catch (e) {
                callback(null);
            }
        });
    }

    function formatContextForClaude(ctx) {
        if (!ctx) return '';

        var lines = [];
        lines.push('[AE Context]');
        lines.push('Comp: ' + ctx.comp.name + ' (' + ctx.comp.width + 'x' + ctx.comp.height + ', ' + ctx.comp.frameRate + 'fps, ' + ctx.comp.duration.toFixed(2) + 's)');
        lines.push('Layers (' + ctx.comp.numLayers + '):');

        for (var i = 0; i < ctx.allLayers.length; i++) {
            var l = ctx.allLayers[i];
            lines.push('  ' + l.index + '. ' + l.name + ' [' + l.type + ']' + (l.visible ? '' : ' (hidden)'));
        }

        if (ctx.selectedLayers.length > 0) {
            lines.push('Selected:');
            for (var j = 0; j < ctx.selectedLayers.length; j++) {
                var s = ctx.selectedLayers[j];
                lines.push('  → ' + s.name + ' [' + s.type + ']');
                if (s.position) lines.push('    pos: [' + s.position.join(', ') + ']');
                if (s.scale) lines.push('    scale: [' + s.scale.join(', ') + ']');
                if (s.opacity !== null) lines.push('    opacity: ' + s.opacity);
                if (s.effects.length > 0) {
                    lines.push('    effects: ' + s.effects.map(function (e) { return e.name; }).join(', '));
                }
            }
        }

        return lines.join('\n');
    }

    // ===== Override handleSend to inject AE context =====
    if (isConnectedToAE) {
        handleSend = function () {
            if (isStreaming) return;

            var text = chatInput.value.trim();
            if (!text && pendingImages.length === 0) return;

            var images = pendingImages.length > 0 ? pendingImages.slice() : null;
            addMessage(text, 'user', images);
            chatInput.value = '';

            var sentImages = pendingImages.slice();
            pendingImages = [];
            renderPendingImages();
            updateUploadBtnState();

            // Fetch AE context, then send to Claude
            fetchCompContext(function (ctx) {
                var enrichedText = text;
                if (ctx) {
                    enrichedText = text + '\n\n' + formatContextForClaude(ctx);
                }
                streamChatResponse(enrichedText, sentImages);
            });
        };
    }

    // Bind send button (works with either version of handleSend)
    sendBtn.addEventListener('click', function () { handleSend(); });

    // ===== Init =====
    if (isConnectedToAE) {
        // Manually load host.jsx to ensure functions are available
        var extensionPath = csInterface.getSystemPath('extension');
        var hostPath = extensionPath + '/jsx/host.jsx';
        var loadScript = 'try{$.evalFile("' + hostPath + '"); "ok";}catch(e){e.toString();}';

        csInterface.evalScript(loadScript, function (loadResult) {
            if (loadResult === 'ok') {
                statusDot.classList.add('connected');
                statusComp.textContent = 'Connected';
                statusLayer.textContent = '';
                pollAEStatus();
                setInterval(pollAEStatus, 1000);
            } else {
                statusDot.classList.remove('connected');
                statusComp.textContent = 'Script load failed';
                statusLayer.textContent = loadResult || '';
            }
        });
    } else {
        statusDot.classList.remove('connected');
        statusComp.textContent = 'Not in AE';
        statusLayer.textContent = getApiKey() ? 'API ready (standalone mode)' : 'Set API Key in Settings';
    }

})();
