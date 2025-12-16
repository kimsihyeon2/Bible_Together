export enum Screen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PLAN_DETAIL = 'PLAN_DETAIL',
  PROGRESS = 'PROGRESS',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}

export interface NavProps {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
}