// Type declarations for packages missing type definitions
// These should be removed once proper types are available via npm install

declare module '@react-native-picker/picker' {
  import * as React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  interface PickerItemProps {
    label: string;
    value: string;
    color?: string;
    enabled?: boolean;
  }

  interface PickerProps {
    selectedValue?: string;
    onValueChange?: (value: string, index: number) => void;
    style?: StyleProp<ViewStyle>;
    enabled?: boolean;
    mode?: 'dialog' | 'dropdown';
    prompt?: string;
    testID?: string;
    children?: React.ReactNode;
  }

  export class Picker extends React.Component<PickerProps> {
    static Item: React.ComponentClass<PickerItemProps>;
  }
}

declare module 'expo-av' {
  import * as React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export enum ResizeMode {
    CONTAIN = 'contain',
    COVER = 'cover',
    STRETCH = 'stretch',
  }

  export interface AVPlaybackStatus {
    isLoaded: boolean;
    isPlaying: boolean;
    positionMillis: number;
    durationMillis: number;
    didJustFinish: boolean;
    error?: string;
  }

  export interface VideoProps {
    source: { uri: string } | number;
    style?: StyleProp<ViewStyle>;
    resizeMode?: ResizeMode;
    useNativeControls?: boolean;
    shouldPlay?: boolean;
    isLooping?: boolean;
    isMuted?: boolean;
    volume?: number;
    rate?: number;
    onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
    onLoad?: (status: AVPlaybackStatus) => void;
    onError?: (error: string) => void;
  }

  export interface VideoRef {
    playAsync: () => Promise<AVPlaybackStatus>;
    pauseAsync: () => Promise<AVPlaybackStatus>;
    stopAsync: () => Promise<AVPlaybackStatus>;
    getStatusAsync: () => Promise<AVPlaybackStatus>;
    setPositionAsync: (positionMillis: number) => Promise<AVPlaybackStatus>;
    setRateAsync: (rate: number, shouldCorrectPitch?: boolean) => Promise<AVPlaybackStatus>;
  }

  export class Video extends React.Component<VideoProps> {
    playAsync(): Promise<AVPlaybackStatus>;
    pauseAsync(): Promise<AVPlaybackStatus>;
    stopAsync(): Promise<AVPlaybackStatus>;
    getStatusAsync(): Promise<AVPlaybackStatus>;
    setPositionAsync(positionMillis: number): Promise<AVPlaybackStatus>;
    setRateAsync(rate: number, shouldCorrectPitch?: boolean): Promise<AVPlaybackStatus>;
  }
}
