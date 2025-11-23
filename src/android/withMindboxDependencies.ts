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
    
    const shouldRemoveFirebaseStarter = props.usedExpoNotification === true && props.androidPushProviders.includes("firebase");
    const providersToAdd = shouldRemoveFirebaseStarter 
        ? props.androidPushProviders.filter(provider => provider !== "firebase")
        : props.androidPushProviders;
    
    if (providersToAdd.length === 0) {
        return config;
    }
    
    return withAppBuildGradle(config, (buildGradle) => {
        const contents = buildGradle.modResults.contents;
        const extraDependencies: string[] = [];
        if (props.workRuntimeWorkaround === true) {
            extraDependencies.push(`    ${ANDROID_CONSTANTS.IMPLEMENTATION} 'androidx.work:work-runtime-ktx:${ANDROID_CONSTANTS.WORK_RUNTIME_KTX_VERSION}'`);
        }
        const mindboxDependencies = providersToAdd.map(provider => `    ${ANDROID_CONSTANTS.IMPLEMENTATION} '${libraryMap[provider as MindboxPushProvider]}'`);
        const dependencies = [...extraDependencies, ...mindboxDependencies].join('\n');
        buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
            /(\s*)dependencies\s*\{/,
            `$1dependencies {\n${dependencies}`
        );

        return buildGradle;
    });
};



