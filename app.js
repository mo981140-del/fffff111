document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. قاموس الترجمة (i18n)
    // ==========================================
    const translations = {
        ar: {
            nav_dashboard: "لوحة القيادة",
            nav_about: "نبذة عن البرنامج",
            sys_offline: "النظام: غير نشط",
            sys_online: "النظام: نشط (الدرع يعمل)",
            btn_start_shield: "تفعيل الدرع الواقي (Start Shield)",
            btn_stop_shield: "إيقاف الدرع (Stop Shield)",
            stat_blocked: "الهجمات التي تم صدها",
            stat_integrity: "سلامة النظام",
            stat_threat: "مستوى التهديد الحالي",
            stat_uptime: "وقت التشغيل",
            threat_low: "منخفض",
            threat_high: "مرتفع",
            threat_critical: "حرج",
            radar_standby: "في وضع الاستعداد...",
            radar_scanning: "جاري مسح الذاكرة (RAM)...",
            term_title: "سجل العمليات الحية",
            about_title: "نبذة عن البرنامج",
            about_text: "تم تطوير هذا البرنامج بواسطة منصة DevVortex. Aegis-Core هو درع مناعي ذاتي للبرمجيات، يعمل على اعتراض وتحييد الهجمات في الذاكرة (RAM) قبل أن تسبب أي ضرر للأنظمة القديمة.",
            btn_close: "إغلاق",
            lang_btn: "English"
        },
        en: {
            nav_dashboard: "Dashboard",
            nav_about: "About Program",
            sys_offline: "System: Offline",
            sys_online: "System: Active (Shield Running)",
            btn_start_shield: "Start Shield",
            btn_stop_shield: "Stop Shield",
            stat_blocked: "Attacks Blocked",
            stat_integrity: "System Integrity",
            stat_threat: "Current Threat Level",
            stat_uptime: "Uptime",
            threat_low: "Low",
            threat_high: "High",
            threat_critical: "Critical",
            radar_standby: "Standby mode...",
            radar_scanning: "Scanning Memory (RAM)...",
            term_title: "Live Terminal",
            about_title: "About Program",
            about_text: "Developed by DevVortex. Aegis-Core is an auto-immune binary shield that intercepts and neutralizes memory-based attacks (RAM) before they cause damage to legacy systems.",
            btn_close: "Close",
            lang_btn: "العربية"
        }
    };

    let currentLang = 'ar';

    const applyLanguage = (lang) => {
        currentLang = lang;
        const dict = translations[lang];
        
        // تغيير اتجاه الصفحة
        document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // ترجمة كل العناصر اللي فيها data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        // تغيير اسم زرار اللغة
        document.getElementById('langText').textContent = dict.lang_btn;

        // تحديث حالة الزرار بناءً على اللغة الحالية
        if (isShieldActive) {
            document.getElementById('toggleShieldBtn').textContent = dict.btn_stop_shield;
            document.getElementById('systemStatusText').textContent = dict.sys_online;
            document.querySelector('.radar-status').textContent = dict.radar_scanning;
        } else {
            document.getElementById('toggleShieldBtn').textContent = dict.btn_start_shield;
            document.getElementById('systemStatusText').textContent = dict.sys_offline;
            document.querySelector('.radar-status').textContent = dict.radar_standby;
        }
    };

    document.getElementById('langToggle').addEventListener('click', () => {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
    });

    // ==========================================
    // 2. المتغيرات الأساسية
    // ==========================================
    let isShieldActive = false;
    let blockedCount = 0;
    let uptimeInterval = null;
    let secondsElapsed = 0;

    const toggleBtn = document.getElementById('toggleShieldBtn');
    const statusText = document.getElementById('systemStatusText');
    const statusDot = document.getElementById('systemStatus');
    const terminalLogs = document.getElementById('terminalLogs');
    const blockedCounter = document.getElementById('blockedCount');
    const threatLevel = document.getElementById('threatLevel');
    const uptimeDisplay = document.getElementById('uptime');
    const radarStatus = document.querySelector('.radar-status');
    const radarSweep = document.querySelector('.radar-sweep');

    // ==========================================
    // 3. دوال مساعدة (Logs & Uptime)
    // ==========================================
    
    // دالة إضافة سطر جديد في الـ Terminal
    const addLog = (message, type = 'info') => {
        const line = document.createElement('div');
        line.className = 'log-line';
        
        // تحديد اللون حسب نوع الرسالة
        if (type === 'danger') line.classList.add('text-danger');
        else if (type === 'success') line.classList.add('text-success');
        else if (type === 'warning') line.classList.add('text-warning');
        else line.classList.add('text-cyan');

        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        line.textContent = `[${timestamp}] ${message}`;
        
        terminalLogs.appendChild(line);
        
        // الحفاظ على أداء البرنامج: نخلي آخر 100 سطر بس
        if (terminalLogs.children.length > 100) {
            terminalLogs.removeChild(terminalLogs.firstChild);
        }

        // النزول لآخر سطر أوتوماتيك
        terminalLogs.scrollTop = terminalLogs.scrollHeight;
    };

    // دالة حساب وقت التشغيل
    const startUptimeTimer = () => {
        secondsElapsed = 0;
        uptimeInterval = setInterval(() => {
            secondsElapsed++;
            const hrs = String(Math.floor(secondsElapsed / 3600)).padStart(2, '0');
            const mins = String(Math.floor((secondsElapsed % 3600) / 60)).padStart(2, '0');
            const secs = String(secondsElapsed % 60).padStart(2, '0');
            uptimeDisplay.textContent = `${hrs}:${mins}:${secs}`;
        }, 1000);
    };

    const stopUptimeTimer = () => {
        clearInterval(uptimeInterval);
    };

    // ==========================================
    // 4. التحكم في المحرك (Start / Stop)
    // ==========================================

    toggleBtn.addEventListener('click', async () => {
        // حماية لو البرنامج شغال في المتصفح مش إلكترون
        if (!window.aegisAPI) {
            addLog("Error: aegisAPI not found. Run as Electron app.", "danger");
            return;
        }

        if (!isShieldActive) {
            // تشغيل الدرع
            const res = await window.aegisAPI.startShield();
            if (res.status === 'started' || res.status === 'already_running') {
                isShieldActive = true;
                
                // تحديث الواجهة
                applyLanguage(currentLang); // عشان ياخد النصوص الصح
                toggleBtn.classList.add('danger-mode');
                statusDot.classList.replace('offline', 'online');
                radarSweep.style.animationPlayState = 'running';
                
                addLog("Aegis Shield Activated. Monitoring Memory...", "success");
                startUptimeTimer();
            }
        } else {
            // إيقاف الدرع
            const res = await window.aegisAPI.stopShield();
            if (res.status === 'stopped' || res.status === 'already_stopped') {
                isShieldActive = false;
                
                // تحديث الواجهة
                applyLanguage(currentLang);
                toggleBtn.classList.remove('danger-mode');
                statusDot.classList.replace('online', 'offline');
                radarSweep.style.animationPlayState = 'paused';
                
                addLog("Aegis Shield Deactivated. System unprotected!", "warning");
                stopUptimeTimer();
            }
        }
    });

    // ==========================================
    // 5. استقبال الهجمات من المحرك
    // ==========================================
    
    if (window.aegisAPI) {
        window.aegisAPI.onShieldEvent((attack) => {
            // زيادة عداد الهجمات
            blockedCount++;
            blockedCounter.textContent = blockedCount;

            // تحديث مستوى التهديد بناءً على خطورة الهجوم
            if (attack.severity === 'Critical') {
                threatLevel.textContent = translations[currentLang].threat_critical;
                threatLevel.className = 'stat-value text-danger';
                addLog(`[ALERT] Critical Attack Blocked: ${attack.type} in ${attack.process} -> ${attack.action}`, 'danger');
            } else if (attack.severity === 'High') {
                threatLevel.textContent = translations[currentLang].threat_high;
                threatLevel.className = 'stat-value text-warning';
                addLog(`[ALERT] High Risk Attack Blocked: ${attack.type} in ${attack.process} -> ${attack.action}`, 'warning');
            } else {
                threatLevel.textContent = translations[currentLang].threat_low;
                threatLevel.className = 'stat-value text-cyan';
                addLog(`[INFO] Minor Threat Blocked: ${attack.type} in ${attack.process} -> ${attack.action}`, 'info');
            }

            // إضافة تأثير بصري مؤقت للرادار (وميض)
            const radar = document.querySelector('.radar');
            radar.style.boxShadow = '0 0 40px rgba(239, 68, 68, 0.6)';
            setTimeout(() => {
                radar.style.boxShadow = 'none';
            }, 500);
        });
    }

    // ==========================================
    // 6. التهيئة الأولية
    // ==========================================
    applyLanguage('ar');
    radarSweep.style.animationPlayState = 'paused'; // الرادار واقف في البداية
});
