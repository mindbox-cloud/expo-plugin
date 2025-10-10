import { ConfigPlugin, withAppBuildGradle, withDangerousMod, withProjectBuildGradle } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { ANDROID_CONSTANTS } from "../helpers/androidConstants";
import { copyServiceJsonFile, addClasspathDependency, addPluginToGradle, withErrorHandling, logWarning } from "./utils";
import * as path from "path";

export const withFirebase: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    config = withDangerousMod(config, ["android", async (modConfig) => {
        const projectRoot = modConfig.modRequest.projectRoot;
        const androidProjectRoot = modConfig.modRequest.platformProjectRoot;
        const targetFilePath = path.join(androidProjectRoot, "app", "google-services.json");
        if (!props.googleServicesFilePath) {
            logWarning("copy google-services.json", "googleServicesFilePath is not set. google-services.json will not be copied.");
            return modConfig;
        }
        const absoluteSource = path.resolve(projectRoot, props.googleServicesFilePath);

        await withErrorHandling(
            "copy google-services.json",
            () => copyServiceJsonFile(absoluteSource, targetFilePath, "google-services.json"),
            { sourcePath: props.googleServicesFilePath }
        );
        return modConfig;
    }]);

    config = withProjectBuildGradle(config, (buildGradle) => {
        addClasspathDependency(
            buildGradle,
            ANDROID_CONSTANTS.GOOGLE_SERVICES_CLASSPATH,
            ANDROID_CONSTANTS.GOOGLE_SERVICES_CLASSPATH_STRING
        );
        return buildGradle;
    });

    config = withAppBuildGradle(config, (buildGradle) => {
        addPluginToGradle(
            buildGradle,
            ANDROID_CONSTANTS.GOOGLE_SERVICES_PLUGIN,
            ANDROID_CONSTANTS.GOOGLE_SERVICES_PLUGIN_STRING
        );
        return buildGradle;
    });

    return config;
};
