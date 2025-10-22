import { ConfigPlugin, withEntitlementsPlist } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { 
    APS_ENV_ENTITLEMENT_KEY, 
    ENTITLEMENT_APP_GROUPS_KEY, 
    ENTITLEMENT_GROUP_DEFAULT, 
    ENTITLEMENT_GROUP_PREFIX 
} from "../helpers/iosConstants";
import { logSuccess, logWarning } from "../utils/errorUtils";

type EntitlementsDictionary = Record<string, unknown>;
type ApsEnvironment = "production" | "development";

const withMindboxEntitlements: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    return withEntitlementsPlist(config, (c) => {
        const entitlements = c.modResults as unknown as EntitlementsDictionary;
        const bundleId = c.ios?.bundleIdentifier;
        
        setApsEnvironment(entitlements, props.iosMode);
        setAppGroups(entitlements, bundleId, props.iosAppGroupId);
        
        logSuccess("configure entitlements for Mindbox", { 
            aps: entitlements[APS_ENV_ENTITLEMENT_KEY], 
            appGroups: entitlements[ENTITLEMENT_APP_GROUPS_KEY],
            bundleId
        });
        
        return c;
    });
};

function setApsEnvironment(entitlements: EntitlementsDictionary, iosMode?: string): void {
    const apsEnv: ApsEnvironment = iosMode === "production" ? "production" : "development";
    entitlements[APS_ENV_ENTITLEMENT_KEY] = apsEnv;
}

function getExistingAppGroups(entitlements: EntitlementsDictionary): string[] {
    const existingGroups = entitlements[ENTITLEMENT_APP_GROUPS_KEY];
    
    if (Array.isArray(existingGroups)) {
        return existingGroups.filter((g): g is string => typeof g === 'string');
    }
    
    return [];
}

function determineRequiredAppGroup(bundleId: string | undefined, customAppGroupId?: string): string {
    if (customAppGroupId) {
        return customAppGroupId;
    }
    if (bundleId) {
        return `${ENTITLEMENT_GROUP_PREFIX}.${bundleId}`;
    }
    return ENTITLEMENT_GROUP_DEFAULT;
}

function validateAndCleanAppGroupId(appGroupId: string): string {
    if (typeof appGroupId !== 'string') {
        logWarning("validateAppGroupId", "App group ID must be a string");
        return ENTITLEMENT_GROUP_DEFAULT;
    }
    let cleaned = appGroupId.replace(/[,\s]/g, '');
    if (!cleaned.startsWith('group.')) {
        cleaned = `group.${cleaned}`;
    }
    return cleaned;
}

function setAppGroups(
    entitlements: EntitlementsDictionary, 
    bundleId: string | undefined, 
    customAppGroupId?: string
): void {
    const currentGroups = getExistingAppGroups(entitlements);
    const requiredGroup = determineRequiredAppGroup(bundleId, customAppGroupId);
    const validatedGroup = validateAndCleanAppGroupId(requiredGroup);
    
    const mergedGroups = Array.from(new Set([...currentGroups, validatedGroup]));
    entitlements[ENTITLEMENT_APP_GROUPS_KEY] = mergedGroups;
}

export default withMindboxEntitlements;


