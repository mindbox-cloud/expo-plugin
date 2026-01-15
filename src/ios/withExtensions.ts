import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import * as fs from "fs";
import * as path from "path";
import {
    ENTITLEMENT_GROUP_DEFAULT,
    IOS_NSE_ENTITLEMENTS_FILENAME,
    IOS_NSE_FILENAME_DEFAULT,
    IOS_NSE_INFO_PLIST_FILENAME,
    IOS_NSE_ENTITLEMENTS_PLIST_TEMPLATE,
    IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX,
    IOS_NSE_PRODUCT_NAME,
    IOS_NCE_FILENAME_DEFAULT,
    IOS_NCE_INFO_PLIST_FILENAME,
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
import { logWarning } from "../utils/errorUtils";

const XCODE_PLUGINS_FOLDER = 13;

const withMindboxExtensions: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    return withXcodeProject(config, (c) => {
        try {
            const iosRoot = c.modRequest.platformProjectRoot;
            const projectRoot = c.modRequest.projectRoot;
            const appBundleId = c.ios?.bundleIdentifier;
            
            if (!resolveProjectName(iosRoot)) {
                logWarning("withExtensions", "Cannot resolve iOS project name; skip extensions generation");
                return c;
            }

            if (!appBundleId) {
                logWarning("withExtensions", "iOS bundleIdentifier is not defined; skip extensions configuration");
                return c;
            }

            const appGroupId = determineAppGroupId(props.iosAppGroupId, appBundleId);
            const deploymentTarget = determineDeploymentTarget(props, c, c.modResults as any);
            const developmentTeam = (c as any).ios?.appleTeamId || (props as any).iosDevTeam || "";

            prepareNseFiles(iosRoot, projectRoot, props, appGroupId);
            prepareNceFiles(iosRoot, projectRoot, props, appGroupId);

            const project: any = c.modResults as any;
            
            configureExtensionTarget(project, {
                targetName: IOS_TARGET_NSE_NAME,
                productName: IOS_NSE_PRODUCT_NAME,
                bundleIdentifier: `${appBundleId}${IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX}`,
                developmentTeam,
                deploymentTarget,
                swiftVersion: IOS_SWIFT_VERSION_DEFAULT,
                sourcesRelativePath: IOS_NSE_FILENAME_DEFAULT,
                infoPlistRelativePath: IOS_NSE_INFO_PLIST_FILENAME,
                entitlementsRelativePath: IOS_NSE_ENTITLEMENTS_FILENAME,
                groupPath: IOS_TARGET_NSE_NAME,
                frameworks: ["UserNotifications.framework"],
            });

            configureExtensionTarget(project, {
                targetName: IOS_TARGET_NCE_NAME,
                productName: IOS_NCE_PRODUCT_NAME,
                bundleIdentifier: `${appBundleId}${IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX}`,
                developmentTeam,
                deploymentTarget,
                swiftVersion: IOS_SWIFT_VERSION_DEFAULT,
                sourcesRelativePath: IOS_NCE_FILENAME_DEFAULT,
                infoPlistRelativePath: IOS_NCE_INFO_PLIST_FILENAME,
                entitlementsRelativePath: IOS_NCE_ENTITLEMENTS_FILENAME,
                groupPath: IOS_TARGET_NCE_NAME,
                frameworks: ["UserNotifications.framework", "UserNotificationsUI.framework"],
            });

            return c;
        } catch (e) {
            logWarning("withExtensions", "Unable to configure Notification Extensions", { error: String(e) });
            return c;
        }
    });
};

type ExtensionFilesConfig = {
    targetName: string;
    swiftFilename: string;
    plistFilename: string;
    entitlementsFilename: string;
    entitlementsTemplate: string;
};

function prepareExtensionFiles(
    iosRoot: string,
    projectRoot: string,
    customFilePath: string | undefined,
    appGroupId: string,
    config: ExtensionFilesConfig
): void {
    const extensionDir = path.join(iosRoot, config.targetName);
    ensureDir(extensionDir);
    
    const supportDir = path.join(__dirname, "..", "..", "src", "ios", "support", config.targetName);
    
    const swiftContent = readFileFromCustomOrSupport(
        customFilePath,
        projectRoot,
        path.join(supportDir, config.swiftFilename)
    );
    fs.writeFileSync(path.join(extensionDir, config.swiftFilename), swiftContent, "utf8");
    
    const plistContent = readFileFromSupport(path.join(supportDir, config.plistFilename));
    writeIfChanged(path.join(extensionDir, config.plistFilename), plistContent);
    
    const entitlementsTemplate = readFileFromSupportOrTemplate(
        path.join(supportDir, config.entitlementsFilename),
        config.entitlementsTemplate
    );
    const entitlementsFinal = entitlementsTemplate.replace(/__APP_GROUP_ID__/g, appGroupId);
    writeIfChanged(path.join(extensionDir, config.entitlementsFilename), entitlementsFinal);
}

function prepareNseFiles(
    iosRoot: string,
    projectRoot: string,
    props: MindboxPluginProps,
    appGroupId: string
): void {
    prepareExtensionFiles(iosRoot, projectRoot, props.iosNseFilePath, appGroupId, {
        targetName: IOS_TARGET_NSE_NAME,
        swiftFilename: IOS_NSE_FILENAME_DEFAULT,
        plistFilename: IOS_NSE_INFO_PLIST_FILENAME,
        entitlementsFilename: IOS_NSE_ENTITLEMENTS_FILENAME,
        entitlementsTemplate: IOS_NSE_ENTITLEMENTS_PLIST_TEMPLATE,
    });
}

function prepareNceFiles(
    iosRoot: string,
    projectRoot: string,
    props: MindboxPluginProps,
    appGroupId: string
): void {
    prepareExtensionFiles(iosRoot, projectRoot, (props as any).iosNceFilePath, appGroupId, {
        targetName: IOS_TARGET_NCE_NAME,
        swiftFilename: IOS_NCE_FILENAME_DEFAULT,
        plistFilename: IOS_NCE_INFO_PLIST_FILENAME,
        entitlementsFilename: IOS_NCE_ENTITLEMENTS_FILENAME,
        entitlementsTemplate: IOS_NCE_ENTITLEMENTS_PLIST_TEMPLATE,
    });
}

function readFileFromCustomOrSupport(
    customPath: string | undefined,
    projectRoot: string,
    supportPath: string
): string {
    if (customPath) {
        const resolvedPath = path.isAbsolute(customPath) 
            ? customPath 
            : path.join(projectRoot, customPath);
        
        if (fs.existsSync(resolvedPath)) {
            return fs.readFileSync(resolvedPath, "utf8");
        }
    }
    
    return readFileFromSupport(supportPath);
}

function readFileFromSupport(filePath: string): string {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Required support file not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, "utf8");
}

function readFileFromSupportOrTemplate(filePath: string, template: string): string {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf8");
    }
    return template;
}

function determineAppGroupId(customAppGroupId: string | undefined, bundleId: string): string {
    if (customAppGroupId) {
        return customAppGroupId;
    }
    return `${ENTITLEMENT_GROUP_PREFIX}.${bundleId}`;
}

function determineDeploymentTarget(props: any, config: any, project: any): string {
    if (props.iosDeploymentTarget) {
        return props.iosDeploymentTarget;
    }
    
    if (config.ios?.deploymentTarget) {
        return config.ios.deploymentTarget;
    }
    
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
        const configItem = configurations[key];
        if (configItem?.buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
            return configItem.buildSettings.IPHONEOS_DEPLOYMENT_TARGET.replace(/"/g, '');
        }
    }
    
    return IOS_MIN_DEPLOYMENT_TARGET_DEFAULT;
}

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

type ExtensionTargetConfig = {
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
    frameworks: string[];
};

function configureExtensionTarget(project: any, args: ExtensionTargetConfig): void {
    try {
        const existing = findTargetByName(project, args.targetName);
        if (existing) {
            return;
        }

        const group = createExtensionGroup(project, args.targetName, args.groupPath);
        const targetUuid = createExtensionTarget(project, args.targetName, args.productName);
        
        addBuildPhases(project, targetUuid);
        addFrameworks(project, targetUuid, args.frameworks);
        addSourceFiles(project, group.uuid, targetUuid, args);
        configureBuildSettings(project, targetUuid, args);
        embedExtensionInApp(project, targetUuid, args.productName);
    } catch (e) {
        logWarning(`configure${args.targetName}`, "failed to create extension target", { error: String(e) });
    }
}

function createExtensionGroup(project: any, targetName: string, groupPath: string): any {
    const group = project.addPbxGroup([], targetName, groupPath);
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(group.uuid, mainGroupId);
    return group;
}

function createExtensionTarget(project: any, targetName: string, productName: string): string {
    const projObjects = project.hash.project.objects;
    projObjects['PBXTargetDependency'] = projObjects['PBXTargetDependency'] || {};
    projObjects['PBXContainerItemProxy'] = projObjects['PBXContainerItemProxy'] || {};
    
    const target = project.addTarget(targetName, "app_extension", productName);
    return typeof target === 'string' ? target : target?.uuid;
}

function addBuildPhases(project: any, targetUuid: string): void {
    project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", targetUuid);
    project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", targetUuid);
    project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", targetUuid);
}

function addFrameworks(project: any, targetUuid: string, frameworks: string[]): void {
    for (const framework of frameworks) {
        project.addFramework(framework, { target: targetUuid, link: true });
    }
}

function addSourceFiles(project: any, groupUuid: string, targetUuid: string, args: ExtensionTargetConfig): void {
    project.addSourceFile(args.sourcesRelativePath, { target: targetUuid }, groupUuid);
    addFileToGroup(project, args.infoPlistRelativePath, groupUuid);
    project.addFile(args.entitlementsRelativePath, groupUuid);
}

function configureBuildSettings(project: any, targetUuid: string, args: ExtensionTargetConfig): void {
    const settings: Record<string, string> = {
        "PRODUCT_NAME": args.productName,
        "PRODUCT_BUNDLE_IDENTIFIER": args.bundleIdentifier,
        "SWIFT_VERSION": args.swiftVersion,
        "CODE_SIGN_ENTITLEMENTS": `${args.groupPath}/${args.entitlementsRelativePath}`,
        "INFOPLIST_FILE": `${args.groupPath}/${args.infoPlistRelativePath}`,
        "IPHONEOS_DEPLOYMENT_TARGET": args.deploymentTarget,
        "APPLICATION_EXTENSION_API_ONLY": "YES",
        "SKIP_INSTALL": "NO",
        "TARGETED_DEVICE_FAMILY": "1,2",
    };
    
    if (args.developmentTeam) {
        settings["DEVELOPMENT_TEAM"] = args.developmentTeam;
    }
    
    for (const [key, value] of Object.entries(settings)) {
        setTargetBuildSetting(project, targetUuid, key, value);
    }
}

function embedExtensionInApp(project: any, targetUuid: string, productName: string): void {
    const appTargetUuid = findApplicationTargetUuid(project);
    if (!appTargetUuid) {
        logWarning("embedExtensionInApp", "could not find application target UUID");
        return;
    }

    const copyPhase = project.addBuildPhase(
        [],
        "PBXCopyFilesBuildPhase",
        "Embed Foundation Extensions",
        appTargetUuid,
        "app_extension"
    );
    
    if (!copyPhase) {
        return;
    }

    const copyPhaseSection = project.hash.project.objects.PBXCopyFilesBuildPhase;
    if (copyPhaseSection && copyPhaseSection[copyPhase.uuid]) {
        copyPhaseSection[copyPhase.uuid].dstSubfolderSpec = XCODE_PLUGINS_FOLDER;
        copyPhaseSection[copyPhase.uuid].dstPath = '""';
    }
    
    const appexFilePath = `${productName}.appex`;
    const file = project.addFile(appexFilePath, copyPhase.uuid, { sourceTree: 'BUILT_PRODUCTS_DIR' });
    if (file) {
        if (!file.settings) file.settings = {};
        file.settings.ATTRIBUTES = ['RemoveHeadersOnCopy'];
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
    
    const group = groupSection[groupUuid];
    if (group && group.children) {
        const alreadyInGroup = group.children.find((c: any) => c.value === fileUuid);
        if (!alreadyInGroup) {
            group.children.push({ value: fileUuid, comment: fileName });
        }
    } else {
        logWarning("addFileToGroup", "Group not found or has no children", { groupUuid });
    }
    
    return fileUuid;
}


