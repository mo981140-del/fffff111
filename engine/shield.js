// محرك الحماية (Aegis Shield Engine)
// بياخد الهجوم ويتصرف بناءً عليه

function neutralizeThreat(threat) {
    if (!threat) return null;

    let action = '';

    switch (threat.severity) {
        case 'Critical':
            action = 'Process Terminated & Memory Isolated';
            break;
        case 'High':
            action = 'Memory Nullified & Process Suspended';
            break;
        case 'Medium':
            action = 'Blocked Request & Logged';
            break;
        case 'Low':
            action = 'Monitored (No Action Needed)';
            break;
        default:
            action = 'Ignored';
    }

    return {
        ...threat,
        action: action,
        status: 'Neutralized'
    };
}

module.exports = { neutralizeThreat };
