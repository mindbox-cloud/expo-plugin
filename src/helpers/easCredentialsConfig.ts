import { ExpoConfig } from '@expo/config-types';
import { 
  IOS_TARGET_NSE_NAME, 
  IOS_TARGET_NCE_NAME, 
  IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX, 
  IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX, 
  ENTITLEMENT_GROUP_PREFIX 
} from './iosConstants';

export function configureMindboxEasCredentials(config: ExpoConfig): { [k: string]: any } {
  const bundleIdentifier = config?.ios?.bundleIdentifier;
  if (!bundleIdentifier) {
    console.warn('Mindbox: ios.bundleIdentifier is not defined, skipping EAS credentials configuration');
    return config.extra || {};
  }

  const appGroup = `${ENTITLEMENT_GROUP_PREFIX}.${bundleIdentifier}`;
  
  return {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            ...config.extra?.eas?.build?.experimental?.ios,
            appExtensions: [
              ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ?? []),
              {
                targetName: IOS_TARGET_NSE_NAME,
                bundleIdentifier: `${bundleIdentifier}${IOS_NSE_PRODUCT_BUNDLE_ID_SUFFIX}`,
                entitlements: {
                  'com.apple.security.application-groups': [appGroup]
                }
              },
              {
                targetName: IOS_TARGET_NCE_NAME,
                bundleIdentifier: `${bundleIdentifier}${IOS_NCE_PRODUCT_BUNDLE_ID_SUFFIX}`,
                entitlements: {
                  'com.apple.security.application-groups': [appGroup]
                }
              }
            ]
          }
        }
      }
    }
  };
}
