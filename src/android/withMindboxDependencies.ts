import { ConfigPlugin, withAppBuildGradle } from "@expo/config-plugins";
import type { MindboxPluginProps, MindboxPushProvider } from "../mindboxTypes";
import { ANDROID_CONSTANTS } from "../helpers/androidConstants";
import { logSuccess, logWarning } from "../utils/errorUtils";

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
        
        logSuccess("addMindboxDependencies", { 
            providers: providersToAdd,
            contentsLength: contents.length,
            dependenciesToAdd: providersToAdd.map(provider => libraryMap[provider as MindboxPushProvider]),
            shouldRemoveFirebaseStarter
        });
        
        const dependencies = providersToAdd.map(provider => `    ${ANDROID_CONSTANTS.IMPLEMENTATION} '${libraryMap[provider as MindboxPushProvider]}'`).join('\n');
        
        const beforeReplace = buildGradle.modResults.contents;
        buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
            /(\s*)dependencies\s*\{/,
            `$1dependencies {\n${dependencies}`
        );
        
        const afterReplace = buildGradle.modResults.contents;
        if (beforeReplace !== afterReplace) {
            logSuccess("addMindboxDependencies", { 
                added: true,
                addedDependencies: providersToAdd.map(provider => libraryMap[provider as MindboxPushProvider])
            });
        } else {
            logWarning("addMindboxDependencies", "Dependencies block not found or dependencies already exist");
        }
        
        return buildGradle;
    });
};



