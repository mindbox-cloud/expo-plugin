import { ConfigPlugin, withEntitlementsPlist } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { APS_ENV_ENTITLEMENT_KEY, ENTITLEMENT_APP_GROUPS_KEY, ENTITLEMENT_GROUP_DEFAULT, ENTITLEMENT_GROUP_PREFIX } from "../helpers/iosConstants";
import { logSuccess, logWarning } from "../utils/errorUtils";

const withMindboxEntitlements: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    return withEntitlementsPlist(config, (c) => {
        const ent = c.modResults as unknown as Record<string, unknown>;

        ent[APS_ENV_ENTITLEMENT_KEY] = props.iosMode === "production" ? "production" : "development";

        let currentGroups: string[] = [];
        const existingGroups = ent[ENTITLEMENT_APP_GROUPS_KEY];
        
        if (Array.isArray(existingGroups)) {
            currentGroups = existingGroups.filter((g): g is string => typeof g === 'string');
        }
        const resolvedBundleId = c.ios?.bundleIdentifier;
        let requiredGroup = props.iosAppGroupId || (resolvedBundleId ? `${ENTITLEMENT_GROUP_PREFIX}.${resolvedBundleId}` : ENTITLEMENT_GROUP_DEFAULT);

        if (typeof requiredGroup === 'string') {
            requiredGroup = requiredGroup.replace(/[,\s]/g, '');
            if (!requiredGroup.startsWith('group.')) {
                requiredGroup = `group.${requiredGroup}`;
            }
        } else {
            logWarning("withEntitlements", "iosAppGroupId must be a string, using default");
            requiredGroup = resolvedBundleId ? `${ENTITLEMENT_GROUP_PREFIX}.${resolvedBundleId}` : ENTITLEMENT_GROUP_DEFAULT;
        }
        const mergedGroups = Array.from(new Set([...currentGroups, requiredGroup]));
        ent[ENTITLEMENT_APP_GROUPS_KEY] = mergedGroups;
        c.modResults = ent as unknown as typeof c.modResults;
        
        logSuccess("withEntitlements", { 
            aps: ent[APS_ENV_ENTITLEMENT_KEY], 
            appGroups: mergedGroups,
            bundleId: resolvedBundleId
        });
        
        return c;
    });
};

export default withMindboxEntitlements;


