document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        ar: {
            brand_sub: "API Client", tab_history: "التاريخ", tab_fav: "المفضلة", req_title: "طلب جديد",
            btn_new_req: "+ مسح الشاشة", btn_send: "إرسال", btn_sending: "جاري الإرسال...",
            btn_about: "نبذة عن البرنامج", btn_close: "إغلاق", btn_add_row: "+ إضافة", btn_format: "تنسيق JSON", btn_copy: "نسخ",
            itab_headers: "الترويسات (Headers)", itab_body: "البيانات (Body)", itab_code: "توليد الكود",
            body_json: "JSON", body_raw: "Raw", res_empty_title: "جاهز لإرسال الطلب...", res_empty_desc: "أدخل رابط الـ API واضغط إرسال",
            res_status: "الحالة:", res_time: "الوقت:", res_size: "الحجم:", res_pretty: "تنسيق JSON", res_raw: "نص خام",
            about_title: "نبذة عن البرنامج",
            about_text: "تم تطوير هذا البرنامج بواسطة منصة DevVortex ليكون بديلاً خفيفاً، سريعاً، وآمناً لبرامج اختبار الـ APIs الثقيلة مثل Postman.",
            lang_btn: "English"
        },
        en: {
            brand_sub: "API Client", tab_history: "History", tab_fav: "Favorites", req_title: "New Request",
            btn_new_req: "+ Clear", btn_send: "Send", btn_sending: "Sending...",
            btn_about: "About", btn_close: "Close", btn_add_row: "+ Add Row", btn_format: "Format JSON", btn_copy: "Copy",
            itab_headers: "Headers", itab_body: "Body", itab_code: "Code Gen",
            body_json: "JSON", body_raw: "Raw", res_empty_title: "Ready to send...", res_empty_desc: "Enter URL and click Send",
            res_status: "Status:", res_time: "Time:", res_size: "Size:", res_pretty: "Pretty (JSON)", res_raw: "Raw",
            about_title: "About Program",
            about_text: "Developed by DevVortex as a lightweight, fast, and secure alternative to heavy API clients like Postman.",
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

    // التبويبات الجانبية
    document.querySelectorAll('.sidebar-tabs .stab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.sidebar-tabs .stab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            const target = e.target.getAttribute('data-target');
            document.getElementById('historyList').classList.toggle('hidden', target !== 'history');
            document.getElementById('favoritesList').classList.toggle('hidden', target !== 'favorites');
        });
    });

    // التبويبات الداخلية
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

    window.formatJSON = () => {
        const body = document.getElementById('bodyInput');
        try {
            const parsed = JSON.parse(body.value);
            body.value = JSON.stringify(parsed, null, 4);
        } catch (e) { alert('صيغة JSON غير صحيحة!'); }
    };

    window.addKVRow = (type) => {
        const container = document.getElementById(type === 'headers' ? 'reqHeaders' : 'reqParams');
        const div = document.createElement('div');
        div.className = 'kv-row';
        div.innerHTML = `<input type="checkbox"><input type="text" placeholder="Key"><input type="text" placeholder="Value"><button class="btn-close">×</button>`;
        container.insertBefore(div, container.lastElementChild);
    };

    // 🚨 إرسال الطلب باستخدام axios من main.js
    const sendBtn = document.getElementById('sendBtn');
    let isSending = false;

    sendBtn.addEventListener('click', async () => {
        if (isSending) return;
        const url = document.getElementById('urlInput').value.trim();
        if (!url) return;

        const method = document.getElementById('methodSelect').value;
        
        const headers = {};
        document.querySelectorAll('#reqHeaders .kv-row').forEach(row => {
            if (row.querySelector('input[type="checkbox"]').checked) {
                const key = row.querySelectorAll('input[type="text"]')[0].value;
                const val = row.querySelectorAll('input[type="text"]')[1].value;
                if (key && val) headers[key] = val;
            }
        });

        let body = null;
        const bodyType = document.getElementById('bodyType').value;
        const bodyVal = document.getElementById('bodyInput').value;
        if (['POST', 'PUT', 'PATCH'].includes(method) && bodyVal) {
            try { body = bodyType === 'json' ? JSON.parse(bodyVal) : bodyVal; } 
            catch (e) { body = bodyVal; }
            if (bodyType === 'json' && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
        }

        isSending = true;
        sendBtn.textContent = translations[currentLang].btn_sending;
        sendBtn.disabled = true;
        
        document.getElementById('responseEmpty').classList.add('hidden');
        document.getElementById('responseContent').classList.remove('hidden');

        // استدعاء axios من main.js
        const result = await window.electronAPI.sendRequest({ method, url, headers, body });

        if (result.success) {
            const statusEl = document.getElementById('resStatus');
            statusEl.textContent = `${result.status} ${result.statusText}`;
            statusEl.className = 'status-badge ' + (result.status < 400 ? 'status-2xx' : result.status >= 500 ? 'status-5xx' : 'status-4xx');
            document.getElementById('resTime').textContent = result.time + ' ms';
            
            const resText = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 4);
            document.getElementById('resSize').textContent = new Blob([resText]).size + ' B';
            document.getElementById('resBodyOutput').textContent = resText;

            let headersStr = '';
            for (const [key, val] of Object.entries(result.headers)) { headersStr += `${key}: ${val}\n`; }
            document.getElementById('resHeadersOutput').textContent = headersStr;
            
            addToHistory(method, url, result.status);
        } else {
            document.getElementById('resStatus').textContent = 'Error';
            document.getElementById('resStatus').className = 'status-badge status-5xx';
            document.getElementById('resBodyOutput').textContent = 'فشل الاتصال: ' + result.error;
        }

        isSending = false;
        sendBtn.textContent = translations[currentLang].btn_send;
        sendBtn.disabled = false;
    });

    // التاريخ والمفضلة
    let history = JSON.parse(localStorage.getItem('devortex_api_history') || '[]');
    let favorites = JSON.parse(localStorage.getItem('devortex_api_favs') || '[]');

    const renderHistory = () => {
        const list = document.getElementById('historyList');
        list.innerHTML = '';
        history.slice().reverse().forEach((item, index) => {
            const originalIndex = history.length - 1 - index;
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span style="cursor:pointer; flex:1;" onclick="loadRequest('${item.url}', '${item.method}')">
                    <span style="color:${item.status >= 400 ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">${item.method}</span> 
                    <span style="color:var(--text-muted);word-break:break-all;">${item.url}</span>
                </span>
                <button class="delete-btn" onclick="deleteHistory(${originalIndex})">🗑️</button>
            `;
            list.appendChild(div);
        });
    };

    window.deleteHistory = (index) => {
        history.splice(index, 1);
        localStorage.setItem('devortex_api_history', JSON.stringify(history));
        renderHistory();
    };

    window.loadRequest = (url, method) => {
        document.getElementById('methodSelect').value = method;
        document.getElementById('urlInput').value = url;
    };

    const addToHistory = (method, url, status) => {
        history.push({ method, url, status, time: Date.now() });
        if (history.length > 50) history.shift();
        localStorage.setItem('devortex_api_history', JSON.stringify(history));
        renderHistory();
    };
    renderHistory();

    // مسح الشاشة لطلب جديد
    document.getElementById('newRequestBtn').addEventListener('click', () => {
        document.getElementById('urlInput').value = '';
        document.getElementById('bodyInput').value = '';
        document.getElementById('responseEmpty').classList.remove('hidden');
        document.getElementById('responseContent').classList.add('hidden');
    });

    applyLanguage('ar');
});
