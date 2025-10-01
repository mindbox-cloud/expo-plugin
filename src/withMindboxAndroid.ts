import { ConfigPlugin, withAppBuildGradle, withProjectBuildGradle, withDangerousMod } from "@expo/config-plugins";
import { MindboxPushProviders } from "./mindboxTypes";
import type { MindboxPluginProps, MindboxPushProvider } from "./mindboxTypes";
import { ANDROID_CONSTANTS } from "./helpers/androidConstants";
import * as fs from "fs";
import * as path from "path";

const libraryMap: Record<MindboxPushProvider, string> = {
    firebase: "cloud.mindbox:mindbox-firebase-starter",
    huawei: "cloud.mindbox:mindbox-huawei-starter",
    rustore: "cloud.mindbox:mindbox-rustore-starter",
};

const addMindboxDependencies: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    console.log('[Mindbox Plugin] addMindboxDependencies called!')
    if (!props.androidPushProviders || props.androidPushProviders.length === 0) {
        return config;
    }
    return withAppBuildGradle(config, (buildGradle) => {
        console.log('[Mindbox Plugin] withMindboxAndroid called with props:', props)
        const dependencies = props.androidPushProviders!.map(lib => `    ${ANDROID_CONSTANTS.IMPLEMENTATION} '${libraryMap[lib as MindboxPushProvider]}'`).join('\n');
        buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
            /(\s*)dependencies\s*\{/,
            `$1dependencies {\n${dependencies}`
        );
        return buildGradle;
    });
};

export const withMindboxAndroid: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    console.log('[Mindbox Plugin] withMindboxAndroid called with props:', props);
    config = addMindboxDependencies(config, props);
    if (props.androidPushProviders?.includes(MindboxPushProviders.Firebase)) {
        config = withFirebase(config, props);
    }
    return config;
};

const withFirebase: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    console.log('[Mindbox Plugin] withFirebase called with props:', props);
    config = withDangerousMod(config, ["android", async (modConfig) => {
        try {
            const projectRoot = modConfig.modRequest.projectRoot;
            const androidProjectRoot = modConfig.modRequest.platformProjectRoot;
            const targetFilePath = path.join(androidProjectRoot, "app", "google-services.json");

            if (!props.googleServicesFilePath) {
                console.warn('[Mindbox Plugin] googleServicesFilePath is not set. google-services.json will not be copied.');
                return modConfig;
            }

            const absoluteSource = path.resolve(projectRoot, props.googleServicesFilePath);
            if (!fs.existsSync(absoluteSource)) {
                console.warn(`[Mindbox Plugin] googleServicesFilePath not found: ${absoluteSource}`);
                return modConfig;
            }

            const sourceJson = fs.readFileSync(absoluteSource, { encoding: "utf8" });

            const targetDir = path.dirname(targetFilePath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            if (fs.existsSync(targetFilePath)) {
                const existing = fs.readFileSync(targetFilePath, { encoding: "utf8" });
                if (existing.trim() === sourceJson.trim()) {
                    console.log('[Mindbox Plugin] google-services.json already up to date.');
                    return modConfig;
                }
            }

            fs.writeFileSync(targetFilePath, sourceJson, { encoding: "utf8" });
            console.log('[Mindbox Plugin] google-services.json written to android/app.');
        } catch (e) {
            console.warn('[Mindbox Plugin] Failed to place google-services.json:', e);
        }
        return modConfig;
    }]);
    config = withProjectBuildGradle(config, (buildGradle) => {
        const googleServicesClasspath = ANDROID_CONSTANTS.GOOGLE_SERVICES_CLASSPATH;
        if (!buildGradle.modResults.contents.includes(ANDROID_CONSTANTS.GOOGLE_SERVICES_CLASSPATH_STRING)) {
            buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
                /(\s*)dependencies\s*\{/,
                `$1dependencies {\n${googleServicesClasspath}`
            );
        }
        return buildGradle;
    });

    config = withAppBuildGradle(config, (buildGradle) => {
        const applyPlugin = ANDROID_CONSTANTS.GOOGLE_SERVICES_PLUGIN;
        const pluginMarker = ANDROID_CONSTANTS.GOOGLE_SERVICES_PLUGIN_STRING;
        const contents = buildGradle.modResults.contents;
        if (!contents.includes(pluginMarker)) {
            const applyRegex = /^apply plugin:\s*["'][^"']+["'].*$/gm;
            const matches = [...contents.matchAll(applyRegex)];
            if (matches.length > 0) {
                const last = matches[matches.length - 1];
                const insertPos = (last.index ?? 0) + last[0].length;
                buildGradle.modResults.contents = `${contents.slice(0, insertPos)}\n${applyPlugin}\n${contents.slice(insertPos)}`;
            } else {
                buildGradle.modResults.contents = `${applyPlugin}\n${contents}`;
            }
        }
        return buildGradle;
    });

    return config;
};