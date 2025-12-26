import { ConfigPlugin } from "@expo/config-plugins";
import type { MindboxPluginProps } from "./mindboxTypes";
import withMindboxInfoPlist from "./ios/withInfoPlist";
import withMindboxEntitlements from "./ios/withEntitlements";
import withMindboxAppDelegate from "./ios/withAppDelegate";
import withMindboxPodfile from "./ios/withPodfile";
import withMindboxExtensions from "./ios/withExtensions";
import {
    ENTITLEMENT_APP_GROUPS_KEY,
    ENTITLEMENT_GROUP_PREFIX,
    IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX,
    IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX,
    IOS_TARGET_NCE_NAME,
    IOS_TARGET_NSE_NAME,
} from "./helpers/iosConstants";

export const withMindboxIos: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    config = withMindboxInfoPlist(config, props);
    config = withMindboxEntitlements(config, props);
    config = withMindboxAppDelegate(config, props);
    config = withMindboxExtensions(config, props);
    config = withMindboxPodfile(config, props);

    const mainBundleId = config.ios?.bundleIdentifier;
    if (!mainBundleId) {
        return config;
    }

    config.extra = config.extra ?? {};
    config.extra.eas = config.extra.eas ?? {};
    config.extra.eas.ios = config.extra.eas.ios ?? {};
    config.extra.eas.ios.targets = {
        ...(config.extra.eas.ios.targets ?? {}),
        [IOS_TARGET_NSE_NAME]: {
            bundleIdentifier: `${mainBundleId}${IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX}`,
        },
        [IOS_TARGET_NCE_NAME]: {
            bundleIdentifier: `${mainBundleId}${IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX}`,
        },
    };

    // EAS (managed projects, experimental): declare app extensions up-front so EAS can
    // validate/generate credentials before the Xcode project exists.
    const appGroupId = validateAndCleanAppGroupId(
        props.iosAppGroupId ?? `${ENTITLEMENT_GROUP_PREFIX}.${mainBundleId}`
    );
    config.extra.eas.build = (config.extra.eas as any).build ?? {};
    (config.extra.eas.build as any).experimental = (config.extra.eas.build as any).experimental ?? {};
    (config.extra.eas.build as any).experimental.ios = (config.extra.eas.build as any).experimental.ios ?? {};

    const existingAppExtensions = (config.extra.eas.build as any).experimental.ios.appExtensions;
    const baseList = Array.isArray(existingAppExtensions) ? existingAppExtensions : [];
    const required = [
        {
            targetName: IOS_TARGET_NSE_NAME,
            bundleIdentifier: `${mainBundleId}${IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX}`,
            entitlements: {
                [ENTITLEMENT_APP_GROUPS_KEY]: [appGroupId],
            },
        },
        {
            targetName: IOS_TARGET_NCE_NAME,
            bundleIdentifier: `${mainBundleId}${IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX}`,
            entitlements: {
                [ENTITLEMENT_APP_GROUPS_KEY]: [appGroupId],
            },
        },
    ];

    (config.extra.eas.build as any).experimental.ios.appExtensions = upsertAppExtensions(baseList, required);

    return config;
};

function validateAndCleanAppGroupId(appGroupId: string): string {
    let cleaned = appGroupId.replace(/[,\s]/g, "");
    if (!cleaned.startsWith("group.")) {
        cleaned = `group.${cleaned}`;
    }
    return cleaned;
}

function upsertAppExtensions(existing: any[], required: any[]): any[] {
    const out = [...existing];
    for (const ext of required) {
        if (!ext?.targetName) continue;
        const idx = out.findIndex((e) => e?.targetName === ext.targetName);
        if (idx === -1) {
            out.push(ext);
            continue;
        }
        const current = out[idx] ?? {};
        const merged = { ...ext, ...current };

        // If user provided an entry but omitted critical fields, fill them in.
        if (!merged.bundleIdentifier) merged.bundleIdentifier = ext.bundleIdentifier;
        if (!merged.entitlements) merged.entitlements = ext.entitlements;

        out[idx] = merged;
    }
    return out;
}