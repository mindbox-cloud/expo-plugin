import { AndroidConfig, ConfigPlugin, withAndroidManifest, withAppBuildGradle, withDangerousMod, withProjectBuildGradle } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { ANDROID_CONSTANTS } from "../helpers/androidConstants";
import { copyServiceJsonFile, addMavenRepository, addClasspathDependency, addPluginToGradle, addManifestMetaData, extractPackageName, extractAppIdFromAgc, withErrorHandling, logSuccess } from "./utils";
import * as path from "path";

export const withHuawei: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    config = withDangerousMod(config, ["android", async (modConfig) => {
        const projectRoot = modConfig.modRequest.projectRoot;
        const androidProjectRoot = modConfig.modRequest.platformProjectRoot;
        const targetFilePath = path.join(androidProjectRoot, "app", "agconnect-services.json");
        if (!props.huaweiServicesFilePath) {
            console.warn('[Mindbox Plugin] huaweiServicesFilePath is not set. agconnect-services.json will not be copied.');
            return modConfig;
        }
        const absoluteSource = path.resolve(projectRoot, props.huaweiServicesFilePath);
        await withErrorHandling(
            "copy agconnect-services.json",
            () => copyServiceJsonFile(absoluteSource, targetFilePath, "agconnect-services.json"),
            { sourcePath: props.huaweiServicesFilePath }
        );
        return modConfig;
    }]);

    config = withAndroidManifest(config, (manifestConfig) => {
        const androidProjectRoot = manifestConfig.modRequest.platformProjectRoot;
        const appBuildGradlePath = path.join(androidProjectRoot, "app", "build.gradle");
        const packageName = extractPackageName(appBuildGradlePath);
        if (!packageName) {
            console.warn('[Mindbox Plugin] Could not extract package name from build.gradle');
            return manifestConfig;
        }
        const agcPath = path.join(androidProjectRoot, "app", "agconnect-services.json");
        const appId = extractAppIdFromAgc(agcPath, packageName);
        if (!appId) {
            console.warn('[Mindbox Plugin] Could not extract app ID from agconnect-services.json');
            return manifestConfig;
        }
        const value = `appid=${appId}`;
        addManifestMetaData(
            manifestConfig,
            ANDROID_CONSTANTS.HUAWEI_APP_ID_META_DATA_NAME,
            value,
            "value"
        );
        logSuccess("ensure Huawei appid meta-data in AndroidManifest.xml");
        return manifestConfig;
    });
    config = withProjectBuildGradle(config, (buildGradle) => {
        addMavenRepository(
            buildGradle,
            ANDROID_CONSTANTS.HUAWEI_MAVEN_URL,
            ANDROID_CONSTANTS.HUAWEI_MAVEN_REPO
        );

        addClasspathDependency(
            buildGradle,
            ANDROID_CONSTANTS.HUAWEI_AGCP_CLASSPATH,
            ANDROID_CONSTANTS.HUAWEI_AGCP_CLASSPATH_STRING
        );

        return buildGradle;
    });

    config = withAppBuildGradle(config, (buildGradle) => {
        addPluginToGradle(
            buildGradle,
            ANDROID_CONSTANTS.HUAWEI_PLUGIN,
            ANDROID_CONSTANTS.HUAWEI_PLUGIN_STRING
        );
        return buildGradle;
    });

    return config;
};
