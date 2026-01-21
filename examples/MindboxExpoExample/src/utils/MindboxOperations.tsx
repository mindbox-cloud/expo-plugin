import MindboxSdk from 'mindbox-sdk';
import { Alert } from 'react-native';

const asyncViewProductOperationName = 'viewProduct';
const syncRecoOperationName = 'categoryReco.sync';

const requestProductOperationBodyAsync = {
  viewProduct: {
    product: {
      ids: {
        website: "test-1"
      }
    }
  }
};

const requestRecoBodySync = {
  recommendation: {
    limit: 100,
    productCategory: {
      ids: {
        website: '156'
      }
    },
    area: {
      ids: {
        externalId: '1345ff'
      }
    }
  }
};

export const sendAsync = (): void => {
  MindboxSdk.executeAsyncOperation({
    operationSystemName: asyncViewProductOperationName,
    operationBody: requestProductOperationBodyAsync
  });
  Alert.alert('Mindbox Async Operation', 'The operation was sent.');
};

export const sendSync = (): void => {
  MindboxSdk.executeSyncOperation({
    operationSystemName: syncRecoOperationName,
    operationBody: requestRecoBodySync,
    onSuccess: (data) => {
      Alert.alert('Mindbox Sync Operation Success', JSON.stringify(data, null, 2));
    },
    onError: (error) => {
      Alert.alert('Mindbox Sync Operation Error', JSON.stringify(error, null, 2));
    }
  });
};

