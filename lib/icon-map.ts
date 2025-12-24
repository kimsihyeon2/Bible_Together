import {
    Users, Layout, PenTool, Video, Share2,
    Crown, Mail, ChevronRight, ExternalLink,
    Sparkles, MessageSquare, Heart, X, CheckCircle2,
    TrendingUp, Award, Zap, LucideIcon
} from 'lucide-react';

export const IconMap: Record<string, LucideIcon> = {
    'Users': Users,
    'Layout': Layout,
    'PenTool': PenTool,
    'Video': Video,
    'Share2': Share2,
    'Crown': Crown, // Leader icon
    'Mail': Mail,
    'ChevronRight': ChevronRight,
    'ExternalLink': ExternalLink,
    'Sparkles': Sparkles,
    'MessageSquare': MessageSquare,
    'Heart': Heart,
    'X': X,
    'CheckCircle2': CheckCircle2,
    'TrendingUp': TrendingUp,
    'Award': Award,
    'Zap': Zap,
};

export const getIcon = (name: string): LucideIcon => {
    return IconMap[name] || Users; // Default to Users if not found
};
