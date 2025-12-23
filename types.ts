export enum Screen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  BIBLE = 'BIBLE',
  COMMUNITY = 'COMMUNITY',
  ADMIN = 'ADMIN',
  PLAN_DETAIL = 'PLAN_DETAIL',
  PLAN_LIST = 'PLAN_LIST',
  PROGRESS = 'PROGRESS',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS',
  SECURITY = 'SECURITY',
  PRIVACY = 'PRIVACY',
  HELP = 'HELP',
  READING_SCHEDULE = 'READING_SCHEDULE',
  MEDIA_TEAM = 'MEDIA_TEAM',
}

export interface NavProps {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
}