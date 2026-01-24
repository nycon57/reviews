#!/usr/bin/env node
/**
 * Icon Migration Script: Lucide → Phosphor
 *
 * This script automatically migrates lucide-react imports to @phosphor-icons/react.
 * Run with: node scripts/migrate-icons.mjs
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon mapping from Lucide to Phosphor
const iconMap = {
  // Navigation & Arrows
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ChevronDown: "CaretDown",
  ChevronUp: "CaretUp",
  ChevronLeft: "CaretLeft",
  ChevronRight: "CaretRight",
  ChevronsUpDown: "CaretUpDown",
  ExternalLink: "ArrowSquareOut",

  // Actions
  Check: "Check",
  CheckCircle: "CheckCircle",
  CheckCircle2: "CheckCircle",
  CheckSquare: "CheckSquare",
  X: "X",
  XCircle: "XCircle",
  Plus: "Plus",
  Minus: "Minus",
  Pencil: "Pencil",
  Trash2: "Trash",
  Copy: "Copy",
  Save: "FloppyDisk",
  Download: "DownloadSimple",
  Upload: "UploadSimple",
  Share2: "ShareNetwork",
  Send: "PaperPlaneRight",
  RefreshCw: "ArrowsClockwise",
  Search: "MagnifyingGlass",
  Filter: "Funnel",
  ZoomIn: "MagnifyingGlassPlus",
  MoreHorizontal: "DotsThree",

  // UI Elements
  Menu: "List",
  Home: "House",
  Settings: "Gear",
  Eye: "Eye",
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
  FileSpreadsheet: "FileXls",
  FileBarChart: "ChartBar",
  Book: "Book",
  Quote: "Quotes",
  Rss: "RssSimple",
  Link2: "Link",
  Tag: "Tag",

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
  Maximize: "ArrowsOut",
  Printer: "Printer",

  // Analytics & Charts
  BarChart3: "ChartBar",
  TrendingUp: "TrendUp",
  TrendingDown: "TrendDown",
  Activity: "Activity",
  Target: "Target",

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
  Webhook: "Webhooks",
  Puzzle: "PuzzlePiece",
  TestTube: "TestTube",
  FlaskConical: "Flask",

  // Location & Maps
  Map: "Map",
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

// Special handling for type imports
const typeMap = {
  'LucideIcon': 'IconProps',
};

function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip if no lucide imports
  if (!content.includes('lucide-react')) {
    return false;
  }

  let newContent = content;

  // Handle wildcard imports: import * as LucideIcons from "lucide-react"
  if (content.includes('* as LucideIcons')) {
    newContent = newContent.replace(
      /import \* as LucideIcons from ["']lucide-react["'];?/g,
      `import * as PhosphorIcons from "@phosphor-icons/react";`
    );
    // Also update usage
    newContent = newContent.replace(/LucideIcons\[/g, 'PhosphorIcons[');
    newContent = newContent.replace(/LucideIcons\./g, 'PhosphorIcons.');
  }

  // Find all lucide import statements
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];?/g;

  newContent = newContent.replace(importRegex, (match, imports) => {
    const iconImports = imports.split(',').map(i => i.trim()).filter(Boolean);
    const mappedImports = [];

    for (const iconImport of iconImports) {
      // Handle "type LucideIcon" imports
      if (iconImport.startsWith('type ')) {
        const typeName = iconImport.replace('type ', '');
        if (typeMap[typeName]) {
          mappedImports.push(`type ${typeMap[typeName]}`);
        }
        continue;
      }

      // Handle aliased imports: Icon as Alias
      const aliasMatch = iconImport.match(/(\w+)\s+as\s+(\w+)/);
      if (aliasMatch) {
        const [, originalName, alias] = aliasMatch;
        const phosphorName = iconMap[originalName] || originalName;
        if (phosphorName !== alias) {
          mappedImports.push(`${phosphorName} as ${alias}`);
        } else {
          mappedImports.push(phosphorName);
        }
        continue;
      }

      // Handle regular imports
      const phosphorName = iconMap[iconImport];
      if (phosphorName) {
        if (phosphorName !== iconImport) {
          mappedImports.push(`${phosphorName} as ${iconImport}`);
        } else {
          mappedImports.push(phosphorName);
        }
      } else {
        // Keep original if no mapping (will cause error if icon doesn't exist)
        mappedImports.push(iconImport);
      }
    }

    if (mappedImports.length === 0) {
      return '';
    }

    // Format the import statement nicely
    const formattedImports = mappedImports.join(',\n  ');
    return `import {\n  ${formattedImports},\n} from "@phosphor-icons/react";`;
  });

  // Handle "type LucideIcon" references in the code
  newContent = newContent.replace(/: LucideIcon\b/g, ': React.ComponentType<IconProps>');
  newContent = newContent.replace(/\bLucideIcon\b(?!\s*from)/g, 'React.ComponentType<IconProps>');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

function findTsxFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...findTsxFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
const srcDir = path.join(path.dirname(__dirname), 'src');
const files = findTsxFiles(srcDir);

console.log(`Found ${files.length} TypeScript files to check...`);

let migratedCount = 0;
const migratedFiles = [];

for (const file of files) {
  if (migrateFile(file)) {
    migratedCount++;
    migratedFiles.push(file);
    console.log(`✓ Migrated: ${path.relative(path.dirname(__dirname), file)}`);
  }
}

console.log(`\nMigration complete: ${migratedCount} files updated.`);
