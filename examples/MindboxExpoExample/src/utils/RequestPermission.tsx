import { requestNotifications, RESULTS } from 'react-native-permissions';
import MindboxSdk from 'mindbox-sdk';

export const requestNotificationPermission = async (): Promise<void> => {
  requestNotifications(['alert', 'sound']).then(({ status }) => {
    if (status === RESULTS.GRANTED) {
      MindboxSdk.updateNotificationPermissionStatus(true);
    } else {
      MindboxSdk.updateNotificationPermissionStatus(false);
    }
  });
};

