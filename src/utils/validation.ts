import type { MindboxPluginProps } from "../mindboxTypes";

const MINDBOX_PLUGIN_PROPS = [
  "androidPushProviders",
  "googleServicesFilePath",
  "huaweiServicesFilePath",
  "rustoreProjectId",
  "androidChannelId",
  "androidChannelName",
  "androidChannelDescription",
  "smallIcon",
  "smallIconAccentColor",
  "nativeRequestPermission",
  "iosNseFilePath",
  "iosNceFilePath",
  "iosMode",
  "iosAppGroupId"
] as const;

const VALID_ANDROID_PROVIDERS = ["firebase", "huawei", "rustore"] as const;
const VALID_IOS_MODES = ["development", "production"] as const;

function validateStringProp(value: unknown, propName: string): void {
  if (value && typeof value !== "string") {
    throw new Error(`Mindbox Expo Plugin: '${propName}' must be a string.`);
  }
}

function validateAndroidPushProviders(providers: unknown): void {
  if (!providers) {
    return;
  }
  
  if (!Array.isArray(providers)) {
    throw new Error("Mindbox Expo Plugin: 'androidPushProviders' must be an array.");
  }
  
  for (const provider of providers) {
    if (!VALID_ANDROID_PROVIDERS.includes(provider as any)) {
      throw new Error(
        `Mindbox Expo Plugin: 'androidPushProviders' contains invalid provider "${provider}". ` +
        `Valid providers are: ${VALID_ANDROID_PROVIDERS.join(", ")}.`
      );
    }
  }
}

function validateIosMode(mode: unknown): void {
  if (!mode) {
    return;
  }
  
  if (!VALID_IOS_MODES.includes(mode as any)) {
    throw new Error(
      `Mindbox Expo Plugin: 'iosMode' must be either "development" or "production". Got: "${mode}".`
    );
  }
}

function validateUnknownProps(props: MindboxPluginProps): void {
  const inputProps = Object.keys(props);
  
  for (const prop of inputProps) {
    if (!MINDBOX_PLUGIN_PROPS.includes(prop as any)) {
      throw new Error(
        `Mindbox Expo Plugin: Unknown property "${prop}". ` +
        `Valid properties are: ${MINDBOX_PLUGIN_PROPS.join(", ")}.`
      );
    }
  }
}

export function validatePluginProps(props: MindboxPluginProps): void {
  validateAndroidPushProviders(props.androidPushProviders);
  validateIosMode(props.iosMode);
  
  validateStringProp(props.googleServicesFilePath, "googleServicesFilePath");
  validateStringProp(props.huaweiServicesFilePath, "huaweiServicesFilePath");
  validateStringProp(props.rustoreProjectId, "rustoreProjectId");
  validateStringProp(props.androidChannelId, "androidChannelId");
  validateStringProp(props.androidChannelName, "androidChannelName");
  validateStringProp(props.androidChannelDescription, "androidChannelDescription");
  validateStringProp(props.smallIcon, "smallIcon");
  validateStringProp(props.smallIconAccentColor, "smallIconAccentColor");
  validateStringProp(props.iosNseFilePath, "iosNseFilePath");
  validateStringProp(props.iosNceFilePath, "iosNceFilePath");
  validateStringProp(props.iosAppGroupId, "iosAppGroupId");
  
  validateUnknownProps(props);
}
