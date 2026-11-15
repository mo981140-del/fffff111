document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        ar: {
            nav_scanner: "كاشف المفاتيح", nav_about: "نبذة عن البرنامج",
            app_title: "كاشف البيانات المسربة (Secret Scanner)",
            app_desc: "ابحث عن مفاتيح API وكلمات المرور المكتوبة بالخطأ في الكود الخاص بك",
            input_label: "الصق الكود هنا أو ارفع ملف (TXT, JS, JSON, PY):",
            btn_scan: "فحص الكود", btn_upload: "رفع ملف", btn_clear: "مسح",
            summary_title: "نتيجة الفحص",
            summary_danger: "تم العثور على بيانات مسربة! يجب حذفها فوراً وتغييرها.",
            summary_safe: "لم يتم العثور على أي مفاتيح مسربة. الكود يبدو آمناً.",
            about_title: "نبذة عن البرنامج",
            about_text: "تم تطوير هذا البرنامج بواسطة منصة DevVortex لمساعدة المطورين على حماية أكوادهم من تسريب المفاتيح السرية (API Keys, Passwords). البرنامج يبحث عن أنماط معروفة للمفاتيح ويتأكد من عدم وجودها في الكود قبل النشر.",
            lang_btn: "English", 
            err_empty: "الرجاء إدخال كود أولاً!", 
            line: "السطر",
            type_aws: "مفتاح AWS السري",
            type_google: "مفتاح Google API",
            type_github: "توكن GitHub",
            type_stripe: "مفتاح Stripe السري",
            type_generic: "كلمة مرور / سر مكتوب بشكل مباشر"
        },
        en: {
            nav_scanner: "Secret Scanner", nav_about: "About Program",
            app_title: "Secret Scanner (Leaked Credentials)",
            app_desc: "Search for leaked API keys and hardcoded passwords in your code",
            input_label: "Paste code here or upload file (TXT, JS, JSON, PY):",
            btn_scan: "Scan Code", btn_upload: "Upload File", btn_clear: "Clear",
            summary_title: "Scan Results",
            summary_danger: "Leaked secrets found! You must remove and rotate them immediately.",
            summary_safe: "No leaked secrets found. Code appears safe.",
            about_title: "About The Program",
            about_text: "Developed by DevVortex to help developers protect their code from leaking secrets (API Keys, Passwords). The program scans for known key patterns to ensure safety before publishing.",
            lang_btn: "العربية", 
            err_empty: "Please enter code first!", 
            line: "Line",
            type_aws: "AWS Secret Key",
            type_google: "Google API Key",
            type_github: "GitHub Token",
            type_stripe: "Stripe Secret Key",
            type_generic: "Hardcoded Password / Secret"
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

    const codeInput = document.getElementById('codeInput');
    const scanBtn = document.getElementById('scanBtn');
    const clearBtn = document.getElementById('clearBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const resultsSection = document.getElementById('resultsSection');
    const summaryText = document.getElementById('summaryText');
    const resultsList = document.getElementById('resultsList');

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => codeInput.value = e.target.result;
        reader.readAsText(file);
    });

    const patterns = [
        { nameKey: 'type_aws', regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
        { nameKey: 'type_google', regex: /AIza[0-9A-Za-z\-_]{35}/g },
        { nameKey: 'type_github', regex: /(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}/g },
        { nameKey: 'type_stripe', regex: /(sk_live|rk_live)_[0-9a-zA-Z]{24}/g },
        { nameKey: 'type_generic', regex: /(password|passwd|pwd|secret|api_key|apikey|token)\s*[:=]\s*['"][^'"]{6,}['"]/gi }
    ];

    scanBtn.addEventListener('click', () => {
        const code = codeInput.value;
        if (!code.trim()) {
            alert(translations[currentLang].err_empty);
            return;
        }

        resultsList.innerHTML = '';
        let foundCount = 0;
        const lines = code.split('\n');

        lines.forEach((lineText, index) => {
            patterns.forEach(pattern => {
                const matches = lineText.match(pattern.regex);
                if (matches) {
                    matches.forEach(match => {
                        foundCount++;
                        resultsList.innerHTML += `
                            <div class="result-item">
                                <h4><span>🚨</span> ${translations[currentLang][pattern.nameKey]}</h4>
                                <div class="matched-text">${match}</div>
                                <div class="line-info">${translations[currentLang].line}: ${index + 1}</div>
                            </div>
                        `;
                    });
                }
            });
        });

        if (foundCount > 0) {
            summaryText.textContent = translations[currentLang].summary_danger;
            summaryText.className = 'text-danger';
        } else {
            summaryText.textContent = translations[currentLang].summary_safe;
            summaryText.className = 'text-success';
        }

        resultsSection.classList.remove('hidden');
    });

    clearBtn.addEventListener('click', () => {
        codeInput.value = '';
        fileInput.value = '';
        resultsSection.classList.add('hidden');
        resultsList.innerHTML = '';
    });

    applyLanguage('ar');
});