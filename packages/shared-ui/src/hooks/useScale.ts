// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Platform } from 'react-native';
import { create } from 'react-native-pixel-perfect';

const designResolution = {
  width: 1920,
  height: 1080,
};

const nativeScaled = create(designResolution);

// On Web, clamp or preserve pixel crispness so elements don't get blown up or shrunken excessively
export const scaledPixels = (size: number): number => {
  if (Platform.OS === 'web') {
    return size;
  }
  return nativeScaled(size);
};
