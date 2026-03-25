import {
  Building2,
  GitBranch,
  Users,
  Calculator,
  FileText,
  FolderOpen,
  Shield,
  Leaf,
  FileCheck,
  Briefcase,
  BookOpen,
} from 'lucide-react'

// Folder names in Google Drive that map to each category
// These are matched case-insensitively against subfolder names in the root Drive folder
export const CATEGORIES = [
  {
    id: 1,
    name: 'Company Document',
    description: 'Company policies, org documents',
    icon: Building2,
    color: 'bg-blue-500',
    slug: 'company-document',
    folderNames: ['company document', 'company documents', 'company doc', 'เอกสารบริษัท'],
  },
  {
    id: 2,
    name: 'Workflow',
    description: 'Process maps, step-by-step procedures',
    icon: GitBranch,
    color: 'bg-purple-500',
    slug: 'workflow',
    folderNames: ['workflow', 'workflows', 'ขั้นตอนการทำงาน'],
  },
  {
    id: 3,
    name: 'HR',
    description: 'Contracts, leave policies, HR documents',
    icon: Users,
    color: 'bg-pink-500',
    slug: 'hr',
    folderNames: ['hr', 'human resource', 'human resources', 'ทรัพยากรบุคคล'],
  },
  {
    id: 4,
    name: 'Accounting',
    description: 'Invoices, financial reports',
    icon: Calculator,
    color: 'bg-green-500',
    slug: 'accounting',
    folderNames: ['accounting', 'finance', 'บัญชี', 'การเงิน'],
  },
  {
    id: 5,
    name: 'Master Template for AE',
    description: 'All AE work templates',
    icon: FileText,
    color: 'bg-orange-500',
    slug: 'master-template-ae',
    folderNames: ['master template for ae', 'master template', 'ae template', 'template ae'],
  },
  {
    id: 6,
    name: 'HuaHedHub',
    description: 'Documents for this project',
    icon: FolderOpen,
    color: 'bg-indigo-500',
    slug: 'huahedhub',
    folderNames: ['huahedhub', 'huahed hub'],
  },
  {
    id: 7,
    name: 'Procandid',
    description: 'Procandid files and documents',
    icon: Shield,
    color: 'bg-cyan-500',
    slug: 'procandid',
    folderNames: ['procandid'],
  },
  {
    id: 8,
    name: 'Allerguard',
    description: 'Allerguard files and documents',
    icon: Leaf,
    color: 'bg-emerald-500',
    slug: 'allerguard',
    folderNames: ['allerguard'],
  },
  {
    id: 9,
    name: 'TOR',
    description: 'TOR files, government procurement',
    icon: FileCheck,
    color: 'bg-red-500',
    slug: 'tor',
    folderNames: ['tor'],
  },
  {
    id: 10,
    name: 'ไฟล์บรีฟงาน',
    description: 'Project briefs',
    icon: Briefcase,
    color: 'bg-amber-500',
    slug: 'briefs',
    folderNames: ['ไฟล์บรีฟงาน', 'บรีฟงาน', 'brief', 'briefs', 'project brief'],
  },
  {
    id: 11,
    name: 'ความรู้ทั่วไป',
    description: 'Articles, knowledge, references',
    icon: BookOpen,
    color: 'bg-teal-500',
    slug: 'knowledge',
    folderNames: ['ความรู้ทั่วไป', 'knowledge', 'general knowledge'],
  },
]

// Match a Drive folder name to a category ID
export function matchFolderToCategory(folderName) {
  const lower = folderName.toLowerCase().trim()
  for (const cat of CATEGORIES) {
    if (cat.folderNames.some((n) => lower.includes(n) || n.includes(lower))) {
      return cat.id
    }
  }
  return null
}

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id)
}
