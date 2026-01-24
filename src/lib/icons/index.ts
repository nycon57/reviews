/**
 * Phosphor Icons - Centralized Icon System
 *
 * This file re-exports all icons used in the RepWell application.
 * Uses @phosphor-icons/react for 6 weight variants and brand-aligned duotone styling.
 *
 * Weight options: thin | light | regular | bold | fill | duotone
 *
 * Usage:
 * import { Star, Users, ChartBar } from "@/lib/icons";
 * <Star weight="duotone" size={24} />
 */

// Re-export icons with consistent naming
export {
  // Navigation & Arrows
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  CaretUpDown,
  ArrowSquareOut,

  // Actions
  Check,
  CheckCircle,
  CheckSquare,
  X,
  XCircle,
  Plus,
  Minus,
  Pencil,
  Trash,
  Copy,
  FloppyDisk,
  DownloadSimple,
  UploadSimple,
  ShareNetwork,
  PaperPlaneRight,
  ArrowsClockwise,
  MagnifyingGlass,
  Funnel,
  MagnifyingGlassPlus,
  DotsThree,

  // UI Elements
  List,
  House,
  Gear,
  Eye,
  Lock,
  Key,
  Shield,
  ShieldCheck,
  WarningCircle,
  Warning,
  Question,
  Info,
  Prohibit,
  Circle,

  // People & Users
  User,
  Users,
  UserPlus,
  UserCheck,
  UserMinus,

  // Communication
  Envelope,
  EnvelopeSimple,
  Chats,
  ChatCircle,
  Phone,
  Tray,

  // Business & Organization
  Buildings,
  BuildingOffice,
  Briefcase,
  CreditCard,

  // Content & Documents
  FileText,
  FileX,
  FileCode,
  FileXls,
  ChartBar,
  Book,
  Quotes,
  RssSimple,
  Link,
  Tag,

  // Media
  VideoCamera,
  Play,
  Pause,
  StopCircle,
  SpeakerHigh,
  SpeakerSlash,
  Image,
  Monitor,
  DeviceMobile,
  ArrowsOut,
  Printer,

  // Analytics & Charts
  TrendUp,
  TrendDown,
  Heartbeat,
  Target,

  // Time & Calendar
  Calendar,
  CalendarBlank,
  Clock,

  // Status & Indicators
  SpinnerGap,
  Sparkle,
  Star,
  Heart,
  ThumbsUp,
  Smiley,
  SmileyWink,
  SmileyMeh,
  SmileyNervous,
  Fire,

  // Achievements & Rewards
  Trophy,
  Medal,
  Crown,
  Gift,
  Confetti,

  // Ideas & Concepts
  Lightbulb,
  Rocket,
  Lightning,

  // Technical & Development
  Code,
  CodeSimple,
  Plugs,
  PuzzlePiece,
  TestTube,
  Flask,

  // Location & Maps
  MapTrifold,
  MapPin,
  Globe,

  // Social Media
  FacebookLogo,
  TwitterLogo,
  LinkedinLogo,

  // Education
  GraduationCap,
  ClipboardText,

  // Account
  SignOut,
  Palette,

  // Types
  type IconProps,
  type IconWeight,
} from "@phosphor-icons/react";

// Alias exports for backwards compatibility during migration
export {
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  ArrowSquareOut as ExternalLink,
  CheckCircle as CheckCircle2,
  Trash as Trash2,
  FloppyDisk as Save,
  DownloadSimple as Download,
  UploadSimple as Upload,
  ShareNetwork as Share2,
  PaperPlaneRight as Send,
  ArrowsClockwise as RefreshCw,
  MagnifyingGlass as Search,
  Funnel as Filter,
  MagnifyingGlassPlus as ZoomIn,
  DotsThree as MoreHorizontal,
  List as Menu,
  House as Home,
  Gear as Settings,
  WarningCircle as AlertCircle,
  Warning as AlertTriangle,
  Question as HelpCircle,
  Prohibit as Ban,
  UserMinus as UserX,
  Envelope as Mail,
  EnvelopeSimple as MailX,
  EnvelopeSimple as MailCheck,
  Chats as MessageSquare,
  ChatCircle as MessageCircle,
  Tray as Inbox,
  Buildings as Building,
  BuildingOffice as Building2,
  FileCode as FileJson,
  FileXls as FileSpreadsheet,
  ChartBar as FileBarChart,
  ChartBar as BarChart3,
  Quotes as Quote,
  RssSimple as Rss,
  Link as Link2,
  VideoCamera as Video,
  SpeakerHigh as Volume2,
  SpeakerSlash as VolumeX,
  Image as ImageIcon,
  DeviceMobile as Smartphone,
  ArrowsOut as Maximize,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Heartbeat as Activity,
  CalendarBlank as CalendarIcon,
  SpinnerGap as Loader2,
  Sparkle as Sparkles,
  SmileyWink as SmilePlus,
  SmileyMeh as Frown,
  SmileyNervous as Meh,
  Smiley as Smile,
  Fire as Flame,
  Medal as Award,
  Confetti as PartyPopper,
  Lightning as Zap,
  CodeSimple as Code2,
  Plugs as Webhook,
  PuzzlePiece as Puzzle,
  Flask as FlaskConical,
  SignOut as LogOut,
  ClipboardText as ClipboardList,
  FacebookLogo as Facebook,
  TwitterLogo as Twitter,
  LinkedinLogo as Linkedin,
  MapTrifold as Map,
} from "@phosphor-icons/react";
