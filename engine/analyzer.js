const si = require('systeminformation');

async function scanSystem() {
    try {
        // 1. سحب بيانات المعالج والذاكرة الحقيقية
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const processes = await si.processes();

        // 2. ترتيب العمليات حسب استهلاك المعالج (CPU)
        const sortedByCpu = processes.list.sort((a, b) => b.cpu - a.cpu);
        
        // 3. فلترة العمليات اللي بتستهلك موارد بشكل مريب (أكتر من 15% معالج أو 500 ميجا رام)
        const highResourceProcesses = sortedByCpu.filter(p => p.cpu > 15 || (p.memRss / 1024 / 1024) > 500);

        if (highResourceProcesses.length === 0) {
            return { threat: null, system: { cpu: cpu.currentLoad.toFixed(1), mem: (mem.used / mem.total * 100).toFixed(1) } };
        }

        const topProcess = highResourceProcesses[0];
        const processMemMB = (topProcess.memRss / 1024 / 1024).toFixed(1); // تحويل الرام لميجابايت

        // 4. تحديد مستوى الخطورة بناءً على الأرقام الحقيقية
        let severity = 'Low';
        if (topProcess.cpu > 60 || processMemMB > 2000) severity = 'Critical';
        else if (topProcess.cpu > 30 || processMemMB > 1000) severity = 'High';
        else if (topProcess.cpu > 15 || processMemMB > 500) severity = 'Medium';

        return {
            threat: {
                type: 'Resource Abuse (High Usage)',
                severity: severity,
                process: topProcess.name,
                cpu: topProcess.cpu.toFixed(1),
                mem: processMemMB,
                pid: topProcess.pid,
                path: topProcess.path || 'System Process',
                user: topProcess.user || 'System'
            },
            system: { 
                cpu: cpu.currentLoad.toFixed(1), 
                mem: (mem.used / mem.total * 100).toFixed(1) 
            }
        };
    } catch (error) {
        console.error("Analyzer Error:", error);
        return { threat: null, system: { cpu: 0, mem: 0 } };
    }
}

module.exports = { scanSystem };
