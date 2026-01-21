import { ConfigPlugin } from "@expo/config-plugins";
import type { MindboxPluginProps } from "./mindboxTypes";
import withMindboxInfoPlist from "./ios/withInfoPlist";
import withMindboxEntitlements from "./ios/withEntitlements";
import withMindboxAppDelegate from "./ios/withAppDelegate";
import withMindboxPodfile from "./ios/withPodfile";
import withMindboxExtensions from "./ios/withExtensions";
import {
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

    return config;
};