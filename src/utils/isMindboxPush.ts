export function isMindboxPush(input: unknown): boolean {
    if (!input || typeof input !== "object") {
        return false;
    }
    const candidate: any = (input as any).notification ?? input;

    try {
        const iosPayload = candidate?.request?.trigger?.payload;
        if (iosPayload?.uniqueKey) {
            return true;
        }
        const androidData = candidate?.request?.content?.data;
        if ((androidData as any)?.uniq_push_key) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}


