export enum Screen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  BIBLE = 'BIBLE',
  COMMUNITY = 'COMMUNITY',
  ADMIN = 'ADMIN',
  PLAN_DETAIL = 'PLAN_DETAIL',
  PROGRESS = 'PROGRESS',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}

export interface NavProps {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
}