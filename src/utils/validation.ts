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
  "nativeRequestPermission"
] as const;

export function validatePluginProps(props: MindboxPluginProps): void {
  if (props.androidPushProviders && !Array.isArray(props.androidPushProviders)) {
    throw new Error("Mindbox Expo Plugin: 'androidPushProviders' must be an array.");
  }

  if (props.androidPushProviders) {
    for (const provider of props.androidPushProviders) {
      if (!["firebase", "huawei", "rustore"].includes(provider)) {
        throw new Error(`Mindbox Expo Plugin: 'androidPushProviders' contains invalid provider "${provider}". Valid providers are: firebase, huawei, rustore.`);
      }
    }
  }

  if (props.googleServicesFilePath && typeof props.googleServicesFilePath !== "string") {
    throw new Error("Mindbox Expo Plugin: 'googleServicesFilePath' must be a string.");
  }

  if (props.huaweiServicesFilePath && typeof props.huaweiServicesFilePath !== "string") {
    throw new Error("Mindbox Expo Plugin: 'huaweiServicesFilePath' must be a string.");
  }

  if (props.rustoreProjectId && typeof props.rustoreProjectId !== "string") {
    throw new Error("Mindbox Expo Plugin: 'rustoreProjectId' must be a string.");
  }

  if (props.androidChannelId && typeof props.androidChannelId !== "string") {
    throw new Error("Mindbox Expo Plugin: 'androidChannelId' must be a string.");
  }

  if (props.androidChannelName && typeof props.androidChannelName !== "string") {
    throw new Error("Mindbox Expo Plugin: 'androidChannelName' must be a string.");
  }

  if (props.androidChannelDescription && typeof props.androidChannelDescription !== "string") {
    throw new Error("Mindbox Expo Plugin: 'androidChannelDescription' must be a string.");
  }

  if (props.smallIcon && typeof props.smallIcon !== "string") {
    throw new Error("Mindbox Expo Plugin: 'icon' must be a string.");
  }

  if (props.smallIconAccentColor && typeof props.smallIconAccentColor !== "string") {
    throw new Error("Mindbox Expo Plugin: 'iconColor' must be a string.");
  }

  const inputProps = Object.keys(props);

  for (const prop of inputProps) {
    if (!MINDBOX_PLUGIN_PROPS.includes(prop as any)) {
      throw new Error(`Mindbox Expo Plugin: You have provided an invalid property "${prop}" to the Mindbox plugin.`);
    }
  }
}
