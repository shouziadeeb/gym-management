import 'react-native-gesture-handler';
import './global.css';
import { createElement } from 'react';
import { registerRootComponent } from 'expo';

import { ExpoRoot } from 'expo-router';

export function App() {
  const req = require as NodeRequire & {
    context: (path: string, deep?: boolean, filter?: RegExp) => unknown;
  };
  const ctx = req.context('./app');
  return createElement(ExpoRoot, { context: ctx as never });
}

registerRootComponent(App);
