import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import * as fs from "fs";
import * as path from "path";
import { POD_MINDBOX_LINE, POD_MINDBOX_LOGGER_LINE, POD_MINDBOX_COMMON_LINE, POD_MINDBOX_NOTIFICATIONS_LINE, PODFILE_ANCHOR_PREPARE_RN, IOS_TARGET_NSE_NAME, IOS_TARGET_NCE_NAME } from "../helpers/iosConstants";
import { logSuccess } from "../utils/errorUtils";

type PodfileContent = string;

const TARGET_REGEX = /^target\s+'[^']+'\s+do\s*\n/m;
const USE_EXPO_MODULES_REGEX = /^\s*use_expo_modules!\s*$/m;
const USE_FRAMEWORKS_REGEX = /^\s*use_frameworks!.*$/m;

const RESOURCE_BUNDLE_SIGNING_FIX = `
    installer.pods_project.targets.each do |target|
      if target.respond_to?(:product_type) and target.product_type == "com.apple.product-type.bundle"
        target.build_configurations.each do |config|
            config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        end
      end
    end`;

const withMindboxPodfile: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    return withDangerousMod(config, [
        "ios",
        async (c) => {
            const podfilePath = path.join(c.modRequest.platformProjectRoot, "Podfile");
            if (!fs.existsSync(podfilePath)) return c;
            
            const source = fs.readFileSync(podfilePath, "utf8");
            const updated = applyPodfileTransformations(source, props);
            
            if (updated !== source) {
                fs.writeFileSync(podfilePath, updated, "utf8");
                logSuccess("configure Podfile for Mindbox");
            }
            return c;
        },
    ]);
};

export default withMindboxPodfile;

function applyPodfileTransformations(podfile: PodfileContent, props: MindboxPluginProps): PodfileContent {
    const transformations = [
        insertMindboxNotificationsTarget,
        insertMindboxContentTarget,
        insertMindboxPods,
    ];

    if (!props.iosSkipResourceSigning) {
        transformations.push(insertResourceBundleSigningFix);
    }

    return transformations.reduce((content, transform) => transform(content), podfile);
}

function insertTargetIfMissing(
    podfile: PodfileContent,
    targetName: string,
    podLine: string,
    logMessage: string
): PodfileContent {
    const targetHeader = `target '${targetName}' do`;
    if (podfile.includes(targetHeader)) {
        return podfile;
    }

    const headerMatch = podfile.match(TARGET_REGEX);
    if (!headerMatch) {
        return podfile;
    }
    
    const headerIdx = podfile.search(TARGET_REGEX);
    if (headerIdx === -1) {
        return podfile;
    }

    const frameworksMatch = podfile.match(USE_FRAMEWORKS_REGEX);
    const frameworksLine = frameworksMatch ? `  ${frameworksMatch[0].trim()}\n` : "";

    const insertion = `target '${targetName}' do\n${frameworksLine}  ${podLine}\nend\n\n`;
    logSuccess(logMessage);
    return podfile.slice(0, headerIdx) + insertion + podfile.slice(headerIdx);
}

function insertMindboxPods(podfile: PodfileContent): PodfileContent {
    if (podfile.includes(POD_MINDBOX_LINE)) {
        return podfile;
    }

    const prepareIndex = podfile.indexOf(PODFILE_ANCHOR_PREPARE_RN);
    if (prepareIndex === -1) {
        return podfile;
    }

    const afterPrepare = podfile.slice(prepareIndex);
    const targetMatch = afterPrepare.match(TARGET_REGEX);
    if (!targetMatch) {
        return podfile;
    }
    
    const targetIdx = prepareIndex + afterPrepare.search(TARGET_REGEX);
    const targetLineEnd = targetIdx + targetMatch[0].length;

    return insertPodsAfterTarget(podfile, targetLineEnd);
}

function insertPodsAfterTarget(podfile: PodfileContent, targetLineEnd: number): PodfileContent {
    const mindboxPodsBlock = [
        POD_MINDBOX_LINE
    ].map(line => `    ${line}`).join('\n') + '\n';

    const targetBlock = podfile.slice(targetLineEnd);
    const useExpoMatch = targetBlock.match(USE_EXPO_MODULES_REGEX);
    
    if (useExpoMatch) {
        const useExpoIdx = targetLineEnd + targetBlock.search(USE_EXPO_MODULES_REGEX);
        const useExpoLineEnd = podfile.indexOf("\n", useExpoIdx) + 1;
        logSuccess("add Mindbox pods to main target after use_expo_modules!");
        return podfile.slice(0, useExpoLineEnd) + mindboxPodsBlock + podfile.slice(useExpoLineEnd);
    }
    
    const insertion = `  use_expo_modules!\n${mindboxPodsBlock}`;
    logSuccess("add Mindbox pods to main target");
    return podfile.slice(0, targetLineEnd) + insertion + podfile.slice(targetLineEnd);
}

function insertMindboxNotificationsTarget(podfile: PodfileContent): PodfileContent {
    return insertTargetIfMissing(
        podfile,
        IOS_TARGET_NSE_NAME,
        POD_MINDBOX_NOTIFICATIONS_LINE,
        "add NSE target to Podfile as separate target"
    );
}

function insertMindboxContentTarget(podfile: PodfileContent): PodfileContent {
    return insertTargetIfMissing(
        podfile,
        IOS_TARGET_NCE_NAME,
        POD_MINDBOX_NOTIFICATIONS_LINE,
        "add NCE target to Podfile as separate target"
    );
}

function insertResourceBundleSigningFix(podfile: PodfileContent): PodfileContent {
    if (podfile.includes("CODE_SIGNING_ALLOWED'] = 'NO'")) {
        return podfile;
    }

    const postInstallRegex = /post_install\s+do\s+\|installer\|/;
    
    if (postInstallRegex.test(podfile)) {
        logSuccess("add resource bundle signing fix to existing post_install");
        return podfile.replace(postInstallRegex, `post_install do |installer|\n${RESOURCE_BUNDLE_SIGNING_FIX}`);
    }

    logSuccess("add resource bundle signing fix to new post_install");
    return `${podfile}\n\npost_install do |installer|\n${RESOURCE_BUNDLE_SIGNING_FIX}\nend`;
}



