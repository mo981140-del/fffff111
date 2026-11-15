document.addEventListener('DOMContentLoaded', () => {
    // 1. نظام الترجمة (i18n)
    const translations = {
        ar: {
            nav_inspector: "فاحص التوكنات",
            nav_about: "نبذة عن الأداة",
            app_title: "محلل توكنات JWT",
            app_desc: "أداة أمنية لتحليل واكتشاف الثغرات في توكنات JSON Web Tokens",
            input_label: "الصق توكن JWT هنا للتحليل:",
            btn_analyze: "تحليل التوكن",
            btn_clear: "مسح",
            results_header: "Header (الترويسة)",
            results_payload: "Payload (البيانات)",
            results_sig: "Signature (التوقيع)",
            about_title: "نبذة عن الأداة",
            about_text: "تم تطوير هذه الأداة بواسطة منصة DevVortex لمساعدة المطورين ومهندسي الأمن السيبراني في تحليل توكنات JWT واكتشاف الثغرات الأمنية الشائعة مثل ضعف التشفير، عدم وجود تاريخ انتهاء، أو تسريب بيانات حساسة. الأداة تعمل بالكامل محلياً لضمان خصوصية بياناتك.",
            lang_btn: "English",
            err_empty: "الرجاء إدخال توكن JWT أولاً!",
            err_invalid: "التوكن غير صالح! يجب أن يتكون من 3 أجزاء.",
            err_parse: "حدث خطأ أثناء فك التوكن. تأكد من أن التوكن سليم.",
            alert_alg_none: "ثغرة خطيرة: الخوارزمية مضبوطة على 'none'! يمكن للهاكر تعديل البيانات بدون توقيع.",
            alert_alg_hs: "تنبيه: يتم استخدام HS256. تأكد من أن المفتاح السري قوي جداً.",
            alert_no_exp: "ثغرة: التوكن لا يحتوي على تاريخ انتهاء (exp).",
            alert_expired: "التوكن منتهي الصلاحية بالفعل (Expired).",
            alert_long_exp: "التوكن صالح لمدة طويلة جداً.",
            alert_sensitive: "ثغرة: التوكن يحتوي على بيانات حساسة.",
            alert_safe: "التوكن يبدو آمناً من حيث الإعدادات الأساسية."
        },
        en: {
            nav_inspector: "JWT Inspector",
            nav_about: "About Tool",
            app_title: "JWT Token Analyzer",
            app_desc: "A security tool to analyze and detect vulnerabilities in JSON Web Tokens",
            input_label: "Paste JWT Token here for analysis:",
            btn_analyze: "Analyze Token",
            btn_clear: "Clear",
            results_header: "Header",
            results_payload: "Payload",
            results_sig: "Signature",
            about_title: "About The Tool",
            about_text: "Developed by DevVortex to help developers and cybersecurity engineers analyze JWT tokens and detect common vulnerabilities such as weak encryption, missing expiration dates, or sensitive data leakage. The tool runs entirely locally (Client-Side) to ensure your data's privacy.",
            lang_btn: "العربية",
            err_empty: "Please enter a JWT token first!",
            err_invalid: "Invalid token! It must consist of 3 parts.",
            err_parse: "Error parsing the token. Ensure it's a valid JWT.",
            alert_alg_none: "Critical: Algorithm is set to 'none'! Attackers can modify data without a signature.",
            alert_alg_hs: "Warning: HS256 is used. Ensure your secret key is very strong.",
            alert_no_exp: "Vulnerability: Token does not have an expiration date (exp).",
            alert_expired: "Token is already expired.",
            alert_long_exp: "Token validity is too long.",
            alert_sensitive: "Vulnerability: Token contains sensitive data.",
            alert_safe: "Token appears secure based on basic settings."
        }
    };

    let currentLang = 'ar';

    function applyLanguage(lang) {
        currentLang = lang;
        const dict = translations[lang];
        
        // تغيير اتجاه الصفحة والخط
        document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // تغيير النصوص
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                if (el.tagName === 'TEXTAREA') {
                    el.placeholder = dict[key];
                } else {
                    el.textContent = dict[key];
                }
            }
        });

        // تغيير زرار اللغة
        document.getElementById('langText').textContent = dict.lang_btn;
    }

    document.getElementById('langToggle').addEventListener('click', () => {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
    });

    // 2. التنقل بين الصفحات (القائمة الجانبية)
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(view => view.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(item.getAttribute('data-target')).classList.add('active');
        });
    });

    // 3. منطق فحص JWT
    const jwtInput = document.getElementById('jwtInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultsSection = document.getElementById('resultsSection');
    const headerOutput = document.getElementById('headerOutput');
    const payloadOutput = document.getElementById('payloadOutput');
    const signatureOutput = document.getElementById('signatureOutput');
    const alertsContainer = document.getElementById('alerts');

    function base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    function showAlert(type, messageKey) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        let icon = type === 'danger' ? '🚨' : type === 'warning' ? '⚠️' : '✅';
        alert.innerHTML = `<span>${icon}</span> <span>${translations[currentLang][messageKey]}</span>`;
        alertsContainer.appendChild(alert);
    }

    analyzeBtn.addEventListener('click', () => {
        alertsContainer.innerHTML = '';
        const token = jwtInput.value.trim();

        if (!token) {
            alert(translations[currentLang].err_empty);
            return;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            alert(translations[currentLang].err_invalid);
            return;
        }

        try {
            const headerStr = base64UrlDecode(parts[0]);
            const payloadStr = base64UrlDecode(parts[1]);
            const signature = parts[2];

            const header = JSON.parse(headerStr);
            const payload = JSON.parse(payloadStr);

            headerOutput.textContent = JSON.stringify(header, null, 4);
            payloadOutput.textContent = JSON.stringify(payload, null, 4);
            signatureOutput.textContent = signature;

            resultsSection.classList.remove('hidden');

            let isSecure = true;

            if (header.alg === 'none') {
                showAlert('danger', 'alert_alg_none');
                isSecure = false;
            } else if (header.alg === 'HS256') {
                showAlert('warning', 'alert_alg_hs');
            }

            if (!payload.exp) {
                showAlert('danger', 'alert_no_exp');
                isSecure = false;
            } else {
                const currentTime = Math.floor(Date.now() / 1000);
                if (payload.exp < currentTime) {
                    showAlert('warning', 'alert_expired');
                } else {
                    const daysLeft = Math.floor((payload.exp - currentTime) / 86400);
                    if (daysLeft > 30) {
                        showAlert('warning', 'alert_long_exp');
                    }
                }
            }

            if (payload.password || payload.pwd || payload.credit_card) {
                showAlert('danger', 'alert_sensitive');
                isSecure = false;
            }

            if (isSecure) {
                showAlert('success', 'alert_safe');
            }

        } catch (error) {
            alert(translations[currentLang].err_parse);
            resultsSection.classList.add('hidden');
        }
    });

    clearBtn.addEventListener('click', () => {
        jwtInput.value = '';
        resultsSection.classList.add('hidden');
        alertsContainer.innerHTML = '';
    });

    // نسخ الكود
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const textToCopy = document.getElementById(targetId).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btn.textContent;
                btn.textContent = currentLang === 'ar' ? 'تم النسخ!' : 'Copied!';
                setTimeout(() => btn.textContent = originalText, 2000);
            });
        });
    });

    // تشغيل الترجمة العربية كبداية
    applyLanguage('ar');
});
