import { ConfigPlugin, withInfoPlist } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { BG_TASK_DB_CLEAN_APP_PROCESSING_SUFFIX, BG_TASK_GD_APP_PROCESSING_SUFFIX, BG_TASK_GD_APP_REFRESH_SUFFIX, BG_TASK_PREFIX, INFO_PLIST_KEY_BG_TASKS, INFO_PLIST_KEY_UI_BACKGROUND_MODES, UI_BACKGROUND_MODE_FETCH, UI_BACKGROUND_MODE_PROCESSING, UI_BACKGROUND_MODE_REMOTE } from "../helpers/iosConstants";
import { logSuccess, logWarning } from "../utils/errorUtils";

const withMindboxInfoPlist: ConfigPlugin<MindboxPluginProps> = (config) => {
    return withInfoPlist(config, (c) => {
        const info = c.modResults as unknown as Record<string, unknown>;

        const currentModes = Array.isArray((info as Record<string, unknown>)[INFO_PLIST_KEY_UI_BACKGROUND_MODES])
            ? ((info as Record<string, unknown>)[INFO_PLIST_KEY_UI_BACKGROUND_MODES] as string[])
            : [];
        const requiredModes = [UI_BACKGROUND_MODE_REMOTE, UI_BACKGROUND_MODE_PROCESSING, UI_BACKGROUND_MODE_FETCH];
        const mergedModes = Array.from(new Set([...currentModes, ...requiredModes]));
        (info as Record<string, unknown>)[INFO_PLIST_KEY_UI_BACKGROUND_MODES] = mergedModes;

        const currentTasks = Array.isArray((info as Record<string, unknown>)[INFO_PLIST_KEY_BG_TASKS])
            ? ((info as Record<string, unknown>)[INFO_PLIST_KEY_BG_TASKS] as string[])
            : [];
        const bundleId = c.ios?.bundleIdentifier;
        if (!bundleId) {
            logWarning("withInfoPlist", "iOS bundleIdentifier is not defined; BGTask identifiers cannot be generated");
        } else {
            const base = `${BG_TASK_PREFIX}${bundleId}`;
            const requiredTasks = [
                `${base}${BG_TASK_GD_APP_REFRESH_SUFFIX}`,
                `${base}${BG_TASK_GD_APP_PROCESSING_SUFFIX}`,
                `${base}${BG_TASK_DB_CLEAN_APP_PROCESSING_SUFFIX}`,
            ];
            const mergedTasks = Array.from(new Set([...currentTasks, ...requiredTasks]));
            (info as Record<string, unknown>)[INFO_PLIST_KEY_BG_TASKS] = mergedTasks;
        }

        c.modResults = info as unknown as typeof c.modResults;
        logSuccess("withInfoPlist", {
            addedBackgroundModes: requiredModes,
            hasBundleId: Boolean(bundleId),
        });
        return c;
    });
};

export default withMindboxInfoPlist;


