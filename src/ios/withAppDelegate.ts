import { ConfigPlugin, withAppDelegate } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { IOS_IMPORT_MINDBOX_SDK, IOS_IMPORT_MINDBOX, IOS_LINE_SET_UN_CENTER_DELEGATE, IOS_LINE_CONFIGURE_MINDBOX_APP, IOS_LINE_CALL_REQUEST_PERMISSIONS, IOS_METHOD_REQUEST_PERMISSIONS, IOS_METHOD_REQUEST_PERMISSIONS_SIGNATURE, IOS_METHOD_USER_NOTIFICATION_CENTER, IOS_METHOD_USER_NOTIFICATION_CENTER_SIGNATURE, IOS_UN_USER_NOTIFICATION_CENTER_DELEGATE } from "../helpers/iosConstants";
import { logSuccess } from "../utils/errorUtils";

function addImports(contents: string): string {
    if (contents.includes(IOS_IMPORT_MINDBOX_SDK)) return contents;
    const importBlockRegex = /^(import\s+.*\n)+/;
    const match = contents.match(importBlockRegex);
    if (match && match[0]) {
        const insert = match[0] + `${IOS_IMPORT_MINDBOX_SDK}\n${IOS_IMPORT_MINDBOX}\n`;
        const updated = contents.replace(importBlockRegex, insert);
        logSuccess("add Mindbox imports to AppDelegate");
        return updated;
    }
    const updated = `${IOS_IMPORT_MINDBOX_SDK}\n${IOS_IMPORT_MINDBOX}\n${contents}`;
    logSuccess("add Mindbox imports to AppDelegate");
    return updated;
}

function extendClassInheritance(contents: string): string {
    const classRegex = /(public\s+)?class\s+AppDelegate\s*:\s*([^\{\n]+)/;
    const match = contents.match(classRegex);
    if (!match) return contents;
    const currentInheritance = match[2];
    if (currentInheritance.includes(IOS_UN_USER_NOTIFICATION_CENTER_DELEGATE)) return contents;
    const updated = match[0].replace(match[2], `${currentInheritance}, ${IOS_UN_USER_NOTIFICATION_CENTER_DELEGATE} `);
    logSuccess("extend AppDelegate inheritance with UNUserNotificationCenterDelegate");
    return contents.replace(classRegex, updated);
}

function findMatchingClosingBrace(contents: string, openingBraceIndex: number): number {
    let depth = 1;
    for (let i = openingBraceIndex + 1; i < contents.length; i++) {
        const ch = contents[i];
        if (ch === "{") depth++;
        if (ch === "}") depth--;
        if (depth === 0) return i;
    }
    return -1;
}

function getAppDelegateBodyRange(contents: string): { bodyStart: number; bodyEnd: number } | null {
    const classDeclRegex = /(public\s+)?class\s+AppDelegate\b[^\{]*\{/;
    const classMatch = contents.match(classDeclRegex);
    if (!classMatch) return null;
    const classStartIndex = contents.search(classDeclRegex);
    const classOpenBraceIndex = contents.indexOf("{", classStartIndex);
    if (classOpenBraceIndex === -1) return null;
    const classCloseBraceIndex = findMatchingClosingBrace(contents, classOpenBraceIndex);
    if (classCloseBraceIndex === -1) return null;
    return { bodyStart: classOpenBraceIndex + 1, bodyEnd: classCloseBraceIndex };
}

function getMethodBodyRange(contents: string, methodSignatureRegex: RegExp): { bodyStart: number; bodyEnd: number } | null {
    const signatureIndex = contents.search(methodSignatureRegex);
    if (signatureIndex === -1) return null;
    const openingBraceIndex = contents.indexOf("{", signatureIndex);
    if (openingBraceIndex === -1) return null;
    const closingBraceIndex = findMatchingClosingBrace(contents, openingBraceIndex);
    if (closingBraceIndex === -1) return null;
    return { bodyStart: openingBraceIndex + 1, bodyEnd: closingBraceIndex };
}

function findDidFinishLaunchingMethod(contents: string): { bodyStart: number; bodyEnd: number } | null {
    const methodStartRegex = /(public\s+)?override\s+func\s+application\([\s\S]*?didFinishLaunchingWithOptions[\s\S]*?\)/;
    return getMethodBodyRange(contents, methodStartRegex);
}

function addDelegateSetup(contents: string, methodBody: string): string[] {
    const linesToInsert: string[] = [];
    if (!methodBody.includes(IOS_LINE_SET_UN_CENTER_DELEGATE.trim())) {
        linesToInsert.push('\n' + IOS_LINE_SET_UN_CENTER_DELEGATE);
    }
    return linesToInsert;
}

function addSdkInitialization(contents: string, methodBody: string): string[] {
    const linesToInsert: string[] = [];
    if (!methodBody.includes(IOS_LINE_CONFIGURE_MINDBOX_APP.trim())) {
        linesToInsert.push(IOS_LINE_CONFIGURE_MINDBOX_APP);
    }
    return linesToInsert;
}

function addPermissionRequest(contents: string, methodBody: string, nativeRequestPermission: boolean): string[] {
    const linesToInsert: string[] = [];
    if (nativeRequestPermission && !methodBody.includes(IOS_LINE_CALL_REQUEST_PERMISSIONS.trim())) {
        linesToInsert.push(IOS_LINE_CALL_REQUEST_PERMISSIONS);
    }
    return linesToInsert;
}

function ensureDidFinishLaunching(contents: string, nativeRequestPermission: boolean): string {
    const range = findDidFinishLaunchingMethod(contents);
    if (!range) return contents;
    const { bodyStart, bodyEnd } = range;
    const methodBody = contents.slice(bodyStart, bodyEnd);

    const delegateLines = addDelegateSetup(contents, methodBody);
    const sdkLines = addSdkInitialization(contents, methodBody);
    const permissionLines = addPermissionRequest(contents, methodBody, nativeRequestPermission);

    const allLinesToInsert = [...delegateLines, ...sdkLines, ...permissionLines];

    if (allLinesToInsert.length === 0) return contents;

    const updatedMethodBody = allLinesToInsert.join("") + methodBody;
    logSuccess("add Mindbox initialization lines to didFinishLaunchingWithOptions");
    return contents.slice(0, bodyStart) + updatedMethodBody + contents.slice(bodyEnd);
}

function addMethodToClass(contents: string, methodSignature: string, methodToAdd: string, logMessage: string): string {
    const classRange = getAppDelegateBodyRange(contents);
    if (!classRange) return contents + methodToAdd;
    const { bodyStart, bodyEnd } = classRange;
    const classBody = contents.slice(bodyStart, bodyEnd);
    if (classBody.includes(methodSignature)) return contents;
    logSuccess(logMessage);
    return contents.slice(0, bodyEnd) + `\n${methodToAdd}` + contents.slice(bodyEnd);
}

function ensureRequestPermissionMethod(contents: string): string {
    return addMethodToClass(
        contents,
        IOS_METHOD_REQUEST_PERMISSIONS_SIGNATURE,
        IOS_METHOD_REQUEST_PERMISSIONS,
        "add onRequestPushNotifications method to AppDelegate"
    );
}

function ensureUserNotificationCenterMethod(contents: string): string {
    return addMethodToClass(
        contents,
        IOS_METHOD_USER_NOTIFICATION_CENTER_SIGNATURE,
        IOS_METHOD_USER_NOTIFICATION_CENTER,
        "add userNotificationCenter method to AppDelegate"
    );
}

const withMindboxAppDelegate: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    return withAppDelegate(config, (c) => {
        const language = c.modResults.language;

        switch (language) {
            case "swift":
                let contents = c.modResults.contents as string;
                contents = addImports(contents);
                contents = extendClassInheritance(contents);
                contents = ensureDidFinishLaunching(contents, Boolean(props.nativeRequestPermission));
                if (props.nativeRequestPermission) {
                    contents = ensureRequestPermissionMethod(contents);
                }
                contents = ensureUserNotificationCenterMethod(contents);
                c.modResults.contents = contents;
                break;
            case "objc":
                console.warn("Objective-C AppDelegate modification not yet supported");
                break;
            default:
                console.warn(`Unsupported AppDelegate language: ${language}`);
                break;
        }

        logSuccess("configure AppDelegate for Mindbox");
        return c;
    });
};

export default withMindboxAppDelegate;


