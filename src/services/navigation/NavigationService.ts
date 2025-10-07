import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params: RootStackParamList[RouteName]
) {
    if (navigationRef.isReady()) {
        // Use the correct tuple signature for navigate
        (navigationRef as any).navigate(name, params);
    }
}
