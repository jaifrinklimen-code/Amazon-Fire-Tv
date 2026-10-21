declare module 'react-native-pixel-perfect' {
  export function create(resolution: { width: number; height: number }): (size: number) => number;
}
