import { ConfigPlugin, withEntitlementsPlist } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { APS_ENV_ENTITLEMENT_KEY, ENTITLEMENT_APP_GROUPS_KEY, ENTITLEMENT_GROUP_PREFIX } from "../helpers/iosConstants";
import { logSuccess, logWarning } from "../utils/errorUtils";

const withMindboxEntitlements: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    return withEntitlementsPlist(config, (c) => {
        const ent = c.modResults as unknown as Record<string, unknown>;
        (ent as Record<string, unknown>)[APS_ENV_ENTITLEMENT_KEY] = props.iosMode === "production" ? "production" : "development";
        const bundleId = c.ios?.bundleIdentifier;
        if (!bundleId) {
            logWarning("withEntitlements", "iOS bundleIdentifier is not defined; application group cannot be generated");
        } else {
            const currentGroups = Array.isArray((ent as Record<string, unknown>)[ENTITLEMENT_APP_GROUPS_KEY]) ? ((ent as Record<string, unknown>)[ENTITLEMENT_APP_GROUPS_KEY] as string[]) : [];
            const requiredGroup = `${ENTITLEMENT_GROUP_PREFIX}${bundleId}`;
            const mergedGroups = Array.from(new Set([...currentGroups, requiredGroup]));
            (ent as Record<string, unknown>)[ENTITLEMENT_APP_GROUPS_KEY] = mergedGroups;
        }
        c.modResults = ent as unknown as typeof c.modResults;
        logSuccess("withEntitlements", { aps: (ent as Record<string, unknown>)[APS_ENV_ENTITLEMENT_KEY], hasBundleId: Boolean(bundleId) });
        return c;
    });
};

export default withMindboxEntitlements;


