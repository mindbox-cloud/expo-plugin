import cloud.mindbox.mindbox_firebase.MindboxFirebase
import cloud.mindbox.mindbox_sdk_starter_core.MindboxCoreStarter
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate
import expo.modules.notifications.service.ExpoFirebaseMessagingService


class MindboxExpoFirebaseService : ExpoFirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        if (MindboxFirebase.isMindboxPush(remoteMessage)) {
            MindboxCoreStarter.onMessageReceived(application, remoteMessage)
            return
        }
        super.onMessageReceived(remoteMessage)
    }

    override fun onNewToken(token: String) {
        MindboxCoreStarter.onNewToken(applicationContext, token, MindboxFirebase)
        super.onNewToken(token)
    }
}