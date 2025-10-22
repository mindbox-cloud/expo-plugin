import { ConfigPlugin, withAppDelegate } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { 
    IOS_IMPORT_MINDBOX_SDK, 
    IOS_IMPORT_MINDBOX, 
    IOS_LINE_SET_UN_CENTER_DELEGATE, 
    IOS_LINE_CONFIGURE_MINDBOX_APP, 
    IOS_LINE_CALL_REQUEST_PERMISSIONS, 
    IOS_METHOD_REQUEST_PERMISSIONS, 
    IOS_METHOD_REQUEST_PERMISSIONS_SIGNATURE, 
    IOS_METHOD_USER_NOTIFICATION_CENTER, 
    IOS_METHOD_USER_NOTIFICATION_CENTER_SIGNATURE, 
    IOS_UN_USER_NOTIFICATION_CENTER_DELEGATE 
} from "../helpers/iosConstants";
import { logSuccess } from "../utils/errorUtils";

const IMPORT_BLOCK_REGEX = /^(import\s+.*\n)+/;
const CLASS_DECLARATION_REGEX = /(public\s+)?class\s+AppDelegate\s*:\s*([^\{\n]+)/;
const CLASS_BODY_REGEX = /(public\s+)?class\s+AppDelegate\b[^\{]*\{/;
const DID_FINISH_LAUNCHING_REGEX = /(public\s+)?override\s+func\s+application\([\s\S]*?didFinishLaunchingWithOptions[\s\S]*?\)/;

function addImports(contents: string): string {
    if (contents.includes(IOS_IMPORT_MINDBOX_SDK)) {
        return contents;
    }
    const match = contents.match(IMPORT_BLOCK_REGEX);
    const mindboxImports = `${IOS_IMPORT_MINDBOX_SDK}\n${IOS_IMPORT_MINDBOX}\n`;
    if (match && match[0]) {
        const updated = contents.replace(IMPORT_BLOCK_REGEX, match[0] + mindboxImports);
        logSuccess("add Mindbox imports to AppDelegate");
        return updated;
    }
    logSuccess("add Mindbox imports to AppDelegate");
    return mindboxImports + contents;
}

function extendClassInheritance(contents: string): string {
    const match = contents.match(CLASS_DECLARATION_REGEX);
    if (!match) {
        return contents;
    }
    const currentInheritance = match[2];
    if (currentInheritance.includes(IOS_UN_USER_NOTIFICATION_CENTER_DELEGATE)) {
        return contents;
    }
    const updatedDeclaration = match[0].replace(
        match[2], 
        `${currentInheritance}, ${IOS_UN_USER_NOTIFICATION_CENTER_DELEGATE} `
    );
    logSuccess("extend AppDelegate inheritance with UNUserNotificationCenterDelegate");
    return contents.replace(CLASS_DECLARATION_REGEX, updatedDeclaration);
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
    const classMatch = contents.match(CLASS_BODY_REGEX);
    if (!classMatch) {
        return null;
    }
    const classStartIndex = contents.search(CLASS_BODY_REGEX);
    const classOpenBraceIndex = contents.indexOf("{", classStartIndex);
    if (classOpenBraceIndex === -1) {
        return null;
    }
    const classCloseBraceIndex = findMatchingClosingBrace(contents, classOpenBraceIndex);
    if (classCloseBraceIndex === -1) {
        return null;
    }
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
    return getMethodBodyRange(contents, DID_FINISH_LAUNCHING_REGEX);
}

function addLineIfMissing(methodBody: string, lineToCheck: string, lineToAdd: string): string | null {
    if (methodBody.includes(lineToCheck.trim())) {
        return null;
    }
    return lineToAdd;
}

function ensureDidFinishLaunching(contents: string, nativeRequestPermission: boolean): string {
    const range = findDidFinishLaunchingMethod(contents);
    if (!range) {
        return contents;
    }
    const { bodyStart, bodyEnd } = range;
    const methodBody = contents.slice(bodyStart, bodyEnd);
    const linesToInsert: string[] = [];
    const delegateLine = addLineIfMissing(
        methodBody, 
        IOS_LINE_SET_UN_CENTER_DELEGATE, 
        '\n' + IOS_LINE_SET_UN_CENTER_DELEGATE
    );
    if (delegateLine) linesToInsert.push(delegateLine);
    const sdkLine = addLineIfMissing(
        methodBody, 
        IOS_LINE_CONFIGURE_MINDBOX_APP, 
        IOS_LINE_CONFIGURE_MINDBOX_APP
    );
    if (sdkLine) linesToInsert.push(sdkLine);
    if (nativeRequestPermission) {
        const permissionLine = addLineIfMissing(
            methodBody, 
            IOS_LINE_CALL_REQUEST_PERMISSIONS,
            IOS_LINE_CALL_REQUEST_PERMISSIONS
        );
        if (permissionLine) linesToInsert.push(permissionLine);
    }
    if (linesToInsert.length === 0) {
        return contents;
    }
    const updatedMethodBody = linesToInsert.join("") + methodBody;
    logSuccess("add Mindbox initialization lines to didFinishLaunchingWithOptions");
    return contents.slice(0, bodyStart) + updatedMethodBody + contents.slice(bodyEnd);
}

function addMethodToClass(
    contents: string, 
    methodSignature: string, 
    methodToAdd: string, 
    logMessage: string
): string {
    const classRange = getAppDelegateBodyRange(contents);
    if (!classRange) {
        return contents;
    }
    const { bodyStart, bodyEnd } = classRange;
    const classBody = contents.slice(bodyStart, bodyEnd);
    if (classBody.includes(methodSignature)) {
        return contents;
    }
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
        if (language === "swift") {
            c.modResults.contents = applySwiftModifications(
                c.modResults.contents as string,
                Boolean(props.nativeRequestPermission)
            );
            logSuccess("configure AppDelegate for Mindbox");
        } else if (language === "objc") {
            console.warn("Objective-C AppDelegate modification not yet supported");
        } else {
            console.warn(`Unsupported AppDelegate language: ${language}`);
        }
        return c;
    });
};

function applySwiftModifications(contents: string, nativeRequestPermission: boolean): string {
    let modified = contents;
    
    modified = addImports(modified);
    modified = extendClassInheritance(modified);
    modified = ensureDidFinishLaunching(modified, nativeRequestPermission);
    if (nativeRequestPermission) {
        modified = ensureRequestPermissionMethod(modified);
    }
    modified = ensureUserNotificationCenterMethod(modified);
    return modified;
}

export default withMindboxAppDelegate;


