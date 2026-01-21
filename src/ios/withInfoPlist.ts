import { ConfigPlugin, withInfoPlist } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { 
    BG_TASK_DB_CLEAN_APP_PROCESSING_SUFFIX, 
    BG_TASK_GD_APP_PROCESSING_SUFFIX, 
    BG_TASK_GD_APP_REFRESH_SUFFIX, 
    BG_TASK_PREFIX, 
    INFO_PLIST_KEY_BG_TASKS, 
    INFO_PLIST_KEY_UI_BACKGROUND_MODES, 
    UI_BACKGROUND_MODE_FETCH, 
    UI_BACKGROUND_MODE_PROCESSING, 
    UI_BACKGROUND_MODE_REMOTE 
} from "../helpers/iosConstants";
import { logWarning } from "../utils/errorUtils";

type InfoPlistDictionary = Record<string, unknown>;

const withMindboxInfoPlist: ConfigPlugin<MindboxPluginProps> = (config) => {
    return withInfoPlist(config, (c) => {
        const info = c.modResults as unknown as InfoPlistDictionary;
        addBackgroundModesToInfoPlist(info);
        addBackgroundTasksToInfoPlist(info, c.ios?.bundleIdentifier);
        return c;
    });
};

function getStringArrayFromPlist(plist: InfoPlistDictionary, key: string): string[] {
    const value = plist[key];
    return Array.isArray(value) ? (value as string[]) : [];
}

function mergeArraysUnique(existing: string[], toAdd: string[]): string[] {
    return Array.from(new Set([...existing, ...toAdd]));
}

function addBackgroundModesToInfoPlist(info: InfoPlistDictionary): void {
    const currentModes = getStringArrayFromPlist(info, INFO_PLIST_KEY_UI_BACKGROUND_MODES);
    const requiredModes = [
        UI_BACKGROUND_MODE_REMOTE, 
        UI_BACKGROUND_MODE_PROCESSING, 
        UI_BACKGROUND_MODE_FETCH
    ];
    const mergedModes = mergeArraysUnique(currentModes, requiredModes);
    
    info[INFO_PLIST_KEY_UI_BACKGROUND_MODES] = mergedModes;
}

function addBackgroundTasksToInfoPlist(
    info: InfoPlistDictionary, 
    bundleId: string | undefined
): void {
    if (!bundleId) {
        logWarning("addBackgroundTasksToInfoPlist", "iOS bundleIdentifier is not defined; BGTask identifiers cannot be generated");
        return;
    }
    const currentTasks = getStringArrayFromPlist(info, INFO_PLIST_KEY_BG_TASKS);
    const requiredTasks = generateBGTaskIdentifiers(bundleId);
    const mergedTasks = mergeArraysUnique(currentTasks, requiredTasks);
    info[INFO_PLIST_KEY_BG_TASKS] = mergedTasks;
}

function generateBGTaskIdentifiers(bundleId: string): string[] {
    const base = `${BG_TASK_PREFIX}${bundleId}`;
    return [
        `${base}${BG_TASK_GD_APP_REFRESH_SUFFIX}`,
        `${base}${BG_TASK_GD_APP_PROCESSING_SUFFIX}`,
        `${base}${BG_TASK_DB_CLEAN_APP_PROCESSING_SUFFIX}`,
    ];
}

export default withMindboxInfoPlist;
