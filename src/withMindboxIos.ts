import { ConfigPlugin } from "@expo/config-plugins";
import type { MindboxPluginProps } from "./mindboxTypes";
import withMindboxInfoPlist from "./ios/withInfoPlist";
import withMindboxEntitlements from "./ios/withEntitlements";
import withMindboxAppDelegate from "./ios/withAppDelegate";
import withMindboxPodfile from "./ios/withPodfile";
import withMindboxExtensions from "./ios/withExtensions";

export const withMindboxIos: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    config = withMindboxInfoPlist(config, props);
    config = withMindboxEntitlements(config, props);
    config = withMindboxAppDelegate(config, props);
    config = withMindboxPodfile(config, props);
    config = withMindboxExtensions(config, props);
    return config;
}