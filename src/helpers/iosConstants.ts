export const IOS_TARGET_NSE_NAME: string = "MindboxNotificationServiceExtension";
export const IOS_TARGET_NCE_NAME: string = "MindboxNotificationContentExtension";
export const IOS_NSE_FILENAME_DEFAULT: string = "NotificationService.swift";
export const IOS_NCE_FILENAME_DEFAULT: string = "NotificationViewController.swift";
export const IOS_NSE_INFO_PLIST_FILENAME: string = "Info.plist";
export const IOS_NCE_INFO_PLIST_FILENAME: string = "Info.plist";
export const IOS_NSE_ENTITLEMENTS_FILENAME: string = "MindboxNotificationServiceExtension.entitlements";
export const IOS_NCE_ENTITLEMENTS_FILENAME: string = "MindboxNotificationContentExtension.entitlements";
export const IOS_MIN_DEPLOYMENT_TARGET_DEFAULT: string = "15.1";
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
export const IOS_IMPORT_EX_NOTIFICATIONS: string = "import EXNotifications";
export const IOS_LINE_SET_UN_CENTER_DELEGATE: string = `
    UNUserNotificationCenter.current().delegate = self
`;
export const IOS_LINE_SET_EXPO_CENTER_DELEGATE: string = `
    UNUserNotificationCenter.current().delegate = NotificationCenterManager.shared
`;
export const IOS_LINE_ADD_EXPO_NOTIFICATION_DELEGATE: string = `
    NotificationCenterManager.shared.addDelegate(self)
`;
export const IOS_LINE_CONFIGURE_MINDBOX_APP: string = `
    MindboxApp.configure()
`;
export const IOS_LINE_CONFIGURE_MINDBOX_APP_WITH_OPTIONS: string = `
    MindboxApp.configure(launchOptions: launchOptions)
`;
export const IOS_LINE_CALL_REQUEST_PERMISSIONS: string = `
    onRequestPushNotifications()
`;
export const IOS_METHOD_REQUEST_PERMISSIONS_SIGNATURE: string = "func onRequestPushNotifications(";
export const IOS_METHOD_REQUEST_PERMISSIONS: string = `
  public func onRequestPushNotifications() {
    UNUserNotificationCenter.current().requestAuthorization(
        options: [.alert, .sound, .badge]
    ) { granted, error in
        Mindbox.shared.notificationsRequestAuthorization(granted: granted)
    }
  }
`;
export const IOS_UN_USER_NOTIFICATION_CENTER_DELEGATE: string = "UNUserNotificationCenterDelegate";
export const IOS_EXTENSION_NOTIFICATION_DELEGATE_SIGNATURE: string = "extension AppDelegate: NotificationDelegate";
export const IOS_EXTENSION_NOTIFICATION_DELEGATE: string = `
extension AppDelegate: NotificationDelegate {

  public func didReceive(
    _ response: UNNotificationResponse,
    completionHandler: @escaping () -> Void
  ) -> Bool {
  
    let isMindbox = Mindbox.shared.isMindboxPush(
      userInfo: response.notification.request.content.userInfo
    )

    completionHandler()
    return isMindbox
  }
}
`;
export const POD_MINDBOX_LINE: string = "pod 'Mindbox'";
export const POD_MINDBOX_LOGGER_LINE: string = "pod 'MindboxLogger'";
export const POD_MINDBOX_COMMON_LINE: string = "pod 'MindboxCommon'";
export const POD_MINDBOX_NOTIFICATIONS_LINE: string = "pod 'MindboxNotifications'";
export const PODFILE_ANCHOR_PREPARE_RN: string = "prepare_react_native_project!";

export const IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX: string = ".MindboxNotificationServiceExtension";
export const IOS_NSE_PRODUCT_NAME: string = "MindboxNotificationServiceExtension";
export const IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX: string = ".MindboxNotificationContentExtension";
export const IOS_NCE_PRODUCT_NAME: string = "MindboxNotificationContentExtension";
export const IOS_SWIFT_VERSION_DEFAULT: string = "5.0";

export const IOS_NCE_ENTITLEMENTS_PLIST_TEMPLATE: string = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>__APP_GROUP_ID__</string>
  </array>
  <key>com.apple.security.app-sandbox</key>
  <true/>
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


