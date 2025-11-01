import {
    ConfigPlugin,
    withAndroidManifest,
    withAppBuildGradle,
    withDangerousMod,
} from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { ANDROID_CONSTANTS } from "../helpers/androidConstants";
import {
    extractPackageName,
    removeServiceFromManifest,
    addServiceToManifest,
    ensureToolsNamespace,
    withErrorHandling,
    logWarning,
    logSuccess,
} from "./utils";
import * as path from "path";
import * as fs from "fs";

const EXPO_FIREBASE_MESSAGING_SERVICE =
    "expo.modules.notifications.service.ExpoFirebaseMessagingService";

const EXPO_NOTIFICATION_DEPENDENCIES = [
    "cloud.mindbox:mobile-sdk",
    "cloud.mindbox:mindbox-firebase",
    "cloud.mindbox:mindbox-sdk-starter-core",
    "com.google.firebase:firebase-messaging",
];

const resolveServiceSourceContent = (): string | null => {
    const candidates: string[] = [];
    try {
        const pkgJsonPath = require.resolve("mindbox-expo-plugin/package.json");
        const pkgRoot = path.dirname(pkgJsonPath);
        candidates.push(
            path.join(
                pkgRoot,
                "build",
                "android",
                "support",
                "MindboxExpoFirebaseService.kt",
            ),
            path.join(
                pkgRoot,
                "src",
                "android",
                "support",
                "MindboxExpoFirebaseService.kt",
            ),
        );
    } catch {
        // ignore if resolution fails, we will use __dirname-based fallbacks
    }
    candidates.push(
        path.resolve(__dirname, "support", "MindboxExpoFirebaseService.kt"),
        path.resolve(
            __dirname,
            "..",
            "support",
            "MindboxExpoFirebaseService.kt",
        ),
        path.resolve(
            __dirname,
            "..",
            "..",
            "src",
            "android",
            "support",
            "MindboxExpoFirebaseService.kt",
        ),
    );
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return fs.readFileSync(candidate, { encoding: "utf8" });
        }
    }
    return null;
};

const writeIfChanged = (filePath: string, content: string): void => {
    const prev = fs.existsSync(filePath)
        ? fs.readFileSync(filePath, { encoding: "utf8" })
        : null;
    if (prev?.trim() === content.trim()) {
        return;
    }
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, { encoding: "utf8" });
};

const findMainActivityAndExtractPackage = (
    androidProjectRoot: string,
): { directory: string; packageName: string } | null => {
    const javaDir = path.join(androidProjectRoot, "app", "src", "main", "java");
    const kotlinDir = path.join(
        androidProjectRoot,
        "app",
        "src",
        "main",
        "kotlin",
    );

    const searchDirs = [javaDir, kotlinDir].filter((dir) => fs.existsSync(dir));

    for (const baseDir of searchDirs) {
        const findMainActivityInDir = (
            dir: string,
            depth: number = 0,
        ): { filePath: string; dirPath: string } | null => {
            if (depth > 10) return null;

            if (!fs.existsSync(dir)) return null;

            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isFile()) {
                    const fileNameWithoutExt = path.parse(entry.name).name;
                    if (fileNameWithoutExt === "MainActivity") {
                        return { filePath: fullPath, dirPath: dir };
                    }
                }

                if (entry.isDirectory()) {
                    const result = findMainActivityInDir(fullPath, depth + 1);
                    if (result) return result;
                }
            }

            return null;
        };

        const result = findMainActivityInDir(baseDir);
        if (result) {
            const mainActivityContent = fs.readFileSync(result.filePath, {
                encoding: "utf8",
            });
            const packageMatch = mainActivityContent.match(
                /^package\s+([a-zA-Z0-9_.]+)/m,
            );

            if (packageMatch && packageMatch[1]) {
                return {
                    directory: result.dirPath,
                    packageName: packageMatch[1],
                };
            }
        }
    }

    return null;
};

export const withExpoNotification: ConfigPlugin<MindboxPluginProps> = (
    config,
    props = {},
) => {
    if (props.usedExpoNotification !== true) {
        return config;
    }

    config = withDangerousMod(config, [
        "android",
        async (modConfig) => {
            const androidProjectRoot = modConfig.modRequest.platformProjectRoot;

            const mainActivityInfo =
                findMainActivityAndExtractPackage(androidProjectRoot);

            if (!mainActivityInfo) {
                logWarning(
                    "copy MindboxExpoFirebaseService.kt",
                    "Could not find MainActivity file or extract package name",
                );
                return modConfig;
            }

            const { directory: mainActivityDir, packageName } =
                mainActivityInfo;
            const targetFilePath = path.join(
                mainActivityDir,
                "MindboxExpoFirebaseService.kt",
            );

            await withErrorHandling(
                "copy MindboxExpoFirebaseService.kt",
                async () => {
                    const sourceContent = resolveServiceSourceContent();
                    if (!sourceContent) {
                        logWarning(
                            "copy MindboxExpoFirebaseService.kt",
                            "Could not resolve service source content",
                        );
                        return;
                    }
                    const packageStatement = `package ${packageName}\n\n`;
                    const targetContent = packageStatement + sourceContent;
                    writeIfChanged(targetFilePath, targetContent);
                    logSuccess("write MindboxExpoFirebaseService.kt", {
                        targetPath: targetFilePath,
                        packageName,
                    });
                },
            );

            return modConfig;
        },
    ]);

    config = withAndroidManifest(config, (manifestConfig) => {
        ensureToolsNamespace(manifestConfig);

        const androidProjectRoot =
            manifestConfig.modRequest.platformProjectRoot;
        const mainActivityInfo =
            findMainActivityAndExtractPackage(androidProjectRoot);

        if (!mainActivityInfo) {
            logWarning(
                "add services to AndroidManifest.xml",
                "Could not find MainActivity file or extract package name",
            );
            return manifestConfig;
        }

        const { packageName, directory } = mainActivityInfo;
        const serviceName = `${packageName}.MindboxExpoFirebaseService`;

        const serviceFilePath = path.join(
            directory,
            "MindboxExpoFirebaseService.kt",
        );
        if (!fs.existsSync(serviceFilePath)) {
            logWarning(
                "add services to AndroidManifest.xml",
                "Service file not found, skipping manifest update",
            );
            return manifestConfig;
        }

        removeServiceFromManifest(
            manifestConfig,
            EXPO_FIREBASE_MESSAGING_SERVICE,
        );
        addServiceToManifest(manifestConfig, serviceName, false, [
            { action: "com.google.firebase.MESSAGING_EVENT" },
        ]);

        logSuccess("add services to AndroidManifest.xml");
        return manifestConfig;
    });

    config = withAppBuildGradle(config, (buildGradle) => {
        const before = buildGradle.modResults.contents;
        const missing = EXPO_NOTIFICATION_DEPENDENCIES.filter(
            (dep) =>
                !before.includes(`'${dep}'`) && !before.includes(`"${dep}"`),
        );
        if (missing.length === 0) {
            return buildGradle;
        }
        const lines = missing
            .map((d) => `    ${ANDROID_CONSTANTS.IMPLEMENTATION} '${d}'`)
            .join("\n");
        buildGradle.modResults.contents = before.replace(
            /(\s*)dependencies\s*\{/,
            `$1dependencies {\n${lines}`,
        );
        logSuccess("add Expo Notification dependencies to build.gradle", {
            added: missing,
        });
        return buildGradle;
    });

    return config;
};
