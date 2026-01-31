// ================================================================================
//                    AUDIT LOGGING UTILITY
//           Track All User Actions & System Events
// ================================================================================

const { pool } = require('../config/database');

// ================================================================================
// LOG AUDIT FUNCTION
// ================================================================================

async function logAudit({
    userId = null,
    userName = null,
    sessionId = null,
    actionType,           // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    actionCategory,       // 'USER', 'SORT_MASTER', 'SETTINGS', etc.
    actionDescription,
    targetTable = null,
    targetId = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null,
    httpMethod = null,
    requestUrl = null,
    requestParams = null,
    status = 'SUCCESS',   // 'SUCCESS', 'FAILED', 'ERROR'
    errorMessage = null
}) {
    try {
        await pool.query(`
            INSERT INTO audit_logs (
                user_id,
                user_name,
                session_id,
                action_type,
                action_category,
                action_description,
                target_table,
                target_id,
                old_values,
                new_values,
                ip_address,
                user_agent,
                http_method,
                request_url,
                request_params,
                status,
                error_message,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        `, [
            userId,
            userName,
            sessionId,
            actionType,
            actionCategory,
            actionDescription,
            targetTable,
            targetId,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            ipAddress,
            userAgent,
            httpMethod,
            requestUrl,
            requestParams ? JSON.stringify(requestParams) : null,
            status,
            errorMessage
        ]);
        
        console.log('📝 Audit logged:', actionType, '-', actionDescription);
        
    } catch (error) {
        // Don't throw error - audit logging should not break main flow
        console.error('❌ Audit log error:', error.message);
    }
}

// ================================================================================
// MIDDLEWARE TO AUTO-LOG ALL API REQUESTS
// ================================================================================

function auditMiddleware(req, res, next) {
    // Store original send function
    const originalSend = res.json;
    
    // Override send function to log after response
    res.json = function(data) {
        // Log API call
        if (req.userId) {
            logAudit({
                userId: req.userId,
                userName: req.userName,
                sessionId: req.sessionId,
                actionType: req.method,
                actionCategory: 'API',
                actionDescription: `${req.method} ${req.originalUrl}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                httpMethod: req.method,
                requestUrl: req.originalUrl,
                requestParams: req.body,
                status: data.success ? 'SUCCESS' : 'FAILED',
                errorMessage: data.success ? null : data.message
            });
        }
        
        // Call original send
        return originalSend.call(this, data);
    };
    
    next();
}

module.exports = {
    logAudit,
    auditMiddleware
};
