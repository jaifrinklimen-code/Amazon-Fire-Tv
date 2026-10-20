import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleProp, Platform } from 'react-native';

interface PlatformLinearGradientProps {
  colors: string[];
  style?: StyleProp<ViewStyle>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  children?: ReactNode;
}

const PlatformLinearGradient: React.FC<PlatformLinearGradientProps> = ({
  colors,
  style,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  children,
}) => {
  if (Platform.OS === 'web') {
    // Generate valid CSS linear gradient from start/end points
    const angleDeg = Math.round(
      (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI + 90
    );
    const gradientCss = `linear-gradient(${angleDeg}deg, ${colors.join(', ')})`;
    return (
      <View
        style={[
          style as any,
          {
            backgroundImage: gradientCss,
          } as any,
        ]}
      >
        {children}
      </View>
    );
  }

  // Non-web fallback (React Native native / TV)
  return (
    <View
      style={[
        style as StyleProp<ViewStyle>,
        { backgroundColor: 'transparent' },
      ]}
    >
      {children}
    </View>
  );
};

export default PlatformLinearGradient;
