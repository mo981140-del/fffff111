document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        ar: {
            brand_sub: "API Client", tab_history: "التاريخ", tab_collections: "المجموعات", tab_new_request: "طلب جديد",
            btn_send: "إرسال", btn_sending: "جاري الإرسال...", btn_cancel: "إلغاء", btn_about: "نبذة عن البرنامج", btn_close: "إغلاق",
            btn_add_row: "+ إضافة", btn_format: "تنسيق JSON", btn_copy: "نسخ",
            itab_params: "المعاملات (Params)", itab_headers: "الترويسات (Headers)", itab_auth: "التوثيق (Auth)", itab_body: "البيانات (Body)", itab_code: "توليد الكود",
            auth_none: "بدون توثيق", auth_bearer: "Bearer Token", auth_basic: "Basic Auth",
            body_json: "JSON", body_form: "Form URL Encoded", body_raw: "Raw",
            res_empty_title: "جاهز لإرسال الطلب...", res_empty_desc: "أدخل رابط الـ API واضغط إرسال",
            res_status: "الحالة:", res_time: "الوقت:", res_size: "الحجم:",
            res_pretty: "تنسيق JSON", res_raw: "نص خام",
            about_title: "نبذة عن البرنامج",
            about_text: "تم تطوير هذا البرنامج بواسطة منصة DevVortex ليكون بديلاً خفيفاً، سريعاً، وآمناً لبرامج اختبار الـ APIs الثقيلة مثل Postman. البرنامج يعمل محلياً 100% (Zero Telemetry) ولا يرسل بياناتك لأي خوادم خارجية.",
            lang_btn: "English"
        },
        en: {
            brand_sub: "API Client", tab_history: "History", tab_collections: "Collections", tab_new_request: "New Request",
            btn_send: "Send", btn_sending: "Sending...", btn_cancel: "Cancel", btn_about: "About", btn_close: "Close",
            btn_add_row: "+ Add Row", btn_format: "Format JSON", btn_copy: "Copy",
            itab_params: "Params", itab_headers: "Headers", itab_auth: "Auth", itab_body: "Body", itab_code: "Code Gen",
            auth_none: "None", auth_bearer: "Bearer Token", auth_basic: "Basic Auth",
            body_json: "JSON", body_form: "Form URL Encoded", body_raw: "Raw",
            res_empty_title: "Ready to send...", res_empty_desc: "Enter API URL and click Send",
            res_status: "Status:", res_time: "Time:", res_size: "Size:",
            res_pretty: "Pretty (JSON)", res_raw: "Raw",
            about_title: "About Program",
            about_text: "Developed by DevVortex as a lightweight, fast, and secure alternative to heavy API clients like Postman. Runs 100% locally (Zero Telemetry).",
            lang_btn: "العربية"
        }
    };

    let currentLang = 'ar';
    const applyLanguage = (lang) => {
        currentLang = lang;
        const dict = translations[lang];
        document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
        document.getElementById('langText').textContent = dict.lang_btn;
    };

    document.getElementById('langToggle').addEventListener('click', () => applyLanguage(currentLang === 'ar' ? 'en' : 'ar'));

    document.querySelectorAll('.sidebar-tabs .stab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.sidebar-tabs .stab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            const target = e.target.getAttribute('data-target');
            document.getElementById('historyList').classList.toggle('hidden', target !== 'history');
            document.getElementById('collectionsList').classList.toggle('hidden', target !== 'collections');
        });
    });

    document.querySelectorAll('.inner-tabs .itab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const parent = e.target.closest('.request-area, .response-area');
            parent.querySelectorAll('.itab').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.itab-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            parent.querySelector('#' + targetId).classList.add('active');
        });
    });

    document.getElementById('authType').addEventListener('change', (e) => {
        const type = e.target.value;
        const fields = document.getElementById('authFields');
        if (type === 'bearer') fields.innerHTML = `<input type="text" id="bearerToken" placeholder="Token" style="width:100%">`;
        else if (type === 'basic') fields.innerHTML = `<input type="text" id="basicUser" placeholder="Username" style="width:100%;margin-bottom:10px"><input type="text" id="basicPass" placeholder="Password" style="width:100%">`;
        else fields.innerHTML = '';
    });

    window.formatJSON = () => {
        const body = document.getElementById('bodyInput');
        try {
            const parsed = JSON.parse(body.value);
            body.value = JSON.stringify(parsed, null, 4);
        } catch (e) {
            alert('صيغة JSON غير صحيحة! / Invalid JSON!');
        }
    };

    let currentAbortController = null;
    const sendBtn = document.getElementById('sendBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    let isSending = false;

    sendBtn.addEventListener('click', async () => {
        if (isSending) return; // منع الضغط المتكرر
        const url = document.getElementById('urlInput').value.trim();
        if (!url) return;

        const method = document.getElementById('methodSelect').value;
        const startTime = performance.now();
        
        const headers = {};
        document.querySelectorAll('#reqHeaders .kv-row').forEach(row => {
            const isChecked = row.querySelector('input[type="checkbox"]').checked;
            if (isChecked) {
                const key = row.querySelectorAll('input[type="text"]')[0].value;
                const val = row.querySelectorAll('input[type="text"]')[1].value;
                if (key && val) headers[key] = val;
            }
        });

        let body = null;
        const bodyType = document.getElementById('bodyType').value;
        const bodyVal = document.getElementById('bodyInput').value;
        if (['POST', 'PUT', 'PATCH'].includes(method) && bodyVal) {
            body = bodyVal;
            if (bodyType === 'json' && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
        }

        isSending = true;
        sendBtn.textContent = translations[currentLang].btn_sending;
        sendBtn.disabled = true;
        
        document.getElementById('responseEmpty').classList.add('hidden');
        document.getElementById('responseContent').classList.remove('hidden');

        currentAbortController = new AbortController();

        try {
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: body,
                signal: currentAbortController.signal,
                cache: 'no-store' // 🚨 حل مشكلة الفشل في الإرسال الثاني
            });

            const endTime = performance.now();
            const timeTaken = Math.round(endTime - startTime);
            const resText = await response.text();
            const resSize = new Blob([resText]).size;
            const formattedSize = resSize > 1024 ? (resSize / 1024).toFixed(2) + ' KB' : resSize + ' B';

            const statusEl = document.getElementById('resStatus');
            statusEl.textContent = `${response.status} ${response.statusText}`;
            statusEl.className = 'status-badge ' + (response.ok ? 'status-2xx' : response.status >= 500 ? 'status-5xx' : 'status-4xx');
            document.getElementById('resTime').textContent = timeTaken + ' ms';
            document.getElementById('resSize').textContent = formattedSize;

            let headersStr = '';
            response.headers.forEach((val, key) => { headersStr += `${key}: ${val}\n`; });
            document.getElementById('resHeadersOutput').textContent = headersStr;

            try {
                const jsonObj = JSON.parse(resText);
                document.getElementById('resBodyOutput').textContent = JSON.stringify(jsonObj, null, 4);
            } catch (e) {
                document.getElementById('resBodyOutput').textContent = resText;
            }
            
            addToHistory(method, url, response.status);

        } catch (error) {
            if (error.name === 'AbortError') {
                document.getElementById('resStatus').textContent = 'Cancelled';
                document.getElementById('resStatus').className = 'status-badge status-4xx';
                document.getElementById('resBodyOutput').textContent = 'تم إلغاء الطلب.';
            } else {
                document.getElementById('resStatus').textContent = 'Error';
                document.getElementById('resStatus').className = 'status-badge status-5xx';
                document.getElementById('resBodyOutput').textContent = 'فشل الاتصال: ' + error.message + '\n\nتأكد من الرابط أو إعدادات الشبكة.';
            }
        } finally {
            isSending = false;
            sendBtn.textContent = translations[currentLang].btn_send;
            sendBtn.disabled = false;
            currentAbortController = null;
        }
    });

    cancelBtn.addEventListener('click', () => { 
        if (currentAbortController) currentAbortController.abort(); 
    });

    document.addEventListener('keydown', (e) => { 
        if (e.ctrlKey && e.key === 'Enter') sendBtn.click(); 
    });

    // إدارة التاريخ مع زرار الحذف
    let history = JSON.parse(localStorage.getItem('devortex_api_history') || '[]');
    
    const renderHistory = () => {
        const list = document.getElementById('historyList');
        list.innerHTML = '';
        history.slice().reverse().forEach((item, index) => {
            const originalIndex = history.length - 1 - index;
            const div = document.createElement('div');
            div.className = 'history-item';
            
            // محتوى الطلب
            const infoSpan = document.createElement('span');
            infoSpan.innerHTML = `<span style="color:${item.status >= 400 ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">${item.method}</span> <span style="color:var(--text-muted);word-break:break-all;">${item.url}</span>`;
            infoSpan.style.flex = "1";
            infoSpan.style.cursor = "pointer";
            infoSpan.onclick = () => {
                document.getElementById('methodSelect').value = item.method;
                document.getElementById('urlInput').value = item.url;
            };

            // زرار الحذف
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '🗑️';
            delBtn.className = 'delete-btn';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                history.splice(originalIndex, 1);
                localStorage.setItem('devortex_api_history', JSON.stringify(history));
                renderHistory();
            };

            div.appendChild(infoSpan);
            div.appendChild(delBtn);
            list.appendChild(div);
        });
    };

    const addToHistory = (method, url, status) => {
        history.push({ method, url, status, time: Date.now() });
        if (history.length > 50) history.shift();
        localStorage.setItem('devortex_api_history', JSON.stringify(history));
        renderHistory();
    };
    renderHistory();

    const generateCode = () => {
        const method = document.getElementById('methodSelect').value;
        const url = document.getElementById('urlInput').value;
        const lang = document.getElementById('codeLang').value;
        const output = document.getElementById('codeOutput');
        if (!url) { output.textContent = 'Waiting for URL...'; return; }

        if (lang === 'curl') output.textContent = `curl -X ${method} "${url}"`;
        else if (lang === 'js') output.textContent = `fetch("${url}", {\n  method: "${method}"\n}).then(res => res.json()).then(data => console.log(data));`;
        else if (lang === 'python') output.textContent = `import requests\n\nresponse = requests.${method.toLowerCase()}("${url}")\nprint(response.json())`;
    };
    document.getElementById('urlInput').addEventListener('input', generateCode);
    document.getElementById('methodSelect').addEventListener('change', generateCode);

    window.addKVRow = (type) => {
        const container = document.getElementById(type === 'params' ? 'reqParams' : 'reqHeaders');
        const div = document.createElement('div');
        div.className = 'kv-row';
        div.innerHTML = `<input type="checkbox"><input type="text" placeholder="Key"><input type="text" placeholder="Value"><button class="btn-close">×</button>`;
        container.insertBefore(div, container.lastElementChild);
    };

    applyLanguage('ar');
});
