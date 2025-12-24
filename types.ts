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
  PRAYER_WALL = 'PRAYER_WALL',
}

export interface NavProps {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
}

// --- Media Team Types ---

export interface Skill {
  name: string;
  level: number; // 0 to 100
}

export interface WorkItem {
  title: string;
  category: string;
  date?: string;
}

export interface MediaTeamMember {
  id: string;
  name: string;
  role: string;
  icon_name: string; // Stored as string in DB
  gradient_class: string;
  short_description?: string;
  email?: string;
  tags?: string[];
  is_leader: boolean;
  detailed_info: {
    longDescription?: string;
    quote?: string;
    vision?: string;
    skills?: Skill[];
    recentWork?: WorkItem[];
    stats?: {
      projects: number;
      impact: string;
    };
  };
  created_at?: string;
}