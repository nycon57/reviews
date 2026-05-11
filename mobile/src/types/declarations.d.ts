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
