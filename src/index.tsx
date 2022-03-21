import React from 'react';
import { Animated, View, ViewProps, ImageProps, Image } from 'react-native';
import { version } from 'react-native/package.json';
import { Freeze } from 'react-freeze';
import {
  ScreenProps,
  ScreenContainerProps,
  ScreenStackProps,
  ScreenStackHeaderConfigProps,
  HeaderSubviewTypes,
  SearchBarProps,
} from './types';

export * from './types';
export { default as useTransitionProgress } from './useTransitionProgress';
export {
  isSearchBarAvailableForCurrentPlatform,
  executeNativeBackPress,
} from './utils';

let ENABLE_SCREENS = true;

export function enableScreens(shouldEnableScreens = true): void {
  ENABLE_SCREENS = shouldEnableScreens;
}

export function screensEnabled(): boolean {
  return ENABLE_SCREENS;
}

let ENABLE_FREEZE = false;

// @ts-ignore function stub, freezing logic is located in index.native.tsx
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function enableFreeze(shouldEnableReactFreeze = true): void {
  const minor = parseInt(version.split('.')[1]); // eg. takes 66 from '0.66.0'

  // react-freeze requires react-native >=0.64, react-native from main is 0.0.0
  if (!(minor === 0 || minor >= 64) && shouldEnableReactFreeze) {
    console.warn(
      'react-freeze library requires at least react-native 0.64. Please upgrade your react-native version in order to use this feature.'
    );
  }

  ENABLE_FREEZE = shouldEnableReactFreeze;
}

export function freezeEnabled(): boolean {
  return ENABLE_FREEZE;
}

interface FreezeWrapperProps {
  freeze: boolean;
  children: React.ReactNode;
}

// This component allows one more render before freezing the screen.
// Allows activityState to reach the native side and useIsFocused to work correctly.
function DelayedFreeze({ freeze, children }: FreezeWrapperProps) {
  // flag used for determining whether freeze should be enabled
  const [freezeState, setFreezeState] = React.useState(false);

  if (freeze !== freezeState) {
    // setImmediate is executed at the end of the JS execution block.
    // Used here for changing the state right after the render.
    setImmediate(() => {
      setFreezeState(freeze);
    });
  }

  return <Freeze freeze={freeze ? freezeState : false}>{children}</Freeze>;
}

function MaybeFreeze({ freeze, children }: FreezeWrapperProps) {
  if (ENABLE_FREEZE) {
    return <DelayedFreeze freeze={freeze}>{children}</DelayedFreeze>;
  } else {
    return <>{children}</>;
  }
}

export class ScreenStack extends React.Component<ScreenStackProps> {
  render(): JSX.Element {
    if (ENABLE_FREEZE) {
      const { children, ...rest } = this.props;
      const size = React.Children.count(children);
      // freezes all screens except the top one
      const childrenWithFreeze = React.Children.map(
        children,
        (child, index) => (
          <DelayedFreeze freeze={size - index > 1}>{child}</DelayedFreeze>
        )
      );
      return <View {...rest}>{childrenWithFreeze}</View>;
    }
    return <View {...this.props} />;
  }
}

export class NativeScreen extends React.Component<ScreenProps> {
  render(): JSX.Element {
    let {
      active,
      activityState,
      style,
      enabled = ENABLE_SCREENS,
      ...rest
    } = this.props;

    if (enabled) {
      if (active !== undefined && activityState === undefined) {
        activityState = active !== 0 ? 2 : 0; // change taken from index.native.tsx
      }
      return (
        <MaybeFreeze freeze={activityState === 0}>
          <View
            // @ts-expect-error: hidden exists on web, but not in React Native
            hidden={activityState === 0}
            style={[style, { display: activityState !== 0 ? 'flex' : 'none' }]}
            {...rest}
          />
        </MaybeFreeze>
      );
    }

    return <View {...rest} />;
  }
}

export const Screen = Animated.createAnimatedComponent(NativeScreen);

export const ScreenContext = React.createContext(Screen);

export const ScreenContainer: React.ComponentType<ScreenContainerProps> = View;

export const NativeScreenContainer: React.ComponentType<ScreenContainerProps> = View;

export const NativeScreenNavigationContainer: React.ComponentType<ScreenContainerProps> = View;

export const FullWindowOverlay = View;

export const ScreenStackHeaderBackButtonImage = (
  props: ImageProps
): JSX.Element => (
  <View>
    <Image resizeMode="center" fadeDuration={0} {...props} />
  </View>
);

export const ScreenStackHeaderRightView = (
  props: React.PropsWithChildren<ViewProps>
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderLeftView = (
  props: React.PropsWithChildren<ViewProps>
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderCenterView = (
  props: React.PropsWithChildren<ViewProps>
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderSearchBarView = (
  props: React.PropsWithChildren<SearchBarProps>
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderConfig: React.ComponentType<ScreenStackHeaderConfigProps> = View;

// @ts-expect-error: search bar props have no common props with View
export const SearchBar: React.ComponentType<SearchBarProps> = View;

export const ScreenStackHeaderSubview: React.ComponentType<React.PropsWithChildren<
  ViewProps & { type?: HeaderSubviewTypes }
>> = View;

export const shouldUseActivityState = true;
