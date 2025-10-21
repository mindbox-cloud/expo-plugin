import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import * as fs from "fs";
import * as path from "path";
import {
    ENTITLEMENT_APP_GROUPS_KEY,
    ENTITLEMENT_GROUP_DEFAULT,
    IOS_NSE_ENTITLEMENTS_FILENAME,
    IOS_NSE_FILENAME_DEFAULT,
    IOS_NSE_INFO_PLIST_FILENAME,
    IOS_NSE_INFO_PLIST_SOURCE,
    IOS_NSE_SWIFT_SOURCE,
    IOS_NSE_ENTITLEMENTS_PLIST_TEMPLATE,
    IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX,
    IOS_NSE_PRODUCT_NAME,
    IOS_NCE_FILENAME_DEFAULT,
    IOS_NCE_INFO_PLIST_FILENAME,
    IOS_NCE_SWIFT_SOURCE,
    IOS_NCE_INFO_PLIST_SOURCE,
    IOS_NCE_ENTITLEMENTS_PLIST_TEMPLATE,
    IOS_NCE_ENTITLEMENTS_FILENAME,
    IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX,
    IOS_NCE_PRODUCT_NAME,
    IOS_SWIFT_VERSION_DEFAULT,
    IOS_TARGET_NSE_NAME,
    IOS_TARGET_NCE_NAME,
    IOS_MIN_DEPLOYMENT_TARGET_DEFAULT,
    ENTITLEMENT_GROUP_PREFIX,
} from "../helpers/iosConstants";
import { logSuccess, logWarning } from "../utils/errorUtils";

const withMindboxExtensions: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    return withXcodeProject(config, (c) => {
        try {
            const iosRoot = c.modRequest.platformProjectRoot;
            const projectName = resolveProjectName(iosRoot);
            if (!projectName) {
                logWarning("withExtensions", "Cannot resolve iOS project name; skip NSE generation");
                return c;
            }

            const appBundleId = c.ios?.bundleIdentifier;
            if (!appBundleId) {
                logWarning("withExtensions", "iOS bundleIdentifier is not defined; skip NSE target configuration");
                return c;
            }

            const nseDir = path.join(iosRoot, IOS_TARGET_NSE_NAME);
            ensureDir(nseDir);
            const supportDir = path.join(c.modRequest.projectRoot, "src", "ios", "support", IOS_TARGET_NSE_NAME);
            const sourceSwift = path.join(supportDir, IOS_NSE_FILENAME_DEFAULT);
            const sourcePlist = path.join(supportDir, IOS_NSE_INFO_PLIST_FILENAME);
            const sourceEntitlements = path.join(supportDir, IOS_NSE_ENTITLEMENTS_FILENAME);
            const customSwiftPath = props.iosNseFilePath
                ? (path.isAbsolute(props.iosNseFilePath)
                    ? props.iosNseFilePath
                    : path.join(c.modRequest.projectRoot, props.iosNseFilePath))
                : null;
            const swiftContents = customSwiftPath && fs.existsSync(customSwiftPath)
                ? fs.readFileSync(customSwiftPath, "utf8")
                : (fs.existsSync(sourceSwift)
                    ? fs.readFileSync(sourceSwift, "utf8")
                    : IOS_NSE_SWIFT_SOURCE);
            fs.writeFileSync(path.join(nseDir, IOS_NSE_FILENAME_DEFAULT), swiftContents, "utf8");
            writeIfChanged(
                path.join(nseDir, IOS_NSE_INFO_PLIST_FILENAME),
                fs.existsSync(sourcePlist) ? fs.readFileSync(sourcePlist, "utf8") : IOS_NSE_INFO_PLIST_SOURCE
            );
            const entRaw = fs.existsSync(sourceEntitlements)
                ? fs.readFileSync(sourceEntitlements, "utf8")
                : IOS_NSE_ENTITLEMENTS_PLIST_TEMPLATE;
            const appGroupId = props.iosAppGroupId || (c.ios?.bundleIdentifier ? `${ENTITLEMENT_GROUP_PREFIX}.${c.ios.bundleIdentifier}` : ENTITLEMENT_GROUP_DEFAULT);

            const entFinal = entRaw.replace(/__APP_GROUP_ID__/g, appGroupId);
            writeIfChanged(
                path.join(nseDir, IOS_NSE_ENTITLEMENTS_FILENAME),
                entFinal
            );

            // NCE files
            const nceDir = path.join(iosRoot, IOS_TARGET_NCE_NAME);
            ensureDir(nceDir);
            const supportDirNce = path.join(c.modRequest.projectRoot, "src", "ios", "support", IOS_TARGET_NCE_NAME);
            const sourceNceSwift = path.join(supportDirNce, IOS_NCE_FILENAME_DEFAULT);
            const sourceNcePlist = path.join(supportDirNce, IOS_NCE_INFO_PLIST_FILENAME);
            const sourceNceEntitlements = path.join(supportDirNce, IOS_NCE_ENTITLEMENTS_FILENAME);
            const customNceSwiftPath = (props as any).iosNceFilePath
                ? (path.isAbsolute((props as any).iosNceFilePath)
                    ? (props as any).iosNceFilePath
                    : path.join(c.modRequest.projectRoot, (props as any).iosNceFilePath))
                : null;
            const nceSwiftContents = customNceSwiftPath && fs.existsSync(customNceSwiftPath)
                ? fs.readFileSync(customNceSwiftPath, "utf8")
                : (fs.existsSync(sourceNceSwift)
                    ? fs.readFileSync(sourceNceSwift, "utf8")
                    : IOS_NCE_SWIFT_SOURCE);
            fs.writeFileSync(path.join(nceDir, IOS_NCE_FILENAME_DEFAULT), nceSwiftContents, "utf8");
            writeIfChanged(
                path.join(nceDir, IOS_NCE_INFO_PLIST_FILENAME),
                fs.existsSync(sourceNcePlist) ? fs.readFileSync(sourceNcePlist, "utf8") : IOS_NCE_INFO_PLIST_SOURCE
            );
            const entNceRaw = fs.existsSync(sourceNceEntitlements)
                ? fs.readFileSync(sourceNceEntitlements, "utf8")
                : IOS_NCE_ENTITLEMENTS_PLIST_TEMPLATE;
            const entNceFinal = entNceRaw.replace(/__APP_GROUP_ID__/g, appGroupId);
            writeIfChanged(
                path.join(nceDir, IOS_NCE_ENTITLEMENTS_FILENAME),
                entNceFinal
            );

            const project: any = c.modResults as any;
            const bundleId = `${appBundleId}${IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX}`;
            const bundleIdNce = `${appBundleId}${IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX}`;

            let deploymentTarget = props.iosDeploymentTarget || (c.ios as any)?.deploymentTarget;
            if (!deploymentTarget) {
                const appTarget = project.getFirstTarget();
                const configurations = project.pbxXCBuildConfigurationSection();
                for (const key in configurations) {
                    const config = configurations[key];
                    if (config && config.buildSettings && config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET) {
                        deploymentTarget = config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET.replace(/"/g, '');
                        break;
                    }
                }
            }
            deploymentTarget = deploymentTarget || IOS_MIN_DEPLOYMENT_TARGET_DEFAULT;
            
            configureNseTarget(project, {
                targetName: IOS_TARGET_NSE_NAME,
                productName: IOS_NSE_PRODUCT_NAME,
                bundleIdentifier: bundleId,
                developmentTeam: (c as any).ios?.appleTeamId || props.iosDevTeam || "",
                deploymentTarget,
                swiftVersion: IOS_SWIFT_VERSION_DEFAULT,
                sourcesRelativePath: IOS_NSE_FILENAME_DEFAULT,
                infoPlistRelativePath: IOS_NSE_INFO_PLIST_FILENAME,
                entitlementsRelativePath: IOS_NSE_ENTITLEMENTS_FILENAME,
                groupPath: IOS_TARGET_NSE_NAME,
            });

            configureNceTarget(project, {
                targetName: IOS_TARGET_NCE_NAME,
                productName: IOS_NCE_PRODUCT_NAME,
                bundleIdentifier: bundleIdNce,
                developmentTeam: (c as any).ios?.appleTeamId || props.iosDevTeam || "",
                deploymentTarget,
                swiftVersion: IOS_SWIFT_VERSION_DEFAULT,
                sourcesRelativePath: IOS_NCE_FILENAME_DEFAULT,
                infoPlistRelativePath: IOS_NCE_INFO_PLIST_FILENAME,
                entitlementsRelativePath: IOS_NCE_ENTITLEMENTS_FILENAME,
                groupPath: IOS_TARGET_NCE_NAME,
            });

            logSuccess("withExtensions (NSE files prepared)", { nseDir });
            return c;
        } catch (e) {
            logWarning("withExtensions", "Unable to configure Notification Service Extension fully", { error: String(e) });
            return c;
        }
    });
};

export default withMindboxExtensions;


function resolveProjectName(iosRoot: string): string | null {
    const items = fs.readdirSync(iosRoot);
    const xcodeproj = items.find((i) => i.endsWith(".xcodeproj"));
    if (!xcodeproj) return null;
    return path.basename(xcodeproj, ".xcodeproj");
}

function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function writeIfChanged(filePath: string, contents: string): void {
    if (fs.existsSync(filePath)) {
        const current = fs.readFileSync(filePath, "utf8");
        if (current === contents) return;
    }
    fs.writeFileSync(filePath, contents, "utf8");
}

type ConfigureNseTargetArgs = {
    targetName: string;
    productName: string;
    bundleIdentifier: string;
    developmentTeam: string;
    deploymentTarget: string;
    swiftVersion: string;
    sourcesRelativePath: string;
    infoPlistRelativePath: string;
    entitlementsRelativePath: string;
    groupPath: string;
};

function configureNseTarget(project: any, args: ConfigureNseTargetArgs): void {
    try {
        const existing = findTargetByName(project, args.targetName);
        if (existing) {
            logSuccess("configureNseTarget: target already exists", { targetName: args.targetName });
            return;
        }
        logSuccess("configureNseTarget: start", { targetName: args.targetName, productType: "app_extension" });

        const group = project.addPbxGroup([], args.targetName, args.groupPath);
        logSuccess("configureNseTarget: addPbxGroup", { name: args.targetName, path: args.groupPath });
        const mainGroupId = project.getFirstProject().firstProject.mainGroup;
        project.addToPbxGroup(group.uuid, mainGroupId);
        logSuccess("configureNseTarget: addToPbxGroup", { mainGroupId });

        const projObjects = project.hash.project.objects;
        projObjects['PBXTargetDependency'] = projObjects['PBXTargetDependency'] || {};
        projObjects['PBXContainerItemProxy'] = projObjects['PBXContainerItemProxy'] || {};
        logSuccess("configureNseTarget: ensured PBXTargetDependency and PBXContainerItemProxy sections");

        logSuccess("configureNseTarget: before addTarget", { name: args.targetName, type: "app_extension", productName: args.productName });
        const target = project.addTarget(args.targetName, "app_extension", args.productName);
        const targetUuid = typeof target === 'string' ? target : target?.uuid;
        logSuccess("configureNseTarget: addTarget ok", { targetUuid });

        project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", targetUuid);
        logSuccess("configureNseTarget: addBuildPhase Sources");
        project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", targetUuid);
        logSuccess("configureNseTarget: addBuildPhase Resources");
        project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", targetUuid);
        logSuccess("configureNseTarget: addBuildPhase Frameworks");


        project.addFramework("UserNotifications.framework", { target: targetUuid, link: true });
        logSuccess("configureNseTarget: added UserNotifications.framework");

        project.addSourceFile(args.sourcesRelativePath, { target: targetUuid }, group.uuid);
        logSuccess("configureNseTarget: addSourceFile", { file: args.sourcesRelativePath });
        
        const infoPlistFileRef = addFileToGroup(project, args.infoPlistRelativePath, group.uuid);
        logSuccess("configureNseTarget: addFile Info.plist", { file: args.infoPlistRelativePath, fileRef: infoPlistFileRef });
        
        project.addFile(args.entitlementsRelativePath, group.uuid);
        logSuccess("configureNseTarget: addFile Entitlements", { file: args.entitlementsRelativePath });

        setTargetBuildSetting(project, targetUuid, "PRODUCT_NAME", args.productName);
        logSuccess("configureNseTarget: set PRODUCT_NAME", { value: args.productName });
        setTargetBuildSetting(project, targetUuid, "PRODUCT_BUNDLE_IDENTIFIER", args.bundleIdentifier);
        logSuccess("configureNseTarget: set PRODUCT_BUNDLE_IDENTIFIER", { value: args.bundleIdentifier });
        if (args.developmentTeam) setTargetBuildSetting(project, targetUuid, "DEVELOPMENT_TEAM", args.developmentTeam);
        if (args.developmentTeam) logSuccess("configureNseTarget: set DEVELOPMENT_TEAM", { value: args.developmentTeam });
        setTargetBuildSetting(project, targetUuid, "SWIFT_VERSION", args.swiftVersion);
        logSuccess("configureNseTarget: set SWIFT_VERSION", { value: args.swiftVersion });
        const entitlementsFullPath = `${args.groupPath}/${args.entitlementsRelativePath}`;
        setTargetBuildSetting(project, targetUuid, "CODE_SIGN_ENTITLEMENTS", entitlementsFullPath);
        logSuccess("configureNseTarget: set CODE_SIGN_ENTITLEMENTS", { value: entitlementsFullPath });
        const infoPlistFullPath = `${args.groupPath}/${args.infoPlistRelativePath}`;
        setTargetBuildSetting(project, targetUuid, "INFOPLIST_FILE", infoPlistFullPath);
        logSuccess("configureNseTarget: set INFOPLIST_FILE", { value: infoPlistFullPath });
        setTargetBuildSetting(project, targetUuid, "IPHONEOS_DEPLOYMENT_TARGET", args.deploymentTarget);
        logSuccess("configureNseTarget: set IPHONEOS_DEPLOYMENT_TARGET", { value: args.deploymentTarget });
        setTargetBuildSetting(project, targetUuid, "APPLICATION_EXTENSION_API_ONLY", "YES");
        logSuccess("configureNseTarget: set APPLICATION_EXTENSION_API_ONLY", { value: "YES" });
        setTargetBuildSetting(project, targetUuid, "SKIP_INSTALL", "NO");
        logSuccess("configureNseTarget: set SKIP_INSTALL", { value: "NO" });
        setTargetBuildSetting(project, targetUuid, "TARGETED_DEVICE_FAMILY", "1,2");
        logSuccess("configureNseTarget: set TARGETED_DEVICE_FAMILY", { value: "1,2" });

        const appTargetUuid = findApplicationTargetUuid(project);
        if (!appTargetUuid) {
            logWarning("configureNseTarget", "could not find application target UUID");
            return;
        }
        logSuccess("configureNseTarget: got app target", { appTarget: appTargetUuid });

        const copyPhase = project.addBuildPhase(
            [],
            "PBXCopyFilesBuildPhase",
            "Embed Foundation Extensions",
            appTargetUuid,
            "app_extension"
        );
        
        if (copyPhase) {
            logSuccess("configureNseTarget: addBuildPhase CopyFiles", { copyPhase: copyPhase?.uuid });

            const copyPhaseSection = project.hash.project.objects.PBXCopyFilesBuildPhase;
            if (copyPhaseSection && copyPhaseSection[copyPhase.uuid]) {
                copyPhaseSection[copyPhase.uuid].dstSubfolderSpec = 13;
                copyPhaseSection[copyPhase.uuid].dstPath = '""';
                logSuccess("configureNseTarget: set dstSubfolderSpec to 13 (PlugIns)");
            }
            
            const appexFilePath = `${args.productName}.appex`;
            const file = project.addFile(appexFilePath, copyPhase.uuid, { sourceTree: 'BUILT_PRODUCTS_DIR' });
            if (file) {
                if (!file.settings) file.settings = {};
                file.settings.ATTRIBUTES = ['RemoveHeadersOnCopy'];
                logSuccess("configureNseTarget: add appex to CopyFiles", { appexFilePath });
            }
        }
    } catch (e) {
        logWarning("configureNseTarget", "failed to create NSE target in Xcode project", { error: String(e) });
    }
}

type ConfigureNceTargetArgs = {
    targetName: string;
    productName: string;
    bundleIdentifier: string;
    developmentTeam: string;
    deploymentTarget: string;
    swiftVersion: string;
    sourcesRelativePath: string;
    infoPlistRelativePath: string;
    entitlementsRelativePath: string;
    groupPath: string;
};

function configureNceTarget(project: any, args: ConfigureNceTargetArgs): void {
    try {
        const existing = findTargetByName(project, args.targetName);
        if (existing) {
            logSuccess("configureNceTarget: target already exists", { targetName: args.targetName });
            return;
        }
        logSuccess("configureNceTarget: start", { targetName: args.targetName, productType: "app_extension" });

        const group = project.addPbxGroup([], args.targetName, args.groupPath);
        logSuccess("configureNceTarget: addPbxGroup", { name: args.targetName, path: args.groupPath });
        const mainGroupId = project.getFirstProject().firstProject.mainGroup;
        project.addToPbxGroup(group.uuid, mainGroupId);
        logSuccess("configureNceTarget: addToPbxGroup", { mainGroupId });

        logSuccess("configureNceTarget: before addTarget", { name: args.targetName, type: "app_extension", productName: args.productName });
        const target = project.addTarget(args.targetName, "app_extension", args.productName);
        const targetUuid = typeof target === 'string' ? target : target?.uuid;
        logSuccess("configureNceTarget: addTarget ok", { targetUuid });

        project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", targetUuid);
        logSuccess("configureNceTarget: addBuildPhase Sources");
        project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", targetUuid);
        logSuccess("configureNceTarget: addBuildPhase Resources");
        project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", targetUuid);
        logSuccess("configureNceTarget: addBuildPhase Frameworks");


        project.addFramework("UserNotifications.framework", { target: targetUuid, link: true });
        logSuccess("configureNceTarget: added UserNotifications.framework");
        project.addFramework("UserNotificationsUI.framework", { target: targetUuid, link: true });
        logSuccess("configureNceTarget: added UserNotificationsUI.framework");

        project.addSourceFile(args.sourcesRelativePath, { target: targetUuid }, group.uuid);
        logSuccess("configureNceTarget: addSourceFile", { file: args.sourcesRelativePath });
        
        const infoPlistFileRef = addFileToGroup(project, args.infoPlistRelativePath, group.uuid);
        logSuccess("configureNceTarget: addFile Info.plist", { file: args.infoPlistRelativePath, fileRef: infoPlistFileRef });
        
        project.addFile(args.entitlementsRelativePath, group.uuid);
        logSuccess("configureNceTarget: addFile Entitlements", { file: args.entitlementsRelativePath });

        setTargetBuildSetting(project, targetUuid, "PRODUCT_NAME", args.productName);
        logSuccess("configureNceTarget: set PRODUCT_NAME", { value: args.productName });
        setTargetBuildSetting(project, targetUuid, "PRODUCT_BUNDLE_IDENTIFIER", args.bundleIdentifier);
        logSuccess("configureNceTarget: set PRODUCT_BUNDLE_IDENTIFIER", { value: args.bundleIdentifier });
        if (args.developmentTeam) setTargetBuildSetting(project, targetUuid, "DEVELOPMENT_TEAM", args.developmentTeam);
        if (args.developmentTeam) logSuccess("configureNceTarget: set DEVELOPMENT_TEAM", { value: args.developmentTeam });
        setTargetBuildSetting(project, targetUuid, "SWIFT_VERSION", args.swiftVersion);
        logSuccess("configureNceTarget: set SWIFT_VERSION", { value: args.swiftVersion });
        const infoPlistFullPath = `${args.groupPath}/${args.infoPlistRelativePath}`;
        setTargetBuildSetting(project, targetUuid, "INFOPLIST_FILE", infoPlistFullPath);
        logSuccess("configureNceTarget: set INFOPLIST_FILE", { value: infoPlistFullPath });
        const entitlementsFullPath = `${args.groupPath}/${args.entitlementsRelativePath}`;
        setTargetBuildSetting(project, targetUuid, "CODE_SIGN_ENTITLEMENTS", entitlementsFullPath);
        logSuccess("configureNceTarget: set CODE_SIGN_ENTITLEMENTS", { value: entitlementsFullPath });
        setTargetBuildSetting(project, targetUuid, "IPHONEOS_DEPLOYMENT_TARGET", args.deploymentTarget);
        logSuccess("configureNceTarget: set IPHONEOS_DEPLOYMENT_TARGET", { value: args.deploymentTarget });
        setTargetBuildSetting(project, targetUuid, "APPLICATION_EXTENSION_API_ONLY", "YES");
        logSuccess("configureNceTarget: set APPLICATION_EXTENSION_API_ONLY", { value: "YES" });
        setTargetBuildSetting(project, targetUuid, "SKIP_INSTALL", "NO");
        logSuccess("configureNceTarget: set SKIP_INSTALL", { value: "NO" });
        setTargetBuildSetting(project, targetUuid, "TARGETED_DEVICE_FAMILY", "1,2");
        logSuccess("configureNceTarget: set TARGETED_DEVICE_FAMILY", { value: "1,2" });

        const appTargetUuid = findApplicationTargetUuid(project);
        if (!appTargetUuid) {
            logWarning("configureNceTarget", "could not find application target UUID");
            return;
        }
        logSuccess("configureNceTarget: got app target", { appTarget: appTargetUuid });

        const copyPhase = project.addBuildPhase(
            [],
            "PBXCopyFilesBuildPhase",
            "Embed Foundation Extensions",
            appTargetUuid,
            "app_extension"
        );
        
        if (copyPhase) {
            logSuccess("configureNceTarget: addBuildPhase CopyFiles", { copyPhase: copyPhase?.uuid });

            const copyPhaseSection = project.hash.project.objects.PBXCopyFilesBuildPhase;
            if (copyPhaseSection && copyPhaseSection[copyPhase.uuid]) {
                copyPhaseSection[copyPhase.uuid].dstSubfolderSpec = 13;
                copyPhaseSection[copyPhase.uuid].dstPath = '""';
                logSuccess("configureNceTarget: set dstSubfolderSpec to 13 (PlugIns)");
            }
            
            const appexFilePath = `${args.productName}.appex`;
            const file = project.addFile(appexFilePath, copyPhase.uuid, { sourceTree: 'BUILT_PRODUCTS_DIR' });
            if (file) {
                if (!file.settings) file.settings = {};
                file.settings.ATTRIBUTES = ['RemoveHeadersOnCopy'];
                logSuccess("configureNceTarget: add appex to CopyFiles", { appexFilePath });
            }
        }
    } catch (e) {
        logWarning("configureNceTarget", "failed to create NCE target in Xcode project", { error: String(e) });
    }
}
function setTargetBuildSetting(project: any, targetUuid: string, key: string, value: string): void {
    const configurations = project.pbxXCBuildConfigurationSection();
    const nativeTargets = project.pbxNativeTargetSection();

    const needsQuotes = /[,\s]/.test(value) || !value.match(/^[A-Za-z0-9._\-\/]+$/);
    const formattedValue = (needsQuotes && !value.startsWith('"')) ? `"${value}"` : value;

    let buildConfigListId: string | null = null;
    for (const nativeKey in nativeTargets) {
        const target = nativeTargets[nativeKey];
        if (typeof target !== "object") continue;
        if (target.uuid === targetUuid || nativeKey === targetUuid) {
            buildConfigListId = target.buildConfigurationList;
            break;
        }
    }
    
    if (!buildConfigListId) {
        for (const configKey in configurations) {
            const config = configurations[configKey];
            if (typeof config !== "object") continue;
            if (config.buildSettings && config.buildSettings.PRODUCT_NAME === `"${IOS_NSE_PRODUCT_NAME}"`) {
                config.buildSettings[key] = formattedValue;
            }
        }
        return;
    }

    const configListSection = project.pbxXCConfigurationList();
    const configList = configListSection[buildConfigListId];
    if (!configList || !configList.buildConfigurations) return;
    
    for (const configRef of configList.buildConfigurations) {
        const configId = configRef.value;
        const config = configurations[configId];
        if (config && config.buildSettings) {
            config.buildSettings[key] = formattedValue;
        }
    }
}

function findTargetByName(project: any, name: string): any | null {
    const targets = project.pbxNativeTargetSection();
    for (const key in targets) {
        const t = targets[key];
        if (typeof t !== "object") continue;
        if (t.name === name || t.productName === name) return t;
    }
    return null;
}

function findApplicationTargetUuid(project: any): string | null {
    const nativeTargets = project.pbxNativeTargetSection();
    for (const key in nativeTargets) {
        const t = nativeTargets[key];
        if (typeof t !== "object") continue;
        const productType = t?.productType;
        if (productType === '"com.apple.product-type.application"' || productType === 'com.apple.product-type.application') {
            return t.uuid || key;
        }
    }
    const first = project.getFirstTarget?.();
    if (!first) return null;
    return typeof first === 'string' ? first : first.uuid;
}

function addFileToGroup(project: any, fileName: string, groupUuid: string): string | null {
    const fileReferenceSection = project.hash.project.objects.PBXFileReference || {};
    const groupSection = project.hash.project.objects.PBXGroup || {};
    
    const fileUuid = project.generateUuid();
    fileReferenceSection[fileUuid] = {
        isa: 'PBXFileReference',
        explicitFileType: undefined,
        fileEncoding: 4,
        includeInIndex: 0,
        lastKnownFileType: 'text.plist.xml',
        name: fileName,
        path: fileName,
        sourceTree: '"<group>"'
    };
    fileReferenceSection[`${fileUuid}_comment`] = fileName;
    logSuccess("addFileToGroup: created PBXFileReference", { fileName, fileUuid });
    
    const group = groupSection[groupUuid];
    if (group && group.children) {
        const alreadyInGroup = group.children.find((c: any) => c.value === fileUuid);
        if (!alreadyInGroup) {
            group.children.push({ value: fileUuid, comment: fileName });
            logSuccess("addFileToGroup: added to group.children", { groupUuid, fileName, fileRef: fileUuid });
        } else {
            logSuccess("addFileToGroup: already in group.children", { groupUuid, fileName });
        }
    } else {
        logWarning("addFileToGroup", "Group not found or has no children", { groupUuid });
    }
    
    return fileUuid;
}


