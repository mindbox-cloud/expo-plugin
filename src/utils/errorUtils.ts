export const MINDBOX_PLUGIN_LOG_TAG = '[Mindbox Expo Plugin]';

function logWithOptionalDetails(
    logFn: typeof console.log | typeof console.warn,
    message: string,
    details?: Record<string, any>
): void {
    if (details) {
        logFn(message, details);
    } else {
        logFn(message);
    }
}

export const logError = (
    operation: string,
    error: Error | string,
    details?: Record<string, any>
): void => {
    const errorMessage = error instanceof Error ? error.message : error;
    const logMessage = `${MINDBOX_PLUGIN_LOG_TAG} Failed to ${operation}: ${errorMessage}`;
    logWithOptionalDetails(console.warn, logMessage, details);
};

export const logWarning = (
    operation: string,
    message: string,
    details?: Record<string, any>
): void => {
    const logMessage = `${MINDBOX_PLUGIN_LOG_TAG} Warning in ${operation}: ${message}`;
    logWithOptionalDetails(console.warn, logMessage, details);
};

export const logSuccess = (
    operation: string,
    details?: Record<string, any>
): void => {
    const logMessage = `${MINDBOX_PLUGIN_LOG_TAG} ${operation} completed successfully`;
    logWithOptionalDetails(console.log, logMessage, details);
};

export const withErrorHandling = async <T>(
    operation: string,
    fn: () => Promise<T>,
    details?: Record<string, any>
): Promise<T | null> => {
    try {
        const result = await fn();
        logSuccess(operation, details);
        return result;
    } catch (error) {
        logError(operation, error as Error, details);
        return null;
    }
};

