export const IOS_TARGET_NSE_NAME: string = "MindboxNotificationServiceExtension";
export const IOS_TARGET_NCE_NAME: string = "MindboxNotificationContentExtension";
export const IOS_NSE_FILENAME_DEFAULT: string = "NotificationService.swift";
export const IOS_NSE_INFO_PLIST_FILENAME: string = "Info.plist";
export const IOS_NSE_ENTITLEMENTS_FILENAME: string = "MindboxNotificationServiceExtension.entitlements";
export const IOS_MIN_DEPLOYMENT_TARGET_DEFAULT: string = "13.0";
export const APS_ENV_ENTITLEMENT_KEY: string = "aps-environment";
export const ENTITLEMENT_APP_GROUPS_KEY: string = "com.apple.security.application-groups";
export const ENTITLEMENT_GROUP_PREFIX: string = "group.cloud.Mindbox";
export const ENTITLEMENT_GROUP_DEFAULT: string = `${ENTITLEMENT_GROUP_PREFIX}`;
export const INFO_PLIST_KEY_UI_BACKGROUND_MODES: string = "UIBackgroundModes";
export const INFO_PLIST_KEY_BG_TASKS: string = "BGTaskSchedulerPermittedIdentifiers";
export const UI_BACKGROUND_MODE_REMOTE: string = "remote-notification";
export const UI_BACKGROUND_MODE_PROCESSING: string = "processing";
export const UI_BACKGROUND_MODE_FETCH: string = "fetch";
export const BG_TASK_PREFIX: string = "cloud.MindBox.";
export const BG_TASK_GD_APP_REFRESH_SUFFIX: string = ".GDAppRefresh";
export const BG_TASK_GD_APP_PROCESSING_SUFFIX: string = ".GDAppProcessing";
export const BG_TASK_DB_CLEAN_APP_PROCESSING_SUFFIX: string = ".DBCleanAppProcessing";
export const IOS_IMPORT_MINDBOX_SDK: string = "import MindboxSdk";
export const IOS_IMPORT_MINDBOX: string = "import Mindbox";
export const IOS_LINE_SET_UN_CENTER_DELEGATE: string = "    UNUserNotificationCenter.current().delegate = self\n";
export const IOS_LINE_CONFIGURE_MINDBOX_APP: string = "    MindboxApp.configure()\n";
export const IOS_LINE_CALL_REQUEST_PERMISSIONS: string = "    onRequestPushNotifications()\n";
export const IOS_METHOD_REQUEST_PERMISSIONS_SIGNATURE: string = "func onRequestPushNotifications(";
export const IOS_METHOD_REQUEST_PERMISSIONS: string = `\n  public func onRequestPushNotifications() {\n      UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in\n        Mindbox.shared.notificationsRequestAuthorization(granted: granted)\n      }\n  }\n`;
export const IOS_METHOD_USER_NOTIFICATION_CENTER_SIGNATURE: string = "func userNotificationCenter(_ center: UNUserNotificationCenter,";
export const IOS_METHOD_USER_NOTIFICATION_CENTER: string = `\n  public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {\n      MindboxJsDelivery.emitEvent(response)\n      completionHandler()\n  }\n`;
export const IOS_UN_USER_NOTIFICATION_CENTER_DELEGATE: string = "UNUserNotificationCenterDelegate";
export const POD_MINDBOX_LINE: string = "pod 'Mindbox', :git => 'https://github.com/mindbox-cloud/ios-sdk.git', :branch => 'develop'";
export const POD_MINDBOX_LOGGER_LINE: string = "pod 'MindboxLogger', :git => 'https://github.com/mindbox-cloud/ios-sdk.git', :branch => 'develop'";
export const POD_MINDBOX_COMMON_LINE: string = "pod 'MindboxCommon', '2.14.2'";
export const POD_MINDBOX_NOTIFICATIONS_LINE: string = "pod 'MindboxNotifications', :git => 'https://github.com/mindbox-cloud/ios-sdk.git', :branch => 'develop'";
export const PODFILE_ANCHOR_PREPARE_RN: string = "prepare_react_native_project!";

export const IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX: string = ".MindboxNotificationServiceExtension";
export const IOS_NSE_PRODUCT_NAME: string = "MindboxNotificationServiceExtension";
export const IOS_SWIFT_VERSION_DEFAULT: string = "5.0";

export const IOS_NSE_SWIFT_SOURCE: string = `import UserNotifications
import MindboxNotifications

class NotificationService: UNNotificationServiceExtension {

    lazy var mindboxService = MindboxNotificationService()

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        mindboxService.didReceive(request, withContentHandler: contentHandler)
    }

    override func serviceExtensionTimeWillExpire() {
        mindboxService.serviceExtensionTimeWillExpire()
    }
}
`;

export const IOS_NSE_INFO_PLIST_SOURCE: string = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>MindboxNotificationServiceExtension</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.usernotifications.service</string>
    <key>NSExtensionPrincipalClass</key>
    <string>$(PRODUCT_MODULE_NAME).NotificationService</string>
  </dict>
</dict>
</plist>`;

export const IOS_NSE_ENTITLEMENTS_PLIST_TEMPLATE: string = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>__APP_GROUP_ID__</string>
  </array>
</dict>
</plist>`;


