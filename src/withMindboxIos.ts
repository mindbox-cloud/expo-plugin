import { ConfigPlugin, withAppBuildGradle } from "@expo/config-plugins";
import type { MindboxPluginProps } from "./mindboxTypes";

export const withMindboxIos: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    return config;
}