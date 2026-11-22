document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        ar: {
            nav_dashboard: "لوحة القيادة", nav_about: "نبذة عن البرنامج",
            sys_offline: "النظام: غير نشط", sys_online: "النظام: نشط (الدرع يعمل)",
            btn_start_shield: "تفعيل الدرع الواقي (Start Shield)", btn_stop_shield: "إيقاف الدرع (Stop Shield)",
            stat_blocked: "العمليات عالية الاستهلاك", stat_integrity: "سلامة النظام",
            stat_threat: "مستوى التهديد الحالي", stat_uptime: "وقت التشغيل",
            threat_low: "منخفض", threat_high: "مرتفع", threat_critical: "حرج",
            radar_standby: "في وضع الاستعداد...", radar_scanning: "جاري مسح العمليات الحقيقية...",
            term_title: "سجل العمليات الحية",
            about_title: "نبذة عن البرنامج",
            about_text: "تم تطوير هذا البرنامج بواسطة منصة DevVortex. Aegis-Core هو نظام مراقبة وتحليل حقيقي يعمل على قراءة موارد النظام والعمليات النشطة لاكتشاف أي استهلاك غير طبيعي للمعالج أو الذاكرة.",
            btn_close: "إغلاق", lang_btn: "English"
        },
        en: {
            nav_dashboard: "Dashboard", nav_about: "About Program",
            sys_offline: "System: Offline", sys_online: "System: Active (Shield Running)",
            btn_start_shield: "Start Shield", btn_stop_shield: "Stop Shield",
            stat_blocked: "High-Usage Processes", stat_integrity: "System Integrity",
            stat_threat: "Current Threat Level", stat_uptime: "Uptime",
            threat_low: "Low", threat_high: "High", threat_critical: "Critical",
            radar_standby: "Standby mode...", radar_scanning: "Scanning Real Processes...",
            term_title: "Live Terminal",
            about_title: "About Program",
            about_text: "Developed by DevVortex. Aegis-Core is a real system monitoring engine that reads system resources and active processes to detect abnormal CPU or Memory usage.",
            btn_close: "Close", lang_btn: "العربية"
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

    document.getElementById('langToggle').addEventListener('click', () => applyLanguage(currentLang === 'ar' ? 'en' : 'ar'));

    let isShieldActive = false;
    let blockedCount = 0;
    let uptimeInterval = null;
    let secondsElapsed = 0;

    const toggleBtn = document.getElementById('toggleShieldBtn');
    const statusDot = document.getElementById('systemStatus');
    const terminalLogs = document.getElementById('terminalLogs');
    const blockedCounter = document.getElementById('blockedCount');
    const threatLevel = document.getElementById('threatLevel');
    const uptimeDisplay = document.getElementById('uptime');
    const radarSweep = document.querySelector('.radar-sweep');

    const addLog = (message, type = 'info') => {
        const line = document.createElement('div');
        line.className = 'log-line';
        if (type === 'danger') line.classList.add('text-danger');
        else if (type === 'success') line.classList.add('text-success');
        else if (type === 'warning') line.classList.add('text-warning');
        else line.classList.add('text-cyan');

        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        line.textContent = `[${timestamp}] ${message}`;
        terminalLogs.appendChild(line);
        if (terminalLogs.children.length > 100) terminalLogs.removeChild(terminalLogs.firstChild);
        terminalLogs.scrollTop = terminalLogs.scrollHeight;
    };

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

    toggleBtn.addEventListener('click', async () => {
        if (!window.aegisAPI) return addLog("Error: aegisAPI not found. Run as Electron app.", "danger");

        if (!isShieldActive) {
            const res = await window.aegisAPI.startShield();
            if (res.status === 'started' || res.status === 'already_running') {
                isShieldActive = true;
                applyLanguage(currentLang);
                toggleBtn.classList.add('danger-mode');
                statusDot.classList.replace('offline', 'online');
                radarSweep.style.animationPlayState = 'running';
                addLog("Aegis Shield Activated. Monitoring Real System...", "success");
                startUptimeTimer();
            }
        } else {
            const res = await window.aegisAPI.stopShield();
            if (res.status === 'stopped' || res.status === 'already_stopped') {
                isShieldActive = false;
                applyLanguage(currentLang);
                toggleBtn.classList.remove('danger-mode');
                statusDot.classList.replace('online', 'offline');
                radarSweep.style.animationPlayState = 'paused';
                addLog("Aegis Shield Deactivated. System unprotected!", "warning");
                clearInterval(uptimeInterval);
            }
        }
    });

    if (window.aegisAPI) {
        // استقبال العمليات الحقيقية
        window.aegisAPI.onShieldEvent((data) => {
            blockedCount++;
            blockedCounter.textContent = blockedCount;

            if (data.severity === 'Critical') {
                threatLevel.textContent = translations[currentLang].threat_critical;
                threatLevel.className = 'stat-value text-danger';
                addLog(`[CRITICAL] ${data.process} (PID: ${data.pid}) | CPU: ${data.cpu}% | RAM: ${data.mem}MB | User: ${data.user}`, 'danger');
            } else if (data.severity === 'High') {
                threatLevel.textContent = translations[currentLang].threat_high;
                threatLevel.className = 'stat-value text-warning';
                addLog(`[HIGH] ${data.process} | CPU: ${data.cpu}% | RAM: ${data.mem}MB`, 'warning');
            } else {
                threatLevel.textContent = translations[currentLang].threat_low;
                threatLevel.className = 'stat-value text-cyan';
                addLog(`[MONITOR] ${data.process} | CPU: ${data.cpu}% | RAM: ${data.mem}MB`, 'info');
            }

            const radar = document.querySelector('.radar');
            radar.style.boxShadow = '0 0 40px rgba(239, 68, 68, 0.6)';
            setTimeout(() => { radar.style.boxShadow = 'none'; }, 500);
        });

        // استقبال حالة المعالج والذاكرة الحقيقية
        window.aegisAPI.onSystemStats((stats) => {
            // تحديث شاشة سلامة النظام بنسبة استهلاك المعالج الحقيقية
            const integrity = (100 - parseFloat(stats.cpu)).toFixed(0);
            document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = `${integrity}%`;
        });
    }

    applyLanguage('ar');
    radarSweep.style.animationPlayState = 'paused';
});
