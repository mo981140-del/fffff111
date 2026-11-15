document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        ar: {
            nav_inspector: "فاحص الحماية", nav_about: "نبذة عن برنامج",
            app_title: "محلل رؤوس الأمان والخصوصية",
            app_desc: "برنامج متقدمة لفحص إعدادات الحماية، الكوكيز، و CORS للمواقع",
            input_label: "أدخل رابط الموقع للبدء (مثال: https://google.com):",
            btn_analyze: "فحص الموقع", score_grade: "التقييم", score_title: "تقرير الفحص",
            tab_headers: "رؤوس الأمان", tab_cookies: "الكوكيز (Cookies)", tab_cors: "إعدادات CORS",
            about_title: "نبذة عن الأداة",
            about_text: "تم تطوير هذه برنامج بواسطة منصة DevVortex لفحص إعدادات الأمان المتقدمة (Security Headers, Cookies, CORS) لاكتشاف الثغرات التي قد تعرض الموقع لهجمات XSS و Clickjacking وتسريب البيانات. برنامج يعمل بالكامل محلياً لضمان خصوصيتك.",
            lang_btn: "English", err_url: "الرجاء إدخال رابط صحيح (يبدأ بـ http أو https).",
            err_fetch: "تعذر الاتصال بالموقع. تأكد من الرابط.",
            status_pass: "محمي", status_warn: "ضعيف", status_fail: "مفقود",
            msg_A: "ممتاز! الموقع محصن بشكل قوي جداً ضد الهجمات الشائعة.",
            msg_B: "جيد، ولكن هناك بعض الثغرات التي يجب معالجتها لتأمين الموقع بالكامل.",
            msg_C: "تحذير: الموقع يعاني من نقص في إعدادات الأمان الأساسية.",
            msg_F: "خطر شديد! الموقع غير محمي تقريباً ومعرض للاختراق بسهولة.",
            show_fix: "عرض كود الإصلاح", hide_fix: "إخفاء كود الإصلاح", no_cookies: "لم يتم العثور على كوكيز في هذا الطلب.", no_cors: "إعدادات CORS تبدو آمنة (غير مكشوفة للجميع)."
        },
        en: {
            nav_inspector: "Security Inspector", nav_about: "About Tool",
            app_title: "Security Headers & Privacy Analyzer",
            app_desc: "Advanced tool to inspect Security Headers, Cookies, and CORS configurations",
            input_label: "Enter Website URL to start (e.g., https://google.com):",
            btn_analyze: "Analyze Site", score_grade: "Grade", score_title: "Analysis Report",
            tab_headers: "Security Headers", tab_cookies: "Cookies", tab_cors: "CORS Settings",
            about_title: "About The Tool",
            about_text: "Developed by DevVortex to inspect advanced security configurations (Headers, Cookies, CORS) and detect vulnerabilities that expose the site to XSS, Clickjacking, and data leaks. The tool runs entirely locally for privacy.",
            lang_btn: "العربية", err_url: "Please enter a valid URL (starts with http/https).",
            err_fetch: "Could not connect to the website. Check the URL.",
            status_pass: "Secure", status_warn: "Weak", status_fail: "Missing",
            msg_A: "Excellent! The site is strongly hardened against common attacks.",
            msg_B: "Good, but there are gaps that need addressing to fully secure the site.",
            msg_C: "Warning: The site lacks essential security configurations.",
            msg_F: "Critical! The site is almost unprotected and easily exploitable.",
            show_fix: "Show Fix Code", hide_fix: "Hide Fix Code", no_cookies: "No cookies found in this request.", no_cors: "CORS settings appear secure (not wildcard)."
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

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.getAttribute('data-target')).classList.add('active');
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
        });
    });

    const analyzeBtn = document.getElementById('analyzeBtn');
    const urlInput = document.getElementById('urlInput');
    const resultsSection = document.getElementById('resultsSection');
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreValue = document.getElementById('scoreValue');
    const scoreMessage = document.getElementById('scoreMessage');

    analyzeBtn.addEventListener('click', async () => {
        let url = urlInput.value.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

        analyzeBtn.textContent = 'جاري الفحص...';
        analyzeBtn.disabled = true;
        resultsSection.classList.add('hidden');

        try {
            const response = await window.api.fetchHeaders(url);
            if (!response.success) throw new Error(response.error);

            const headers = response.headers;
            let score = 0;
            let maxScore = 0;
            
            // 1. Headers Tab
            const headersList = document.getElementById('headersList');
            headersList.innerHTML = '';
            
            const requiredHeaders = [
                { key: 'strict-transport-security', name: 'HSTS', desc: 'يجبر المتصفح على استخدام HTTPS', fix: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;', check: (v) => v && v.includes('max-age') && parseInt(v.split('max-age=')[1]) >= 31536000 },
                { key: 'content-security-policy', name: 'CSP', desc: 'يمنع هجمات XSS (حقن السكريبتات)', fix: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\" always;", check: (v) => v && !v.includes('unsafe-inline') },
                { key: 'x-frame-options', name: 'X-Frame-Options', desc: 'يمنع هجمات Clickjacking (تضمين الموقع)', fix: 'add_header X-Frame-Options "SAMEORIGIN" always;', check: (v) => v === 'DENY' || v === 'SAMEORIGIN' },
                { key: 'x-content-type-options', name: 'X-Content-Type', desc: 'يمنع المتصفح من تخمين نوع الملف', fix: 'add_header X-Content-Type-Options "nosniff" always;', check: (v) => v === 'nosniff' },
                { key: 'referrer-policy', name: 'Referrer-Policy', desc: 'يحمي خصوصية البيانات المرسلة للمواقع الأخرى', fix: 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;', check: (v) => v && (v.includes('strict-origin') || v.includes('no-referrer')) }
            ];

            requiredHeaders.forEach(req => {
                maxScore += 20;
                const val = headers[req.key];
                let statusClass = 'fail', statusText = translations[currentLang].status_fail;
                let fixHtml = '';

                if (val !== undefined) {
                    const isStrong = req.check(val);
                    if (isStrong) {
                        score += 20;
                        statusClass = 'pass'; statusText = translations[currentLang].status_pass;
                    } else {
                        score += 10; // Partial credit for weak config
                        statusClass = 'warn'; statusText = translations[currentLang].status_warn;
                    }
                }

                if (statusClass !== 'pass') {
                    fixHtml = `
                        <button class="btn-fix" style="background:none;border:none;color:var(--accent-cyan);cursor:pointer;font-size:0.85rem;margin-top:5px;text-decoration:underline;">${translations[currentLang].show_fix}</button>
                        <div class="fix-code">${req.fix}</div>
                    `;
                }

                headersList.innerHTML += `
                    <div class="header-item ${statusClass}">
                        <div class="header-info">
                            <h4>${req.name} <small style="color:#555">(${val || 'None'})</small></h4>
                            <p>${req.desc}</p>
                            ${fixHtml}
                        </div>
                        <span class="header-status ${statusClass}">${statusText}</span>
                    </div>
                `;
            });

            // 2. Cookies Tab
            const cookiesList = document.getElementById('cookiesList');
            cookiesList.innerHTML = '';
            let cookieCount = 0;
            
            if (headers['set-cookie']) {
                const cookies = Array.isArray(headers['set-cookie']) ? headers['set-cookie'] : [headers['set-cookie']];
                cookies.forEach(cookie => {
                    cookieCount++; maxScore += 10;
                    const name = cookie.split('=')[0];
                    const hasSecure = cookie.toLowerCase().includes('secure');
                    const hasHttpOnly = cookie.toLowerCase().includes('httponly');
                    const hasSameSite = cookie.toLowerCase().includes('samesite');
                    
                    let cScore = 0;
                    if (hasSecure) cScore += 3;
                    if (hasHttpOnly) cScore += 4;
                    if (hasSameSite) cScore += 3;
                    score += cScore;

                    const cClass = cScore === 10 ? 'pass' : cScore > 4 ? 'warn' : 'fail';
                    
                    cookiesList.innerHTML += `
                        <div class="header-item ${cClass}">
                            <div class="header-info">
                                <h4>🍪 ${name}</h4>
                                <p>Secure: ${hasSecure ? '✅' : '❌'} | HttpOnly: ${hasHttpOnly ? '✅' : '❌'} | SameSite: ${hasSameSite ? '✅' : '❌'}</p>
                            </div>
                            <span class="header-status ${cClass}">${cScore}/10</span>
                        </div>
                    `;
                });
            } else {
                cookiesList.innerHTML = `<p style="color:var(--text-muted);padding:20px;">${translations[currentLang].no_cookies}</p>`;
            }

            // 3. CORS Tab
            const corsList = document.getElementById('corsList');
            corsList.innerHTML = '';
            maxScore += 10;
            const corsOrigin = headers['access-control-allow-origin'];
            if (corsOrigin === '*') {
                corsList.innerHTML = `
                    <div class="header-item fail">
                        <div class="header-info">
                            <h4>Access-Control-Allow-Origin: *</h4>
                            <p>خطر! أي موقع خارجي يمكنه قراءة بيانات المستخدمين من موقعك.</p>
                        </div>
                        <span class="header-status fail">ضعيف</span>
                    </div>
                `;
            } else if (corsOrigin) {
                score += 5;
                corsList.innerHTML = `
                    <div class="header-item warn">
                        <div class="header-info">
                            <h4>Access-Control-Allow-Origin: ${corsOrigin}</h4>
                            <p>يُسمح لموقع معين بالوصول. تأكد أن هذا الموقع موثوق.</p>
                        </div>
                        <span class="header-status warn">مقيد</span>
                    </div>
                `;
            } else {
                score += 10;
                corsList.innerHTML = `<p style="color:var(--success);padding:20px;">✅ ${translations[currentLang].no_cors}</p>`;
            }

            // Calculate Final Grade
            const percentage = Math.round((score / maxScore) * 100);
            let grade = 'F', color = 'var(--danger)', msg = translations[currentLang].msg_F;
            
            if (percentage >= 90) { grade = 'A+'; color = 'var(--success)'; msg = translations[currentLang].msg_A; }
            else if (percentage >= 75) { grade = 'B'; color = 'var(--success)'; msg = translations[currentLang].msg_B; }
            else if (percentage >= 50) { grade = 'C'; color = 'var(--warning)'; msg = translations[currentLang].msg_C; }

            scoreValue.textContent = grade;
            scoreValue.style.color = color;
            scoreCircle.style.borderColor = color;
            scoreCircle.style.boxShadow = `0 0 30px ${color}`;
            scoreMessage.textContent = `${msg} (${percentage}%)`;

            resultsSection.classList.remove('hidden');
            
            // إضافة حدث لزرار إظهار الكود
            document.querySelectorAll('.btn-fix').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const code = e.target.nextElementSibling;
                    const isHidden = !code.classList.contains('show');
                    code.classList.toggle('show');
                    e.target.textContent = isHidden ? translations[currentLang].hide_fix : translations[currentLang].show_fix;
                });
            });

        } catch (error) {
            alert(translations[currentLang].err_fetch + "\n" + error.message);
        } finally {
            analyzeBtn.textContent = translations[currentLang].btn_analyze;
            analyzeBtn.disabled = false;
        }
    });

    applyLanguage('ar');
});
