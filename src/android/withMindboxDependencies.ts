import { ConfigPlugin, withAppBuildGradle } from "@expo/config-plugins";
import type { MindboxPluginProps, MindboxPushProvider } from "../mindboxTypes";
import { ANDROID_CONSTANTS } from "../helpers/androidConstants";

const libraryMap: Record<MindboxPushProvider, string> = {
    firebase: "cloud.mindbox:mindbox-firebase-starter",
    huawei: "cloud.mindbox:mindbox-huawei-starter",
    rustore: "cloud.mindbox:mindbox-rustore-starter",
};

export const addMindboxDependencies: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    if (!props.androidPushProviders || props.androidPushProviders.length === 0) {
        return config;
    }
    return withAppBuildGradle(config, (buildGradle) => {
        const dependencies = props.androidPushProviders!.map(provider => `    ${ANDROID_CONSTANTS.IMPLEMENTATION} '${libraryMap[provider as MindboxPushProvider]}'`).join('\n');
        buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
            /(\s*)dependencies\s*\{/,
            `$1dependencies {\n${dependencies}`
        );
        return buildGradle;
    });
};
