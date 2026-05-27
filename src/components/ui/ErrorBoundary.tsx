import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { layout, text } from '@/theme/classes';

type Props = {
  children: ReactNode;
  /** Optional screen title shown in the fallback UI. */
  title?: string;
};

type State = {
  error: Error | null;
};

/** Catches render errors so release builds show a recovery screen instead of exiting. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary', error, info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View className={`flex-1 items-center justify-center px-6 ${layout.center}`}>
        <Text className={`mb-2 text-center ${text.screenTitleMd}`}>{this.props.title ?? 'Something went wrong'}</Text>
        <Text className={`mb-6 text-center ${text.caption}`}>
          {__DEV__ ? this.state.error.message : 'Please try again. If this keeps happening, restart the app.'}
        </Text>
        <Button title="Try again" onPress={this.handleRetry} fullWidth={false} />
      </View>
    );
  }
}
