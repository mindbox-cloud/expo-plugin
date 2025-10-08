export const logError = (
    operation: string,
    error: Error | string,
    details?: Record<string, any>
): void => {
    const errorMessage = error instanceof Error ? error.message : error;
    const logMessage = `[Mindbox Plugin] Failed to ${operation}: ${errorMessage}`;

    if (details) {
        console.warn(logMessage, details);
    } else {
        console.warn(logMessage);
    }
};

export const logWarning = (
    operation: string,
    message: string,
    details?: Record<string, any>
): void => {
    const logMessage = `[Mindbox Plugin] Warning in ${operation}: ${message}`;

    if (details) {
        console.warn(logMessage, details);
    } else {
        console.warn(logMessage);
    }
};

export const logSuccess = (
    operation: string,
    details?: Record<string, any>
): void => {
    if (details) {
        console.log(`[Mindbox Plugin] ${operation} completed successfully`, details);
    } else {
        console.log(`[Mindbox Plugin] ${operation} completed successfully`);
    }
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

