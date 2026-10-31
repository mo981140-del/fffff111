/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalApp } from '../types/app';

export const DEMO_APPS: LocalApp[] = [
  {
    id: 'demo-finance-calc',
    name: 'حاسبة العوائد والاستثمار الذهبية',
    description: 'تطبيق مالي فاخر لحساب العائد التراكمي ونمو رأس المال والمحافظ الاستثمارية.',
    entryPoint: 'index.html',
    createdAt: 1730000000000,
    updatedAt: 1730000000000,
    category: 'أدوات مالية',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.12h-2c-.1-.71-.63-1.61-2.18-1.61-1.39 0-2.07.69-2.07 1.48 0 .74.45 1.41 2.67 1.95 2.68.64 4.19 1.63 4.19 3.86 0 1.77-1.32 2.94-3.07 3.34z"/></svg>',
    files: [
      {
        path: 'index.html',
        isBinary: false,
        mimeType: 'text/html;charset=utf-8',
        size: 3200,
        content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>حاسبة العوائد الذهبية</title>
  <link rel="stylesheet" href="assets/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="calculator-container">
    <header class="header">
      <div class="logo-box">
        <img src="assets/gold-coin.svg" class="logo-icon" alt="Gold">
        <h1>حاسبة العوائد والاستثمار التراكمي</h1>
      </div>
      <p class="subtitle">محاكاة دقيقة لنمو رأس المال وصافي الأرباح التراكمية</p>
    </header>

    <div class="calc-grid">
      <div class="card inputs-card">
        <div class="input-group">
          <label>رأس المال المبدئي (<span id="currencyLabel">ريال</span>):</label>
          <input type="number" id="principal" value="50000" min="1000" step="5000">
          <input type="range" id="principalRange" min="5000" max="500000" step="5000" value="50000">
        </div>

        <div class="input-group">
          <label>المساهمة الشهرية المضافة:</label>
          <input type="number" id="monthly" value="2500" min="0" step="500">
        </div>

        <div class="input-row">
          <div class="input-group">
            <label>العائد السنوي المتوقع (%):</label>
            <input type="number" id="rate" value="12" min="1" max="50" step="0.5">
          </div>
          <div class="input-group">
            <label>فترة الاستثمار (سنوات):</label>
            <input type="number" id="years" value="10" min="1" max="40">
          </div>
        </div>

        <button id="calcBtn" class="gold-btn">⚡ إعادة الحساب المالي</button>
      </div>

      <div class="card results-card">
        <h2 class="card-title">توقعات المحفظة المالية</h2>
        <div class="metrics-grid">
          <div class="metric-box total">
            <span class="m-label">إجمالي القيمة المستقبلية</span>
            <span class="m-val" id="totalValue">0</span>
          </div>
          <div class="metric-box profit">
            <span class="m-label">صافي الأرباح المركبة</span>
            <span class="m-val" id="totalProfit">0</span>
          </div>
          <div class="metric-box invested">
            <span class="m-label">إجمالي المبالغ المودعة</span>
            <span class="m-val" id="totalInvested">0</span>
          </div>
        </div>

        <div class="progress-container">
          <div class="progress-bar">
            <div id="investedBar" class="bar-part invested-part"></div>
            <div id="profitBar" class="bar-part profit-part"></div>
          </div>
          <div class="progress-legend">
            <span><span class="dot d-inv"></span> إيداعاتك: <strong id="invPct">0%</strong></span>
            <span><span class="dot d-prof"></span> أرباحك: <strong id="profPct">0%</strong></span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script src="assets/calculator.js"></script>
</body>
</html>`
      },
      {
        path: 'assets/styles.css',
        isBinary: false,
        mimeType: 'text/css;charset=utf-8',
        size: 2400,
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #0B0C10;
  color: #E2E8F0;
  font-family: 'Cairo', sans-serif;
  padding: 30px 20px;
  min-height: 100vh;
}
.calculator-container {
  max-width: 960px;
  margin: 0 auto;
}
.header {
  text-align: center;
  margin-bottom: 28px;
}
.logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}
.logo-icon {
  width: 36px;
  height: 36px;
}
h1 {
  font-size: 26px;
  font-weight: 800;
  color: #FFD700;
  letter-spacing: -0.5px;
}
.subtitle {
  color: #94A3B8;
  font-size: 14px;
}
.calc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 768px) {
  .calc-grid { grid-template-columns: 1fr; }
}
.card {
  background: #14171E;
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}
.card-title {
  font-size: 18px;
  color: #FFD700;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
  padding-bottom: 10px;
}
.input-group {
  margin-bottom: 18px;
}
.input-row {
  display: flex;
  gap: 14px;
}
label {
  display: block;
  font-size: 13px;
  color: #CBD5E1;
  margin-bottom: 6px;
  font-weight: 600;
}
input[type="number"] {
  width: 100%;
  background: #0B0C10;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
  color: #FFF;
  font-size: 16px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
input[type="number"]:focus {
  border-color: #FFD700;
}
input[type="range"] {
  width: 100%;
  accent-color: #FFD700;
  margin-top: 8px;
  cursor: pointer;
}
.gold-btn {
  width: 100%;
  background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%);
  color: #0B0C10;
  font-weight: 800;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}
.gold-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.45);
}
.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
}
.metric-box {
  background: #0B0C10;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.metric-box.total {
  border-color: rgba(255, 215, 0, 0.4);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), transparent);
}
.m-label {
  font-size: 13px;
  color: #94A3B8;
}
.m-val {
  font-size: 20px;
  font-weight: 800;
  color: #FFF;
}
.metric-box.total .m-val {
  color: #FFD700;
  font-size: 24px;
}
.metric-box.profit .m-val {
  color: #34D399;
}
.progress-container {
  margin-top: 10px;
}
.progress-bar {
  display: flex;
  height: 14px;
  background: #1E293B;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 10px;
}
.bar-part {
  height: 100%;
  transition: width 0.4s ease;
}
.invested-part { background: #3B82F6; }
.profit-part { background: #10B981; }
.progress-legend {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94A3B8;
}
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 4px;
}
.d-inv { background: #3B82F6; }
.d-prof { background: #10B981; }`
      },
      {
        path: 'assets/calculator.js',
        isBinary: false,
        mimeType: 'text/javascript;charset=utf-8',
        size: 1800,
        content: `(function() {
  const pInput = document.getElementById('principal');
  const pRange = document.getElementById('principalRange');
  const mInput = document.getElementById('monthly');
  const rInput = document.getElementById('rate');
  const yInput = document.getElementById('years');
  const calcBtn = document.getElementById('calcBtn');

  const totalValEl = document.getElementById('totalValue');
  const totalProfitEl = document.getElementById('totalProfit');
  const totalInvEl = document.getElementById('totalInvested');
  const invBar = document.getElementById('investedBar');
  const profBar = document.getElementById('profitBar');
  const invPctEl = document.getElementById('invPct');
  const profPctEl = document.getElementById('profPct');

  function formatCurrency(num) {
    return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(num) + ' ريال';
  }

  function calculate() {
    const P = parseFloat(pInput.value) || 0;
    const PMT = parseFloat(mInput.value) || 0;
    const annualRate = (parseFloat(rInput.value) || 0) / 100;
    const years = parseFloat(yInput.value) || 1;

    const r = annualRate / 12;
    const n = years * 12;

    let futureValue = P * Math.pow(1 + r, n);
    if (r > 0) {
      futureValue += PMT * ((Math.pow(1 + r, n) - 1) / r);
    } else {
      futureValue += PMT * n;
    }

    const totalInvested = P + (PMT * n);
    const totalProfit = Math.max(0, futureValue - totalInvested);

    totalValEl.textContent = formatCurrency(futureValue);
    totalProfitEl.textContent = formatCurrency(totalProfit);
    totalInvEl.textContent = formatCurrency(totalInvested);

    const invPercent = totalInvested > 0 ? (totalInvested / futureValue) * 100 : 0;
    const profPercent = futureValue > 0 ? (totalProfit / futureValue) * 100 : 0;

    invBar.style.width = Math.min(100, Math.max(0, invPercent)) + '%';
    profBar.style.width = Math.min(100, Math.max(0, profPercent)) + '%';

    invPctEl.textContent = Math.round(invPercent) + '%';
    profPctEl.textContent = Math.round(profPercent) + '%';
  }

  pInput.addEventListener('input', () => { pRange.value = pInput.value; calculate(); });
  pRange.addEventListener('input', () => { pInput.value = pRange.value; calculate(); });
  mInput.addEventListener('input', calculate);
  rInput.addEventListener('input', calculate);
  yInput.addEventListener('input', calculate);
  calcBtn.addEventListener('click', calculate);

  // Initial calculation
  calculate();
})();`
      },
      {
        path: 'assets/gold-coin.svg',
        isBinary: false,
        mimeType: 'image/svg+xml',
        size: 600,
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="#D4AF37" stroke="#FFD700" stroke-width="6"/>
  <circle cx="50" cy="50" r="38" fill="#14171E" stroke="#FFD700" stroke-width="2"/>
  <text x="50" y="62" font-family="'Cairo', sans-serif" font-size="34" font-weight="900" fill="#FFD700" text-anchor="middle">﷼</text>
</svg>`
      }
    ]
  },
  {
    id: 'demo-markdown-studio',
    name: 'استوديو التدوين وملاحظات ماركداون',
    description: 'محرر ومفسر نصوص تفاعلي حي مع معاينة فورية ودعم للعناوين والأكواد والجداول.',
    entryPoint: 'index.html',
    createdAt: 1730000001000,
    updatedAt: 1730000001000,
    category: 'أدوات إنتاجية',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
    files: [
      {
        path: 'index.html',
        isBinary: false,
        mimeType: 'text/html;charset=utf-8',
        size: 3400,
        content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>استوديو ماركداون الفوري</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
  <div class="app-layout">
    <header class="studio-bar">
      <div class="bar-title">
        <span class="logo-gem">✍️</span>
        <h2>استوديو ماركداون الفوري</h2>
      </div>
      <div class="bar-actions">
        <button id="copyBtn" class="action-btn">📋 نسخ المخرجات</button>
        <button id="clearBtn" class="action-btn">🗑️ مسح</button>
        <div class="stats-badge" id="statsBadge">الكلمات: 0 | الحروف: 0</div>
      </div>
    </header>

    <div class="editor-panes">
      <div class="pane input-pane">
        <div class="pane-header">محرر ماركداون (Markdown)</div>
        <textarea id="markdownInput" spellcheck="false"># مرحباً بك في حاوية التطبيقات المحلية! 💎

تم تشغيل هذا التطبيق بنجاح عبر **محرك Blob URL & srcdoc** بدون أي خوادم أو منافذ!

## الميزات الرئيسية:
- **سرعة فائقة**: يعمل بنسبة 100% داخل المتصفح دون أي زمن استجابة للشبكة.
- **تخزين دائم**: يتم حفظ جميع الملفات محلياً في تقنية \`IndexedDB\`.
- **نوافذ منفصلة**: افتح أي تطبيق في نافذة مستقلة تدعم التثبيت في الأعلى.
- **أيقونات مخصصة**: يمكنك رفع أيقونة خاصة وتثبيتها على سطح المكتب.

### مثال على كود برمجي:
\`\`\`javascript
const engine = new LocalAppContainer();
await engine.launch({ isolated: true, blobEngine: true });
console.log("App running successfully!");
\`\`\`

> "البساطة هي أقصى درجات الرقي والاتقان."</textarea>
      </div>

      <div class="pane output-pane">
        <div class="pane-header">المعاينة المباشرة (Live Preview)</div>
        <div id="previewArea" class="preview-content"></div>
      </div>
    </div>
  </div>
  <script src="editor.js"></script>
</body>
</html>`
      },
      {
        path: 'style.css',
        isBinary: false,
        mimeType: 'text/css;charset=utf-8',
        size: 2600,
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #0B0C10;
  color: #E2E8F0;
  font-family: 'Cairo', sans-serif;
  height: 100vh;
  overflow: hidden;
}
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.studio-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #14171E;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  padding: 10px 20px;
}
.bar-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bar-title h2 {
  font-size: 16px;
  font-weight: 700;
  color: #FFD700;
}
.bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.action-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.25);
  color: #E2E8F0;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.action-btn:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: #FFD700;
  color: #FFD700;
}
.stats-badge {
  font-size: 12px;
  color: #94A3B8;
  background: #0B0C10;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #1E293B;
}
.editor-panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  overflow: hidden;
}
.pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.pane-header {
  background: #0F1218;
  color: #94A3B8;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.input-pane {
  border-left: 1px solid rgba(255, 215, 0, 0.15);
}
#markdownInput {
  flex: 1;
  background: #0B0C10;
  color: #F8FAFC;
  border: none;
  padding: 20px;
  font-family: 'JetBrains Mono', 'Cairo', monospace;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
  outline: none;
}
.preview-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #10131A;
  color: #E2E8F0;
  line-height: 1.8;
}
.preview-content h1 { font-size: 24px; color: #FFD700; margin-bottom: 14px; border-bottom: 1px solid rgba(255,215,0,0.2); padding-bottom: 8px; }
.preview-content h2 { font-size: 20px; color: #F59E0B; margin: 20px 0 10px; }
.preview-content h3 { font-size: 16px; color: #E2E8F0; margin: 16px 0 8px; }
.preview-content p { margin-bottom: 14px; color: #CBD5E1; }
.preview-content ul { margin: 0 20px 16px; }
.preview-content li { margin-bottom: 6px; }
.preview-content pre {
  background: #0B0C10;
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 14px;
  margin: 14px 0;
  overflow-x: auto;
  direction: ltr;
  text-align: left;
}
.preview-content code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #38BDF8;
}
.preview-content blockquote {
  border-right: 4px solid #FFD700;
  padding: 10px 16px;
  background: rgba(255, 215, 0, 0.05);
  margin: 16px 0;
  color: #FDE047;
  border-radius: 0 8px 8px 0;
}`
      },
      {
        path: 'editor.js',
        isBinary: false,
        mimeType: 'text/javascript;charset=utf-8',
        size: 2200,
        content: `(function() {
  const textarea = document.getElementById('markdownInput');
  const preview = document.getElementById('previewArea');
  const stats = document.getElementById('statsBadge');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');

  function parseMarkdown(md) {
    let html = md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Code blocks
      .replace(/\`\`\`([a-z]*)\n([\s\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
      // Inline code
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Blockquote
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Bold & Italic
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\\s*-\\s*(.*$)/gim, '<li>$1</li>')
      // Paragraphs
      .replace(/\\n\\n+/g, '</p><p>');

    html = '<p>' + html + '</p>';
    // Fix list tags wrapping
    html = html.replace(/(<li>[\\s\\S]*?<\\/li>)/g, '<ul>$1</ul>');
    return html;
  }

  function update() {
    const text = textarea.value;
    preview.innerHTML = parseMarkdown(text);

    const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
    const chars = text.length;
    stats.textContent = 'الكلمات: ' + words + ' | الحروف: ' + chars;
  }

  textarea.addEventListener('input', update);
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(preview.innerHTML).then(() => {
      copyBtn.textContent = '✅ تم النسخ!';
      setTimeout(() => copyBtn.textContent = '📋 نسخ المخرجات', 2000);
    });
  });
  clearBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من مسح المحتوى؟')) {
      textarea.value = '';
      update();
    }
  });

  update();
})();`
      }
    ]
  },
  {
    id: 'demo-cyber-orbit',
    name: 'لعبة مدار السايبر الفضائية',
    description: 'لعبة أركيد تفاعلية تعتمد على HTML5 Canvas وتأثيرات الجسيمات والمؤثرات الصوتية المركبة.',
    entryPoint: 'index.html',
    createdAt: 1730000002000,
    updatedAt: 1730000002000,
    category: 'ألعاب',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
    files: [
      {
        path: 'index.html',
        isBinary: false,
        mimeType: 'text/html;charset=utf-8',
        size: 2800,
        content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>مدار السايبر الفضائي</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&display=swap" rel="stylesheet">
</head>
<body>
  <div class="game-hud">
    <div class="hud-item score-box">النقاط: <span id="scoreVal">0</span></div>
    <div class="hud-item high-box">الأعلى: <span id="highVal">0</span></div>
    <div class="hud-item hp-box">الدرع: <span id="hpVal">100%</span></div>
  </div>

  <canvas id="gameCanvas"></canvas>

  <div id="startOverlay" class="overlay">
    <div class="modal">
      <h1>🚀 مدار السايبر الفضائي</h1>
      <p>تحكم بالمركبة بالماوس أو الأسهم، واضغط للإطلاق وتدمير الكويكبات الذهبية!</p>
      <button id="startBtn" class="play-btn">ابدأ الرحلة الفضائية</button>
    </div>
  </div>
  <script src="game.js"></script>
</body>
</html>`
      },
      {
        path: 'style.css',
        isBinary: false,
        mimeType: 'text/css;charset=utf-8',
        size: 1600,
        content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body, html { width: 100%; height: 100%; overflow: hidden; background: #050608; font-family: 'Cairo', sans-serif; }
#gameCanvas { display: block; width: 100vw; height: 100vh; }
.game-hud {
  position: fixed;
  top: 15px;
  right: 20px;
  left: 20px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
}
.hud-item {
  background: rgba(19, 22, 28, 0.85);
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 8px 18px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  color: #FFF;
  backdrop-filter: blur(8px);
}
.hud-item span { color: #FFD700; font-weight: 900; }
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 12, 16, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(6px);
}
.modal {
  background: #14171E;
  border: 2px solid #FFD700;
  border-radius: 20px;
  padding: 36px;
  text-align: center;
  max-width: 480px;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.25);
}
.modal h1 { color: #FFD700; font-size: 26px; margin-bottom: 14px; }
.modal p { color: #CBD5E1; font-size: 14px; margin-bottom: 24px; line-height: 1.7; }
.play-btn {
  background: linear-gradient(135deg, #FFD700, #B8860B);
  color: #0B0C10;
  font-size: 16px;
  font-weight: 900;
  border: none;
  padding: 12px 32px;
  border-radius: 9999px;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}
.play-btn:hover { transform: scale(1.05); }`
      },
      {
        path: 'game.js',
        isBinary: false,
        mimeType: 'text/javascript;charset=utf-8',
        size: 3800,
        content: `(function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreVal = document.getElementById('scoreVal');
  const highVal = document.getElementById('highVal');
  const hpVal = document.getElementById('hpVal');
  const overlay = document.getElementById('startOverlay');
  const startBtn = document.getElementById('startBtn');

  let width, height;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  let isPlaying = false;
  let score = 0;
  let highScore = 0;
  let hp = 100;

  const player = {
    x: width / 2,
    y: height - 100,
    targetX: width / 2,
    size: 20
  };

  const lasers = [];
  const asteroids = [];
  const particles = [];

  // Web Audio Synth
  let audioCtx = null;
  function playSound(freq, type = 'sine', duration = 0.1) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  function spawnAsteroid() {
    asteroids.push({
      x: Math.random() * width,
      y: -40,
      radius: 15 + Math.random() * 25,
      speed: 2 + Math.random() * 3,
      angle: 0,
      vAngle: (Math.random() - 0.5) * 0.05
    });
  }

  function shoot() {
    lasers.push({ x: player.x, y: player.y - 20, speed: 12 });
    playSound(750, 'triangle', 0.08);
  }

  window.addEventListener('mousemove', (e) => {
    player.targetX = e.clientX;
  });

  window.addEventListener('click', () => {
    if (isPlaying) shoot();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isPlaying) shoot();
  });

  startBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    isPlaying = true;
    score = 0;
    hp = 100;
    scoreVal.textContent = '0';
    hpVal.textContent = '100%';
    asteroids.length = 0;
    lasers.length = 0;
    particles.length = 0;
  });

  let lastSpawn = 0;
  function update(time) {
    if (isPlaying) {
      player.x += (player.targetX - player.x) * 0.15;

      if (time - lastSpawn > 900) {
        spawnAsteroid();
        lastSpawn = time;
      }

      // Lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.y -= l.speed;
        if (l.y < 0) lasers.splice(i, 1);
      }

      // Asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        a.y += a.speed;
        a.angle += a.vAngle;

        // Collision with lasers
        for (let j = lasers.length - 1; j >= 0; j--) {
          const l = lasers[j];
          const dist = Math.hypot(a.x - l.x, a.y - l.y);
          if (dist < a.radius) {
            playSound(220, 'square', 0.15);
            // Spawn particles
            for (let k = 0; k < 12; k++) {
              particles.push({
                x: a.x, y: a.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1
              });
            }
            asteroids.splice(i, 1);
            lasers.splice(j, 1);
            score += 100;
            scoreVal.textContent = score;
            if (score > highScore) {
              highScore = score;
              highVal.textContent = highScore;
            }
            break;
          }
        }

        // Collision with player
        if (a && Math.hypot(a.x - player.x, a.y - player.y) < a.radius + player.size) {
          playSound(110, 'sawtooth', 0.25);
          asteroids.splice(i, 1);
          hp -= 25;
          hpVal.textContent = hp + '%';
          if (hp <= 0) {
            isPlaying = false;
            overlay.style.display = 'flex';
            startBtn.textContent = 'إعادة اللعب (النقاط: ' + score + ')';
          }
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    // Render
    ctx.fillStyle = '#07090E';
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    for (let s = 0; s < 50; s++) {
      ctx.fillRect((s * 137) % width, (s * 251 + (time * 0.05)) % height, 2, 2);
    }

    // Draw Lasers
    ctx.fillStyle = '#FFD700';
    for (const l of lasers) {
      ctx.fillRect(l.x - 2, l.y, 4, 16);
    }

    // Draw Asteroids
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = '#1A1E29';
      ctx.strokeStyle = '#E5C158';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw Particles
    for (const p of particles) {
      ctx.fillStyle = 'rgba(255, 215, 0, ' + p.life + ')';
      ctx.fillRect(p.x, p.y, 3, 3);
    }

    // Draw Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, -player.size);
    ctx.lineTo(player.size * 0.8, player.size);
    ctx.lineTo(-player.size * 0.8, player.size);
    ctx.closePath();
    ctx.fill();
    // Glow thruster
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-4, player.size, 8, 8 + Math.random() * 6);
    ctx.restore();

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
})();`
      }
    ]
  }
];
