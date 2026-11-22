function evaluateThreat(threatData) {
    if (!threatData) return null;

    let action = '';

    switch (threatData.severity) {
        case 'Critical':
            action = 'Immediate Action Required (Investigate Process)';
            break;
        case 'High':
            action = 'Warning: High Resource Consumption';
            break;
        case 'Medium':
            action = 'Monitor: Moderate Resource Usage';
            break;
        case 'Low':
            action = 'Normal';
            break;
        default:
            action = 'Logged';
    }

    return {
        ...threatData,
        action: action,
        timestamp: Date.now()
    };
}

module.exports = { evaluateThreat };
