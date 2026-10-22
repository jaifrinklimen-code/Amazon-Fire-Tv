import React, { useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import RemoteControlManager from './RemoteControlManager';
import { SupportedKeys } from './SupportedKeys';
import { useMenuContext } from '../../components/MenuContext';

export const GoBackConfiguration: React.FC = () => {
  const navigation = useNavigation();
  const { isOpen: isMenuOpen } = useMenuContext();

  const lastBackTime = React.useRef(0);

  const handleBackPress = useCallback(() => {
    const now = Date.now();
    if (now - lastBackTime.current < 400) {
      return;
    }
    lastBackTime.current = now;

    if (navigation.canGoBack()) {
      navigation.goBack();
      if (isMenuOpen) {
        console.log('Menu is open during back navigation');
      }
    }
  }, [navigation, isMenuOpen]);

  useEffect(() => {
    const remoteControlListener = (pressedKey: SupportedKeys) => {
      if (pressedKey === SupportedKeys.Back) {
        handleBackPress();
      }
    };

    RemoteControlManager.addKeydownListener(remoteControlListener);
    return () => RemoteControlManager.removeKeydownListener(remoteControlListener);
  }, [handleBackPress]);

  return null;
};
