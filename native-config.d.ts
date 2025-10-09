declare module 'react-native-config' {
  export interface NativeConfig {
      HOSTNAME?: string;
  }
  
  export const Config: NativeConfig
  export default Config
}