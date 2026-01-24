/**
 * Icon Migration Map: Lucide → Phosphor
 *
 * Maps lucide-react icon names to their @phosphor-icons/react equivalents.
 * Phosphor icons use PascalCase naming convention.
 */

export const iconMigrationMap: Record<string, string> = {
  // Navigation & Arrows
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowUpDown: "ArrowsDownUp",
  ChevronDown: "CaretDown",
  ChevronUp: "CaretUp",
  ChevronLeft: "CaretLeft",
  ChevronRight: "CaretRight",
  ChevronDownIcon: "CaretDown",
  ChevronUpIcon: "CaretUp",
  ChevronLeftIcon: "CaretLeft",
  ChevronRightIcon: "CaretRight",
  ChevronsUpDown: "CaretUpDown",
  ExternalLink: "ArrowSquareOut",
  GripVertical: "DotsSixVertical",

  // Actions
  Check: "Check",
  CheckCircle: "CheckCircle",
  CheckCircle2: "CheckCircle",
  CheckSquare: "CheckSquare",
  CheckCheck: "Checks",
  X: "X",
  XCircle: "XCircle",
  Plus: "Plus",
  Minus: "Minus",
  Pencil: "Pencil",
  PencilLine: "PencilLine",
  Edit: "PencilSimple",
  Edit2: "PencilSimple",
  Edit3: "PencilSimple",
  FileEdit: "NotePencil",
  Trash2: "Trash",
  Copy: "Copy",
  Save: "FloppyDisk",
  Download: "DownloadSimple",
  Upload: "UploadSimple",
  Share2: "ShareNetwork",
  Send: "PaperPlaneRight",
  RefreshCw: "ArrowsClockwise",
  RefreshCcw: "ArrowCounterClockwise",
  RotateCcw: "ArrowCounterClockwise",
  Search: "MagnifyingGlass",
  Filter: "Funnel",
  ZoomIn: "MagnifyingGlassPlus",
  MoreHorizontal: "DotsThree",
  MoreVertical: "DotsThreeVertical",

  // UI Elements
  Menu: "List",
  Home: "House",
  Settings: "Gear",
  Settings2: "GearSix",
  Eye: "Eye",
  EyeOff: "EyeSlash",
  Lock: "Lock",
  Key: "Key",
  Shield: "Shield",
  ShieldCheck: "ShieldCheck",
  AlertCircle: "WarningCircle",
  AlertTriangle: "Warning",
  HelpCircle: "Question",
  Info: "Info",
  Ban: "Prohibit",
  Circle: "Circle",
  CircleDot: "RadioButton",
  LayoutDashboard: "SquaresFour",
  LayoutGrid: "GridFour",
  PanelLeft: "Sidebar",
  PanelLeftClose: "SidebarSimple",
  Type: "TextT",

  // People & Users
  User: "User",
  Users: "Users",
  UserPlus: "UserPlus",
  UserCheck: "UserCheck",
  UserX: "UserMinus",

  // Communication
  Mail: "Envelope",
  MailX: "EnvelopeSimple",
  MailCheck: "EnvelopeSimple",
  MessageSquare: "Chats",
  MessageCircle: "ChatCircle",
  Phone: "Phone",
  Inbox: "Tray",

  // Business & Organization
  Building: "Buildings",
  Building2: "BuildingOffice",
  Briefcase: "Briefcase",
  CreditCard: "CreditCard",

  // Content & Documents
  FileText: "FileText",
  FileX: "FileX",
  FileJson: "FileCode",
  FileCode2: "FileCode",
  FileSpreadsheet: "FileXls",
  FileBarChart: "ChartBar",
  Book: "Book",
  Quote: "Quotes",
  Rss: "RssSimple",
  Link2: "Link",
  Tag: "Tag",
  Tags: "Tag",

  // Media
  Video: "VideoCamera",
  Play: "Play",
  Pause: "Pause",
  StopCircle: "StopCircle",
  Volume2: "SpeakerHigh",
  VolumeX: "SpeakerSlash",
  ImageIcon: "Image",
  Monitor: "Monitor",
  Smartphone: "DeviceMobile",
  Tablet: "DeviceTablet",
  Maximize: "ArrowsOut",
  Printer: "Printer",
  Mic: "Microphone",
  Film: "FilmStrip",

  // Analytics & Charts
  BarChart3: "ChartBar",
  LineChart: "ChartLine",
  TrendingUp: "TrendUp",
  TrendingDown: "TrendDown",
  Activity: "Pulse",
  Target: "Target",
  MousePointerClick: "CursorClick",

  // Time & Calendar
  Calendar: "Calendar",
  CalendarIcon: "CalendarBlank",
  Clock: "Clock",

  // Status & Indicators
  Loader2: "SpinnerGap",
  Sparkles: "Sparkle",
  Star: "Star",
  Heart: "Heart",
  ThumbsUp: "ThumbsUp",
  Smile: "Smiley",
  SmilePlus: "SmileyWink",
  Frown: "SmileyMeh",
  Meh: "SmileyNervous",
  Flame: "Fire",

  // Achievements & Rewards
  Trophy: "Trophy",
  Medal: "Medal",
  Award: "Medal",
  Crown: "Crown",
  Gift: "Gift",
  PartyPopper: "Confetti",

  // Ideas & Concepts
  Lightbulb: "Lightbulb",
  Rocket: "Rocket",
  Zap: "Lightning",

  // Technical & Development
  Code: "Code",
  Code2: "CodeSimple",
  Webhook: "Plugs",
  Webhooks: "Plugs",
  Puzzle: "PuzzlePiece",
  TestTube: "TestTube",
  FlaskConical: "Flask",

  // Location & Maps
  Map: "MapTrifold",
  MapPin: "MapPin",
  Globe: "Globe",

  // Social Media
  Facebook: "FacebookLogo",
  Twitter: "TwitterLogo",
  Linkedin: "LinkedinLogo",

  // Education
  GraduationCap: "GraduationCap",
  ClipboardList: "ClipboardText",

  // Account
  LogOut: "SignOut",
  Palette: "Palette",
};

/**
 * Get the Phosphor icon name for a given Lucide icon name.
 * Returns the original name if no mapping exists (for debugging).
 */
export function getPhosphorIconName(lucideIconName: string): string {
  return iconMigrationMap[lucideIconName] || lucideIconName;
}
