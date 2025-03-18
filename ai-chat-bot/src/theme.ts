import { DefaultTheme } from 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      hover: string;
      background: string;
      text: string;
      border: string;
    };
  }
}

export const theme: DefaultTheme = {
  colors: {
    primary: '#007bff',
    hover: '#e3f2fd',
    background: '#ffffff',
    text: '#333333',
    border: '#e0e0e0'
  }
}; 