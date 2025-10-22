import UserNotifications
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


