/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Newspaper, 
  Zap, 
  Bot, 
  Library, 
  FileText, 
  Scale, 
  Calculator, 
  Calendar, 
  Search, 
  BarChart, 
  Settings, 
  Bell, 
  User, 
  Download, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Plus,
  Send,
  FileCode,
  Globe,
  ShieldCheck,
  TrendingUp,
  MoreHorizontal,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Info,
  MessageSquare,
  Eye,
  Users,
  Filter,
  Briefcase,
  Edit3,
  Clock,
  ArrowRight,
  Trash2,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Link,
  Mail,
  Lock as LockIcon,
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL_NAME = "gemini-3-flash-preview";

// --- Share Component ---

const ShareButton = ({ title, url, className }: { title: string, url?: string, className?: string }) => {
  const shareUrl = url || window.location.href;
  
  const handleShare = (platform: string) => {
    let link = '';
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'twitter':
        link = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        link = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'facebook':
        link = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        // We could add a toast here if available
        return;
    }
    if (link) window.open(link, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-slate-400 hover:text-blue-600", className)}>
            <Share2 className="w-4 h-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare('twitter')} className="gap-2">
          <Twitter className="w-4 h-4 text-sky-500" />
          <span>Partager sur Twitter</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')} className="gap-2">
          <Linkedin className="w-4 h-4 text-blue-700" />
          <span>Partager sur LinkedIn</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('facebook')} className="gap-2">
          <Facebook className="w-4 h-4 text-blue-600" />
          <span>Partager sur Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')} className="gap-2">
          <Link className="w-4 h-4 text-slate-500" />
          <span>Copier le lien</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Types ---

interface Deadline {
  day: number | 'last';
  title: string;
  type: string;
  isMonthly?: boolean;
  month?: number;
  description: string;
}

interface ProcessedDeadline extends Deadline {
  day: number;
  monthIdx: number;
  date: string;
  isUrgent: boolean;
  fullDate: Date;
}

// --- Fiscal Utilities ---

const HOLIDAYS_2026 = [
  "2026-01-01", // New Year
  "2026-01-11", // Manifesto of Independence
  "2026-01-14", // Amazigh New Year
  "2026-03-20", // Eid al-Fitr (approx)
  "2026-03-21", // Eid al-Fitr (approx)
  "2026-05-01", // Labour Day
  "2026-05-27", // Eid al-Adha (approx)
  "2026-05-28", // Eid al-Adha (approx)
  "2026-06-16", // Islamic New Year (approx)
  "2026-07-30", // Throne Day
  "2026-08-14", // Oued Ed-Dahab
  "2026-08-20", // Revolution of the King and the People
  "2026-08-21", // Youth Day
  "2026-08-25", // Mawlid (approx)
  "2026-08-26", // Mawlid (approx)
  "2026-11-06", // Green March
  "2026-11-18", // Independence Day
];

const isHoliday = (date: Date) => {
  const dateString = date.toISOString().split('T')[0];
  return HOLIDAYS_2026.includes(dateString);
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

const getNextBusinessDay = (date: Date) => {
  let current = new Date(date);
  while (isWeekend(current) || isHoliday(current)) {
    current.setDate(current.getDate() + 1);
  }
  return current;
};

const getLastDayOfMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0);
};

const ALL_DEADLINES: Deadline[] = [
  // Mensuel
  { day: 'last', title: "Déclaration & Paiement TVA", type: "Mensuel", isMonthly: true, description: "La déclaration de la TVA doit être effectuée mensuellement pour les entreprises dont le chiffre d'affaires taxable est supérieur à 1 million de dirhams." },
  { day: 'last', title: "Déclaration IR (Salaires)", type: "Mensuel", isMonthly: true, description: "Versement de l'impôt sur le revenu retenu à la source sur les salaires payés au cours du mois précédent." },
  
  // Trimestriel
  { day: 'last', title: "Versement IS (1er Acompte)", type: "Trimestriel", month: 2, description: "Premier acompte provisionnel de l'Impôt sur les Sociétés au titre de l'exercice en cours." },
  { day: 'last', title: "Versement IS (2ème Acompte)", type: "Trimestriel", month: 5, description: "Deuxième acompte provisionnel de l'Impôt sur les Sociétés." },
  { day: 'last', title: "Versement IS (3ème Acompte)", type: "Trimestriel", month: 8, description: "Troisième acompte provisionnel de l'Impôt sur les Sociétés." },
  { day: 'last', title: "Versement IS (4ème Acompte)", type: "Trimestriel", month: 11, description: "Quatrième et dernier acompte provisionnel de l'Impôt sur les Sociétés." },
  
  // Annuel
  { day: 'last', title: "Déclaration Revenus Fonciers", type: "Annuel", month: 1, description: "Déclaration annuelle des revenus fonciers encaissés au cours de l'année précédente." },
  { day: 'last', title: "Déclaration Annuelle IS", type: "Annuel", month: 2, description: "Dépôt de la liasse fiscale et déclaration du résultat fiscal pour les sociétés clôturant au 31 décembre." },
  { day: 'last', title: "Taxe Professionnelle & TSC", type: "Annuel", month: 2, description: "Paiement de la Taxe Professionnelle et de la Taxe de Services Communaux." },
  { day: 'last', title: "Déclaration Revenus Professionnels (IR)", type: "Annuel", month: 3, description: "Déclaration annuelle du revenu global pour les personnes physiques soumises à l'IR professionnel." },
  { day: 'last', title: "Taxe de Services Communaux", type: "Annuel", month: 5, description: "Date limite de paiement sans pénalités pour la TSC." },
];

const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const processDeadline = (d: Deadline, m: number, currentYear: number, today: Date): ProcessedDeadline => {
  let targetDate;
  if (d.day === 'last') {
    targetDate = getLastDayOfMonth(currentYear, m);
  } else {
    targetDate = new Date(currentYear, m, d.day as number);
  }
  
  const adjustedDate = getNextBusinessDay(targetDate);
  
  return {
    ...d,
    day: adjustedDate.getDate(),
    monthIdx: adjustedDate.getMonth(),
    date: `${adjustedDate.getDate()} ${months[adjustedDate.getMonth()]}`,
    isUrgent: adjustedDate.getTime() - today.getTime() < 5 * 24 * 60 * 60 * 1000 && adjustedDate.getTime() >= today.getTime(),
    fullDate: adjustedDate
  };
};

interface Document {
  id: string;
  title: string;
  type: string;
  size: string;
  year: number;
  description: string;
  isOfficial: boolean;
  hasAI: boolean;
  url: string; // Added URL for real PDF download
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Answer {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
}

interface Expert {
  id: string;
  name: string;
  title: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
}

interface Question {
  id: string;
  author: string;
  title: string;
  content: string;
  date: string;
  timestamp: number; // For date filtering
  category: string;
  regime: string; // Added regime
  answers: Answer[];
  views: number;
}

// --- Mock Data ---

const EXPERTS: Expert[] = [
  {
    id: '1',
    name: 'Dr. Amine El Fassi',
    title: 'Expert-Comptable DPLE',
    specialty: 'Fiscalité des Groupes & IS',
    location: 'Casablanca',
    rating: 4.9,
    reviews: 124,
    image: 'https://picsum.photos/seed/expert1/200/200'
  },
  {
    id: '2',
    name: 'Mme. Salma Bennani',
    title: 'Conseiller Fiscal',
    specialty: 'TVA & Fiscalité Immobilière',
    location: 'Rabat',
    rating: 4.8,
    reviews: 89,
    image: 'https://picsum.photos/seed/expert2/200/200'
  },
  {
    id: '3',
    name: 'M. Karim Tazi',
    title: 'Avocat Fiscaliste',
    specialty: 'Contentieux & Contrôle Fiscal',
    location: 'Tanger',
    rating: 4.7,
    reviews: 56,
    image: 'https://picsum.photos/seed/expert3/200/200'
  }
];

const DOCUMENTS: Document[] = [
  {
    id: '1',
    title: 'CGI 2024 — TVA services numériques',
    type: 'CGI',
    size: '11.2 MB',
    year: 2024,
    description: 'Modifications TVA numériques et convergence IS.',
    isOfficial: true,
    hasAI: true,
    url: '/documents/CGI_2024_FR.pdf'
  },
  {
    id: '2',
    title: 'Note Circulaire n°717 — LF 2024',
    type: 'CIRCULAIRE',
    size: '5.2 MB',
    year: 2024,
    description: 'Application dispositions fiscales 2024.',
    isOfficial: true,
    hasAI: true,
    url: '/documents/NC_717_LF_2024.pdf'
  },
  {
    id: '3',
    title: 'Code Général des Impôts — Édition 2025',
    type: 'CGI',
    size: '11.8 MB',
    year: 2025,
    description: 'Version consolidée LF 2025.',
    isOfficial: true,
    hasAI: true,
    url: '/documents/CGI_2025_FR.pdf'
  },
  {
    id: '4',
    title: 'Note Circulaire n°738 — LF 2025',
    type: 'CIRCULAIRE',
    size: '3.9 MB',
    year: 2025,
    description: 'Modifications IS, IR, TVA.',
    isOfficial: true,
    hasAI: true,
    url: '/documents/NC_738_LF_2025.pdf'
  },
  {
    id: '5',
    title: 'Code Général des Impôts — Édition 2026',
    type: 'CGI',
    size: '12.4 MB',
    year: 2026,
    description: 'Version consolidée incluant les modifications de la LF 2026. 850 articles.',
    isOfficial: true,
    hasAI: true,
    url: '/documents/CGI_2026_FR.pdf'
  }
];

// --- Components ---

const CommunityView = () => {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      author: 'Yassine M.',
      title: 'Traitement fiscal des indemnités de licenciement en 2026',
      content: 'Bonjour, j\'aimerais savoir si le plafond d\'exonération des indemnités de licenciement a changé avec la LF 2026. Merci.',
      date: 'Il y a 2 heures',
      timestamp: Date.now() - 7200000,
      category: 'IR',
      regime: 'Salarié',
      views: 124,
      answers: [
        { id: 'a1', author: 'Expert Fiscal', content: 'Le plafond reste inchangé à 1.000.000 MAD pour l\'exonération totale, mais les tranches supérieures sont désormais soumises au nouveau barème de l\'IR.', date: 'Il y a 1 heure', likes: 12 }
      ]
    },
    {
      id: '2',
      author: 'Sanaa K.',
      title: 'TVA sur les services de consulting exportés',
      content: 'Est-ce que les services de conseil fournis à une entreprise basée en France sont toujours exonérés de TVA avec droit à déduction ?',
      date: 'Il y a 5 heures',
      timestamp: Date.now() - 18000000,
      category: 'TVA',
      regime: 'RNR',
      views: 89,
      answers: []
    }
  ]);

  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', category: 'Général', regime: 'Général' });
  const [isPosting, setIsPosting] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: 'Tous',
    regime: 'Tous',
    date: 'Tous'
  });

  const handlePostQuestion = () => {
    if (!newQuestion.title || !newQuestion.content) return;
    const q: Question = {
      id: Date.now().toString(),
      author: 'Utilisateur',
      title: newQuestion.title,
      content: newQuestion.content,
      date: 'À l\'instant',
      timestamp: Date.now(),
      category: newQuestion.category,
      regime: newQuestion.regime,
      views: 0,
      answers: []
    };
    setQuestions([q, ...questions]);
    setNewQuestion({ title: '', content: '', category: 'Général', regime: 'Général' });
    setIsPosting(false);
  };

  const filteredQuestions = questions.filter(q => {
    const matchCategory = filters.category === 'Tous' || q.category === filters.category;
    const matchRegime = filters.regime === 'Tous' || q.regime === filters.regime;
    
    let matchDate = true;
    if (filters.date === 'Aujourd\'hui') {
      matchDate = Date.now() - q.timestamp < 86400000;
    } else if (filters.date === 'Cette semaine') {
      matchDate = Date.now() - q.timestamp < 604800000;
    }
    
    return matchCategory && matchRegime && matchDate;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Communauté Fiscale</h2>
          <p className="text-sm text-slate-500">Posez vos questions et partagez votre expertise avec d'autres professionnels.</p>
        </div>
        <Dialog open={isPosting} onOpenChange={setIsPosting}>
          <DialogTrigger render={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-100">
              <Plus className="w-4 h-4" />
              Poser une question
            </Button>
          } />
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nouvelle Question</DialogTitle>
              <DialogDescription>Décrivez votre problématique fiscale pour obtenir l'aide de la communauté.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Titre de la question</label>
                <Input 
                  placeholder="Ex: Calcul de la cotisation minimale" 
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Impôt / Catégorie</label>
                  <select 
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                  >
                    <option>Général</option>
                    <option>IS</option>
                    <option>IR</option>
                    <option>TVA</option>
                    <option>Droits d'enregistrement</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Régime</label>
                  <select 
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={newQuestion.regime}
                    onChange={(e) => setNewQuestion({...newQuestion, regime: e.target.value})}
                  >
                    <option>Général</option>
                    <option>RNR</option>
                    <option>RNS</option>
                    <option>CPU</option>
                    <option>Auto-entrepreneur</option>
                    <option>Salarié</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Détails</label>
                <textarea 
                  className="w-full min-h-[150px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Expliquez votre situation en détail..."
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPosting(false)}>Annuler</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handlePostQuestion}>Publier la question</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3 h-3" /> Impôt
              </label>
              <select 
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option>Tous</option>
                <option>IS</option>
                <option>IR</option>
                <option>TVA</option>
                <option>Droits d'enregistrement</option>
                <option>Général</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Régime
              </label>
              <select 
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                value={filters.regime}
                onChange={(e) => setFilters({...filters, regime: e.target.value})}
              >
                <option>Tous</option>
                <option>RNR</option>
                <option>RNS</option>
                <option>CPU</option>
                <option>Auto-entrepreneur</option>
                <option>Salarié</option>
                <option>Général</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <select 
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
              >
                <option>Tous</option>
                <option>Aujourd'hui</option>
                <option>Cette semaine</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredQuestions.length > 0 ? filteredQuestions.map((q) => (
          <Card key={q.id} className="border-slate-200 hover:border-blue-300 transition-all cursor-pointer group shadow-sm hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none text-[10px] uppercase tracking-wider font-bold">{q.category}</Badge>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-500 border-slate-200">{q.regime}</Badge>
                    <span className="text-[10px] text-slate-400 font-bold ml-auto sm:ml-0">{q.date} • Par {q.author}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{q.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{q.content}</p>
                  
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-medium">{q.answers.length} réponses</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">{q.views} vues</span>
                    </div>
                    <ShareButton title={q.title} className="ml-auto" />
                  </div>
                </div>
                {q.answers.length > 0 && (
                  <div className="hidden sm:flex flex-col items-center justify-center px-4 py-2 bg-green-50 rounded-xl border border-green-100 shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-[10px] font-bold text-green-700 uppercase mt-1">Résolu</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Aucune question trouvée</h3>
            <p className="text-sm text-slate-500">Essayez de modifier vos filtres ou posez une nouvelle question.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setFilters({ category: 'Tous', regime: 'Tous', date: 'Tous' })}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardView = ({ onNavigate, urgentDeadlines }: { onNavigate: (tab: string, filter?: string) => void, urgentDeadlines: ProcessedDeadline[] }) => {
  const data = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600 text-white border-none shadow-lg shadow-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Total Documents</CardTitle>
            <div className="text-3xl font-bold">1,284</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <TrendingUp className="w-3 h-3" />
              <span>+12% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Consultations IA</CardTitle>
            <div className="text-3xl font-bold text-slate-900">452</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+5.4% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Alertes Fiscales</CardTitle>
            <div className="text-3xl font-bold text-slate-900">{urgentDeadlines.length + 9}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-red-500">
              <Bell className="w-3 h-3" />
              <span>{urgentDeadlines.length} critiques à traiter</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b py-4">
            <CardTitle className="text-lg">Évolution des Consultations IA</CardTitle>
            <Button variant="ghost" size="sm" className="text-slate-400"><MoreHorizontal className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Bot className="w-20 h-20" />
            </div>
            <CardHeader>
              <CardTitle className="text-base">Insight IA du Jour</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-100 leading-relaxed">
                "Le nouveau barème de l'IR 2026 favorise les classes moyennes. Pensez à ajuster vos déclarations de salaires dès Janvier."
              </p>
              <Button variant="secondary" className="mt-4 w-full bg-white text-blue-600 hover:bg-blue-50 border-none">
                Voir l'analyse complète
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Alertes Critiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {urgentDeadlines.length > 0 ? urgentDeadlines.map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-slate-700">{alert.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{alert.date}</span>
                    <ShareButton title={alert.title} />
                  </div>
                </div>
              )) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500">Aucune alerte critique pour le moment.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recommandations Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: "Audit IS", type: "Optimisation" },
                { title: "Veille TVA", type: "Conformité" },
                { title: "Plan Epargne", type: "Économie" },
                { title: "Digitalisation", type: "Alerte" }
              ].map((rec, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <span 
                    className="text-sm text-slate-600 group-hover:text-blue-600 transition-colors flex-1"
                    onClick={() => onNavigate('recommendations', rec.type)}
                  >
                    {rec.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{rec.type}</Badge>
                    <ShareButton title={rec.title} />
                  </div>
                </div>
              ))}
              <Button 
                variant="link" 
                className="w-full text-xs text-blue-600 p-0 h-auto mt-2"
                onClick={() => onNavigate('recommendations')}
              >
                Voir tout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const IRSimulatorView = () => {
  const [salary, setSalary] = useState<string>('');
  const [result, setResult] = useState<{
    brut: number,
    cnss: number,
    amo: number,
    frais: number,
    netImposable: number,
    ir: number,
    net: number
  } | null>(null);

  const calculateIR = () => {
    const s = parseFloat(salary);
    if (isNaN(s)) return;
    
    // Moroccan IR simulation 2026 (Simplified)
    // CNSS: 4.48% capped at 6000 MAD salary (max 268.80)
    const cnss = Math.min(s, 6000) * 0.0448;
    // AMO: 2.26% uncapped
    const amo = s * 0.0226;
    // Professional expenses: 25% capped at 2500 MAD/month (LF 2026)
    const frais = Math.min(s * 0.25, 2500);
    
    const netImposable = s - cnss - amo - frais;
    
    let ir = 0;
    if (netImposable <= 2500) ir = 0;
    else if (netImposable <= 4166) ir = (netImposable * 0.10) - 250;
    else if (netImposable <= 5000) ir = (netImposable * 0.20) - 666.67;
    else if (netImposable <= 6666) ir = (netImposable * 0.30) - 1166.67;
    else if (netImposable <= 15000) ir = (netImposable * 0.34) - 1433.33;
    else ir = (netImposable * 0.38) - 2033.33;

    const net = s - cnss - amo - ir;

    setResult({
      brut: s,
      cnss,
      amo,
      frais,
      netImposable,
      ir: Math.max(0, ir),
      net
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Simulateur IR Maroc 2026</h2>
        <p className="text-sm text-slate-500">Calculez votre salaire net et votre impôt selon les barèmes de la LF 2026.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-lg h-fit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Paramètres</CardTitle>
            <ShareButton title="Simulateur IR Maroc 2026" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Salaire Mensuel Brut (MAD)</label>
              <Input 
                type="number" 
                placeholder="Ex: 10000" 
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
            <Button onClick={calculateIR} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg">
              Calculer
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Card className="border-blue-100 bg-blue-50/30">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                    <span className="text-sm text-slate-600">Salaire Brut</span>
                    <span className="font-bold text-slate-900">{result.brut.toLocaleString('fr-FR')} MAD</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>CNSS (4.48%)</span>
                      <span>- {result.cnss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>AMO (2.26%)</span>
                      <span>- {result.amo.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Frais Professionnels (25%)</span>
                      <span>- {result.frais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-blue-100">
                    <span className="text-sm font-bold text-blue-600">Impôt sur le Revenu (IR)</span>
                    <span className="text-xl font-black text-red-600">{result.ir.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                  </div>
                  <div className="mt-6 p-6 bg-blue-600 text-white rounded-2xl text-center shadow-xl shadow-blue-100">
                    <p className="text-xs font-medium opacity-80 uppercase tracking-widest">Salaire Net à Percevoir</p>
                    <div className="text-4xl font-black mt-2">
                      {result.net.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xl">MAD</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <p className="text-[10px] text-slate-400 italic text-center">Note: Simulation basée sur un célibataire sans enfants. Les déductions pour charges de famille ne sont pas incluses.</p>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <Calculator className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Entrez votre salaire pour voir le détail du calcul</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NewsView = ({ news, onRefresh, isLoading }: { news: any[], onRefresh: (type: 'news') => void, isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Chargement des actualités...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-600" />
          Revue de Presse Fiscale
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onRefresh('news')}
          disabled={isLoading}
          className="h-8 gap-2 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
        >
          <Zap className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
          {isLoading ? 'Mise à jour...' : 'Actualiser'}
        </Button>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Aucune actualité trouvée</h3>
          <p className="text-sm text-slate-500 mb-6">La revue de presse est actuellement vide.</p>
          <Button 
            onClick={() => onRefresh('news')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Zap className="w-4 h-4" />
            Générer les actualités
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {news.map((item, i) => (
            <a 
              key={i} 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="border-slate-200 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{item.category}</Badge>
                      <span className="text-[10px] text-slate-400 font-bold">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-sm text-slate-500">Source: {item.source}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                    <ShareButton title={item.title} url={item.url} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const AINewsView = ({ aiNews, onRefresh, isLoading }: { aiNews: any[], onRefresh: (type: 'aiNews') => void, isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Analyse des tendances IA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          Actualités IA & Fiscalité
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onRefresh('aiNews')}
          disabled={isLoading}
          className="h-8 gap-2 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
        >
          <Zap className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
          {isLoading ? 'Mise à jour...' : 'Actualiser'}
        </Button>
      </div>

      {aiNews.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Veille IA vide</h3>
          <p className="text-sm text-slate-500 mb-6">Aucune actualité IA n'est disponible pour le moment.</p>
          <Button 
            onClick={() => onRefresh('aiNews')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Zap className="w-4 h-4" />
            Lancer la veille IA
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiNews.map((item, i) => (
            <Card key={i} className="border-slate-200 overflow-hidden group hover:shadow-lg transition-all">
              <div className="h-2 bg-blue-600" />
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">{item.topic}</Badge>
                  <div className="flex items-center gap-2">
                    <ShareButton title={item.title} url={item.url} />
                    <span className={`text-[10px] font-bold uppercase ${item.impact === 'Critique' ? 'text-red-500' : 'text-green-500'}`}>
                      Impact {item.impact}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-base leading-tight group-hover:text-blue-600 transition-colors">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Découvrez comment cette avancée technologique transforme le paysage fiscal marocain en 2026.</p>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t p-0">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-blue-600 hover:text-blue-700 gap-2 h-10 rounded-none"
                  >
                    Lire l'analyse <ChevronRight className="w-4 h-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const ISSimulatorView = () => {
  const [turnover, setTurnover] = useState<string>('');
  const [profit, setProfit] = useState<string>('');
  const [regime, setRegime] = useState<'standard' | 'export' | 'industrial'>('standard');
  const [result, setResult] = useState<{ is: number, cm: number, final: number, rate: number } | null>(null);

  const calculateIS = () => {
    const t = parseFloat(turnover) || 0;
    const p = parseFloat(profit) || 0;
    
    // Moroccan IS 2026 (Convergence rates)
    // Standard: 31% target, but for 2026 it's in transition
    // Simplified brackets for 2026 simulation:
    let rate = 0.31;
    let deduction = 140000;

    if (p <= 300000) {
      rate = 0.10;
      deduction = 0;
    } else if (p <= 1000000) {
      rate = 0.20;
      deduction = 30000;
    }

    // Adjustments for specific regimes
    if (regime === 'industrial' || regime === 'export') {
      if (p > 1000000) {
        rate = 0.20; // Simplified for simulation
        deduction = 30000;
      }
    }

    const isAmount = (p * rate) - deduction;

    // Cotisation Minimale (CM) - 2026 Standard rate 0.25%
    const cmRate = 0.0025;
    const cmAmount = t * cmRate;

    setResult({
      is: Math.max(0, isAmount),
      cm: cmAmount,
      final: Math.max(isAmount, cmAmount),
      rate: rate * 100
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Simulateur IS Maroc 2026</h2>
        <p className="text-sm text-slate-500">Convergence vers le taux cible de 31% (LF 2026).</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Données Fiscales</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Régime de la Société</label>
              <select 
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={regime}
                onChange={(e) => setRegime(e.target.value as any)}
              >
                <option value="standard">Droit Commun (Standard)</option>
                <option value="industrial">Société Industrielle</option>
                <option value="export">Société Exportatrice</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Chiffre d'Affaires (MAD)</label>
              <Input 
                type="number" 
                placeholder="Ex: 5000000" 
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Résultat Fiscal (MAD)</label>
              <Input 
                type="number" 
                placeholder="Ex: 800000" 
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
              />
            </div>
            <Button onClick={calculateIS} className="w-full h-12 bg-slate-900 hover:bg-black text-white text-lg">
              Calculer l'IS
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Taux Appliqué</p>
                  <p className="text-lg font-bold text-blue-600">{result.rate}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cotisation Minimale</p>
                  <p className="text-lg font-bold text-slate-900">{result.cm.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>
              <Card className="border-blue-600 bg-blue-600 text-white overflow-hidden shadow-xl shadow-blue-100">
                <CardContent className="p-8 text-center relative">
                  <Sparkles className="absolute top-4 right-4 w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium opacity-80 uppercase tracking-widest">Impôt Final à Payer</p>
                  <div className="text-5xl font-black mt-2">
                    {result.final.toLocaleString('fr-FR')} <span className="text-2xl">MAD</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/20 flex justify-around text-xs">
                    <div>
                      <p className="opacity-60">IS Théorique</p>
                      <p className="font-bold">{result.is.toLocaleString('fr-FR')} MAD</p>
                    </div>
                    <div>
                      <p className="opacity-60">Base CM</p>
                      <p className="font-bold">{result.cm.toLocaleString('fr-FR')} MAD</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-[11px] text-orange-700 leading-relaxed">
                  <strong>Rappel 2026 :</strong> L'impôt à payer est le montant le plus élevé entre l'IS théorique et la Cotisation Minimale. Les sociétés en déficit sont redevables de la CM.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">L'analyse fiscale apparaîtra ici après le calcul</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarView = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const [view, setView] = useState<'month' | 'year'>('month');
  const [selectedDeadline, setSelectedDeadline] = useState<any>(null);

  const getDeadlines = () => {
    if (view === 'month') {
      return ALL_DEADLINES
        .filter(d => d.isMonthly || d.month === currentMonth)
        .map(d => processDeadline(d, currentMonth, currentYear, today))
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    } else {
      const yearly: ProcessedDeadline[] = [];
      for (let m = 0; m < 12; m++) {
        const monthDeadlines = ALL_DEADLINES.filter(d => d.isMonthly || d.month === m);
        monthDeadlines.forEach(d => {
          yearly.push(processDeadline(d, m, currentYear, today));
        });
      }
      return yearly.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    }
  };

  const events = getDeadlines();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Échéancier Fiscal {currentYear}</h2>
          <p className="text-sm text-slate-500">Suivez vos obligations fiscales tout au long de l'année.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button 
            onClick={() => setView('month')}
            className={`px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${view === 'month' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mois en cours
          </button>
          <button 
            onClick={() => setView('year')}
            className={`px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${view === 'year' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Vue Annuelle
          </button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-6">
          <CardTitle className="text-base flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-bold text-slate-900">
              {view === 'month' ? `Échéances de ${months[currentMonth]}` : 'Calendrier Fiscal Complet'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className={view === 'year' ? "h-[600px]" : ""}>
            <div className="divide-y divide-slate-100">
              {events.length > 0 ? events.map((event, i) => (
                <div key={i} className={`p-6 flex items-center justify-between hover:bg-slate-50 transition-colors ${event.isUrgent ? 'bg-red-50/30' : ''}`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-transform hover:scale-105 ${
                      event.isUrgent ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase leading-none ${event.isUrgent ? 'text-red-100' : 'text-slate-400'}`}>
                        {months[event.monthIdx].substring(0, 3)}
                      </span>
                      <span className="text-2xl font-black leading-none mt-1">{event.day}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{event.title}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-slate-100 text-slate-600 border-none font-bold uppercase tracking-tighter">
                          {event.type}
                        </Badge>
                        {event.isUrgent && (
                          <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShareButton title={event.title} />
                    <Dialog>
                      <DialogTrigger render={
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 font-bold px-4">
                          Détails
                        </Button>
                      } />
                    <DialogContent className="sm:max-w-[450px] rounded-3xl">
                      <DialogHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <DialogTitle className="text-xl font-bold">{event.title}</DialogTitle>
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{event.date}</p>
                            </div>
                          </div>
                          <ShareButton title={event.title} />
                        </div>
                      </DialogHeader>
                      <div className="py-6 space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-sm text-slate-600 leading-relaxed">{event.description || "Aucune description détaillée disponible pour cette échéance."}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Type</p>
                            <p className="text-sm font-bold text-blue-900">{event.type}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Périodicité</p>
                            <p className="text-sm font-bold text-slate-900">{event.isMonthly ? 'Mensuelle' : 'Annuelle/Trim.'}</p>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-11 font-bold">Ajouter à mon calendrier</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )) : (
                <div className="p-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900">Tout est à jour !</p>
                    <p className="text-sm text-slate-500">Aucune échéance majeure trouvée pour cette période.</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 p-4 bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900">Rappel TVA</p>
              <p className="text-[10px] text-blue-700">Avant le 20 de chaque mois.</p>
            </div>
          </div>
        </Card>
        <Card className="border-slate-200 p-4 bg-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-900">Acomptes IS</p>
              <p className="text-[10px] text-purple-700">Mars, Juin, Sept, Déc.</p>
            </div>
          </div>
        </Card>
        <Card className="border-slate-200 p-4 bg-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-900">Déclaration IR</p>
              <p className="text-[10px] text-orange-700">Avant le 30 Avril.</p>
            </div>
          </div>
        </Card>
      </div>

      <p className="text-[10px] text-slate-400 text-center italic">
        * Ce calendrier est indicatif. Référez-vous toujours aux textes officiels du CGI.
      </p>
    </div>
  );
};

const SEOView = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Score SEO", value: "92/100", color: "text-green-600" },
          { label: "Mots-clés", value: "1,450", color: "text-blue-600" },
          { label: "Backlinks", value: "892", color: "text-purple-600" },
          { label: "Vitesse", value: "0.8s", color: "text-orange-600" },
        ].map((stat, i) => (
          <Card key={i} className="border-slate-200">
            <CardHeader className="p-4">
              <CardTitle className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{stat.label}</CardTitle>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Top Mots-clés Fiscaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["CGI Maroc 2026", "Impôt sur le revenu Maroc", "TVA 20% services", "Jurisprudence fiscale"].map((kw, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{kw}</span>
                <Badge className="bg-green-100 text-green-700 border-none">Top 10</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdSenseView = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-orange-800">Revenus Estimés (Ce mois)</CardTitle>
            <div className="text-4xl font-black text-orange-900">1,240.50 <span className="text-xl">USD</span></div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-orange-700">
              <TrendingUp className="w-3 h-3" />
              <span>+15% par rapport au mois dernier</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Impressions d'annonces</CardTitle>
            <div className="text-4xl font-black text-slate-900">45,200</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BarChart className="w-3 h-3" />
              <span>CTR moyen: 2.4%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface PublishedArticle {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  topic: string;
}

const PublishedArticlesView = ({ 
  articles, 
  isAdmin, 
  onDelete, 
  onUpdate,
  onRefresh,
  isLoading
}: { 
  articles: PublishedArticle[], 
  isAdmin: boolean,
  onDelete: (id: string) => void,
  onUpdate: (article: PublishedArticle) => void,
  onRefresh: (type: 'article') => void,
  isLoading: boolean
}) => {
  const [editingArticle, setEditingArticle] = useState<PublishedArticle | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bibliothèque d'Expertise</h2>
          <p className="text-sm text-slate-500 font-medium">Analyses approfondies et guides pratiques générés par notre IA experte.</p>
        </div>
        {isAdmin && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onRefresh('article')} 
            disabled={isLoading}
            className="gap-2 bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Plus className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Générer Article Expert
          </Button>
        )}
      </div>
      
      {articles.length === 0 ? (
        <Card className="border-slate-200 p-16 text-center bg-white shadow-sm rounded-3xl">
          <div className="max-w-xs mx-auto space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Prêt à publier ?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Vos articles générés apparaîtront ici. Commencez par créer votre premier contenu expert.</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article) => (
            <Card key={article.id} className="border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group bg-white rounded-3xl relative">
              <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
              
              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <ShareButton title={article.title} className="bg-white/90 backdrop-blur hover:bg-white text-slate-600 shadow-sm" />
                  <Dialog open={!!editingArticle && editingArticle.id === article.id} onOpenChange={(open) => !open && setEditingArticle(null)}>
                    <DialogTrigger render={
                      <Button 
                        variant="secondary" 
                        size="icon-sm" 
                        className="bg-white/90 backdrop-blur hover:bg-white text-slate-600 shadow-sm"
                        onClick={() => setEditingArticle(article)}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    } />
                    <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0">
                      <DialogHeader className="p-6 border-b">
                        <DialogTitle>Modifier l'article</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 p-6 space-y-4 overflow-hidden flex flex-col">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Titre</label>
                          <Input 
                            value={editingArticle?.title || ''} 
                            onChange={(e) => setEditingArticle(prev => prev ? {...prev, title: e.target.value} : null)}
                          />
                        </div>
                        <div className="flex-1 flex flex-col space-y-2 min-h-0">
                          <label className="text-sm font-bold text-slate-700">Contenu (Markdown)</label>
                          <textarea
                            className="flex-1 w-full p-4 rounded-xl border border-slate-200 text-sm leading-relaxed outline-none resize-none font-mono focus:border-blue-300 transition-colors bg-slate-50"
                            value={editingArticle?.content || ''}
                            onChange={(e) => setEditingArticle(prev => prev ? {...prev, content: e.target.value} : null)}
                          />
                        </div>
                      </div>
                      <DialogFooter className="p-6 border-t bg-white">
                        <Button variant="ghost" onClick={() => setEditingArticle(null)}>Annuler</Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            if (editingArticle) {
                              onUpdate(editingArticle);
                              setEditingArticle(null);
                            }
                          }}
                        >
                          Enregistrer les modifications
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="secondary" 
                    size="icon-sm" 
                    className="bg-white/90 backdrop-blur hover:bg-red-50 hover:text-red-600 text-slate-600 shadow-sm"
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
                        onDelete(article.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {!isAdmin && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <ShareButton title={article.title} className="bg-white/90 backdrop-blur hover:bg-white text-slate-600 shadow-sm" />
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-blue-50 text-blue-700 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{article.topic}</Badge>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase">5 min de lecture</span>
                  </div>
                </div>
                <CardTitle className="text-xl text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="prose prose-slate prose-sm max-w-none line-clamp-4 text-slate-600 leading-relaxed">
                  <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t flex justify-between items-center py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-900 uppercase leading-none">{article.author}</span>
                    <span className="text-[9px] text-slate-400 font-medium mt-1">{article.date}</span>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger render={<Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 font-bold gap-2" />}>
                    Lire l'article <ArrowRight className="w-4 h-4" />
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0 border-none shadow-2xl">
                    <DialogHeader className="p-8 border-b bg-white sticky top-0 z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-blue-50 text-blue-700 border-none">{article.topic}</Badge>
                        <span className="text-xs text-slate-400 font-medium">{article.date} • 5 min de lecture</span>
                      </div>
                      <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">{article.title}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 bg-slate-50/30">
                      <div className="p-8 md:p-12 max-w-3xl mx-auto bg-white my-8 rounded-3xl shadow-sm border border-slate-100">
                        <div className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900">
                          <ReactMarkdown>{article.content}</ReactMarkdown>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const GenerateArticleDialog = ({ onPublish }: { onPublish: (article: PublishedArticle) => void }) => {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Professionnel & Expert');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setGeneratedArticle('');
    setIsEditing(false);
    try {
      const prompt = `En tant qu'expert fiscal marocain et rédacteur SEO, rédige un article de blog complet et structuré sur le sujet suivant : "${topic}". 
      Utilise les mots-clés : ${keywords}. 
      Le ton doit être : ${tone}. 
      L'article doit inclure un titre accrocheur, une introduction, des sous-titres (H2, H3), et une conclusion. 
      Optimise le contenu pour le SEO au Maroc pour l'année 2026. Réponds en Markdown.`;

      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });
      const text = result.text;
      setGeneratedArticle(text || "Désolé, je n'ai pas pu générer l'article.");
    } catch (error) {
      console.error("Generation error:", error);
      setGeneratedArticle("Désolé, une erreur est survenue lors de la génération de l'article. Vérifiez votre clé API Gemini.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualStart = () => {
    if (!topic) return;
    setGeneratedArticle('# ' + topic + '\n\nCommencez à rédiger votre article ici...');
    setIsEditing(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setGeneratedArticle('');
        setIsEditing(false);
      }
    }}>
      <DialogTrigger
        render={
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-100">
            <Plus className="w-4 h-4" />
            Créer un article
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[850px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Edit3 className="w-6 h-6 text-blue-600" />
                Nouvel Article Expert
              </DialogTitle>
              <DialogDescription>
                Rédigez votre propre contenu ou laissez l'IA générer une base solide pour vous.
              </DialogDescription>
            </div>
          </div>
          {!generatedArticle && (
            <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="mt-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
                <TabsTrigger value="ai" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                  <Bot className="w-4 h-4 mr-2" />
                  Génération IA
                </TabsTrigger>
                <TabsTrigger value="manual" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Rédaction Manuelle
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
          {!generatedArticle ? (
            <div className="p-8 space-y-8 max-w-2xl mx-auto w-full">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Titre de l'article
                </label>
                <Input 
                  placeholder="Ex: Les nouveautés de la LF 2026 sur l'IS" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-12 border-slate-200 focus:ring-blue-500 bg-white text-base shadow-sm"
                />
              </div>

              {mode === 'ai' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Mots-clés cibles
                      </label>
                      <Input 
                        placeholder="Ex: IS, Maroc, Fiscalité, 2026" 
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="h-12 border-slate-200 focus:ring-blue-500 bg-white shadow-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-500" />
                        Ton de l'article
                      </label>
                      <select 
                        className="w-full h-12 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                      >
                        <option>Professionnel & Expert</option>
                        <option>Informatif & Simple</option>
                        <option>Analytique & Critique</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    </div>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      L'IA va générer un article structuré avec des balises H2/H3 et une densité de mots-clés optimale pour le marché marocain.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 space-y-6 max-w-2xl mx-auto w-full">
                  <div className="space-y-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Titre de votre article
                      </label>
                      <Input 
                        placeholder="Ex: Guide complet sur la TVA immobilière 2026" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="h-12 border-slate-200 focus:ring-blue-500 bg-slate-50/50 text-base font-medium"
                      />
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Edit3 className="w-5 h-5 text-blue-600 shrink-0" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">Mode Rédaction Libre</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Prenez le contrôle total. Vous serez redirigé vers un éditeur plein écran pour rédiger votre contenu en Markdown ou texte brut.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 m-4 border rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 font-bold px-3 py-1">
                    {isEditing ? "MODE ÉDITION" : "APERÇU FINAL"}
                  </Badge>
                  {isGenerating && <span className="text-xs text-blue-600 animate-pulse font-medium">Mise à jour...</span>}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`h-9 px-4 gap-2 font-bold transition-all ${isEditing ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Terminer l'édition
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Modifier l'article
                    </>
                  )}
                </Button>
              </div>
              
              <ScrollArea className="flex-1 h-full">
                <div className="p-8 md:p-12 max-w-3xl mx-auto">
                  {isEditing ? (
                    <textarea
                      className="w-full min-h-[600px] bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 text-base text-slate-800 leading-relaxed outline-none resize-none font-mono focus:border-blue-300 transition-colors"
                      value={generatedArticle}
                      onChange={(e) => setGeneratedArticle(e.target.value)}
                      placeholder="Modifiez votre article ici..."
                    />
                  ) : (
                    <div className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600">
                      <ReactMarkdown>
                        {generatedArticle}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-white gap-3">
          {generatedArticle ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="text-slate-500 hover:text-red-600" onClick={() => {
                  setGeneratedArticle('');
                  setIsEditing(false);
                }}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler et recommencer
                </Button>
                <ShareButton title={topic || "Nouvel Article Expert"} />
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  className="border-slate-200"
                  onClick={() => {
                    const blob = new Blob([generatedArticle], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Article_${topic.replace(/\s+/g, '_')}.md`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  Format Markdown
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 px-8 h-11 font-bold"
                  onClick={() => {
                    const blob = new Blob([generatedArticle], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Article_${topic.replace(/\s+/g, '_')}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger l'article
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 px-8 h-11 font-bold"
                  onClick={() => {
                    onPublish({
                      id: Date.now().toString(),
                      title: topic,
                      content: generatedArticle,
                      date: new Date().toLocaleDateString('fr-FR'),
                      author: "Expert Ledger Fiscal",
                      topic: "Analyse Fiscale"
                    });
                    setIsOpen(false);
                    setGeneratedArticle('');
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Publier sur le site
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end w-full gap-3">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Fermer</Button>
              {mode === 'ai' ? (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 px-10 h-12 text-base font-bold" 
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic}
                >
                  {isGenerating ? (
                    <>
                      <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                      Rédaction de votre article...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Générer l'article maintenant
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 px-10 h-12 text-base font-bold" 
                  onClick={handleManualStart}
                  disabled={!topic}
                >
                  <Edit3 className="w-5 h-5 mr-2" />
                  Commencer la rédaction
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RecommendationsView = ({ filter: externalFilter, setFilter: setExternalFilter }: { filter?: string, setFilter?: (f: string) => void }) => {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState({ sector: '', turnover: '', employees: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [personalizedRecs, setPersonalizedRecs] = useState<any[]>([]);
  const [localFilter, setLocalFilter] = useState<string>('Tous');
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [appliedRecs, setAppliedRecs] = useState<Set<number>>(new Set());

  const filter = externalFilter || localFilter;
  const setFilter = setExternalFilter || setLocalFilter;

  const handleApplyAll = () => {
    const allIndices = new Set(recommendations.map((_, i) => i));
    setAppliedRecs(allIndices);
  };

  const toggleApply = (index: number) => {
    const newApplied = new Set(appliedRecs);
    if (newApplied.has(index)) newApplied.delete(index);
    else newApplied.add(index);
    setAppliedRecs(newApplied);
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `En tant qu'expert fiscal marocain, génère 5 recommandations stratégiques pour une entreprise dans le secteur "${analysisData.sector}" avec un chiffre d'affaires de ${analysisData.turnover} DH et ${analysisData.employees} employés pour l'année 2026. Réponds uniquement avec un tableau JSON d'objets ayant les propriétés: title, description, type (Optimisation, Conformité, Économie, Alerte), priority (Critique, Haute, Moyenne, Basse).`;
      
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });
      const text = result.text;
      const cleanedText = (text || '').replace(/```json|```/g, '').trim();
      const recs = JSON.parse(cleanedText);
      
      const icons = {
        Optimisation: TrendingUp,
        Conformité: ShieldCheck,
        Économie: Zap,
        Alerte: Scale
      };

      const colors = {
        Optimisation: "text-blue-600",
        Conformité: "text-red-600",
        Économie: "text-yellow-600",
        Alerte: "text-purple-600"
      };

      const bgColors = {
        Optimisation: "bg-blue-50",
        Conformité: "bg-red-50",
        Économie: "bg-yellow-50",
        Alerte: "bg-purple-50"
      };

      const formattedRecs = recs.map((r: any) => ({
        ...r,
        icon: icons[r.type as keyof typeof icons] || Info,
        color: colors[r.type as keyof typeof colors] || "text-slate-600",
        bgColor: bgColors[r.type as keyof typeof bgColors] || "bg-slate-50"
      }));

      setPersonalizedRecs(formattedRecs);
      setIsAnalysisOpen(false);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const defaultRecommendations = [
    {
      title: "Optimisation de l'IS pour 2026",
      description: "En raison des nouveaux seuils, nous vous recommandons de réévaluer vos provisions avant la fin du trimestre.",
      type: "Optimisation",
      priority: "Haute",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Mise en conformité TVA",
      description: "Assurez-vous que vos factures de services numériques respectent les nouvelles mentions obligatoires de l'article 125.",
      type: "Conformité",
      priority: "Critique",
      icon: ShieldCheck,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Réduction des charges sociales",
      description: "Le nouveau barème de l'IR permet une économie potentielle de 5% sur la masse salariale pour les salaires intermédiaires.",
      type: "Économie",
      priority: "Moyenne",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Veille Juridique : Immobilier",
      description: "Une nouvelle circulaire DGI sur la taxation des profits fonciers est attendue. Préparez vos dossiers de cession.",
      type: "Alerte",
      priority: "Basse",
      icon: Scale,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Droits d'Enregistrement 2026",
      description: "Les taux pour les acquisitions de terrains nus destinés à la construction ont été révisés. Vérifiez l'éligibilité aux abattements.",
      type: "Optimisation",
      priority: "Moyenne",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Taxe Professionnelle (TP)",
      description: "La révision triennale de la valeur locative approche. Une déclaration rectificative peut éviter des surtaxes inutiles.",
      type: "Conformité",
      priority: "Haute",
      icon: ShieldCheck,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Incitations à l'Investissement",
      description: "Les entreprises exportatrices peuvent bénéficier d'un crédit d'impôt supplémentaire pour les investissements en R&D.",
      type: "Économie",
      priority: "Haute",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Contrôle Fiscal Préventif",
      description: "L'analyse de vos ratios de marge brute montre une légère déviation par rapport à la moyenne sectorielle. Préparez vos justificatifs.",
      type: "Alerte",
      priority: "Critique",
      icon: Scale,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Taxe de Services Communaux (TSC)",
      description: "Les nouveaux tarifs de la TSC 2026 s'appliquent aux locaux professionnels. Une révision de la base imposable est possible pour les zones industrielles.",
      type: "Optimisation",
      priority: "Moyenne",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Retenue à la Source (RAS)",
      description: "Les conventions de non-double imposition avec les pays de l'UE ont été mises à jour. Vérifiez les taux de RAS sur les redevances techniques.",
      type: "Conformité",
      priority: "Haute",
      icon: ShieldCheck,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Crédit d'Impôt Jeunes Entreprises",
      description: "Le programme 'Awrach 2026' offre un crédit d'impôt pour tout recrutement en CDI de jeunes diplômés. Éligibilité à vérifier selon le secteur.",
      type: "Économie",
      priority: "Haute",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Digitalisation DGI 2026",
      description: "Toutes les déclarations de revenus fonciers doivent désormais passer par la plateforme SIMPL. Risque d'amende automatique en cas de retard.",
      type: "Alerte",
      priority: "Critique",
      icon: Scale,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const recommendations = personalizedRecs.length > 0 ? personalizedRecs : defaultRecommendations;
  const filteredRecommendations = filter === 'Tous' 
    ? recommendations 
    : recommendations.filter(r => r.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {['Tous', 'Optimisation', 'Conformité', 'Économie', 'Alerte'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={`h-8 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-blue-600 shadow-md shadow-blue-100' : 'border-slate-200 text-slate-500 hover:border-blue-300'
              }`}
            >
              {f}
            </Button>
          ))}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleApplyAll}
          className="h-8 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <ShieldCheck className="w-4 h-4" />
          Tout Appliquer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRecommendations.map((rec, i) => {
          const isApplied = appliedRecs.has(i);
          return (
            <Card key={i} className={`border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group ${isApplied ? 'bg-green-50/30 border-green-200' : ''}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${rec.bgColor}`}>
                    <rec.icon className={`w-5 h-5 ${rec.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">{rec.title}</CardTitle>
                    <Badge variant="outline" className="text-[10px] mt-1 uppercase tracking-wider">{rec.type}</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <ShareButton title={rec.title} />
                    <Badge className={`${
                      rec.priority === 'Critique' ? 'bg-red-500' : 
                      rec.priority === 'Haute' ? 'bg-orange-500' : 
                      rec.priority === 'Moyenne' ? 'bg-blue-500' : 'bg-slate-500'
                    } text-white border-none text-[9px]`}>
                      {rec.priority}
                    </Badge>
                  </div>
                  {isApplied && <Badge className="bg-green-600 text-white border-none text-[9px] animate-in fade-in zoom-in">Appliqué</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{rec.description}</p>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t py-3 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {personalizedRecs.length > 0 ? "Analyse Personnalisée" : "Généré par IA"}
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 gap-1 ${isApplied ? 'text-green-600 hover:text-green-700' : 'text-slate-400 hover:text-blue-600'}`}
                    onClick={() => toggleApply(i)}
                  >
                    {isApplied ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {isApplied ? 'Appliqué' : 'Appliquer'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700 gap-1 h-8"
                    onClick={() => setSelectedRec(rec)}
                  >
                    Détails <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRec} onOpenChange={(open) => !open && setSelectedRec(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedRec && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedRec.bgColor}`}>
                      <selectedRec.icon className={`w-6 h-6 ${selectedRec.color}`} />
                    </div>
                    <Badge variant="outline" className="uppercase tracking-widest text-[10px]">{selectedRec.type}</Badge>
                  </div>
                  <ShareButton title={selectedRec.title} />
                </div>
                <DialogTitle className="text-2xl font-black text-slate-900">{selectedRec.title}</DialogTitle>
                <DialogDescription className="text-slate-500 mt-2">
                  Analyse détaillée et plan d'action pour votre conformité fiscale 2026.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Description complète</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedRec.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priorité</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedRec.priority === 'Critique' ? 'bg-red-500' : 
                        selectedRec.priority === 'Haute' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-sm font-bold text-slate-700">{selectedRec.priority}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact Estimé</h4>
                    <span className="text-sm font-bold text-green-600">Élevé</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Plan d'action recommandé</h4>
                  <ul className="space-y-2">
                    {[
                      "Vérifier l'éligibilité selon les nouveaux articles du CGI 2026.",
                      "Préparer les justificatifs comptables nécessaires.",
                      "Consulter un expert pour la validation finale.",
                      "Mettre à jour les paramètres dans votre logiciel de gestion."
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</div>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedRec(null)}>Fermer</Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={() => {
                    const content = `RAPPORT DE RECOMMANDATION FISCALE\n\nTitre: ${selectedRec.title}\nType: ${selectedRec.type}\nPriorité: ${selectedRec.priority}\n\nDescription:\n${selectedRec.description}\n\nPlan d'action:\n1. Vérifier l'éligibilité selon les nouveaux articles du CGI 2026.\n2. Préparer les justificatifs comptables nécessaires.\n3. Consulter un expert pour la validation finale.\n4. Mettre à jour les paramètres dans votre logiciel de gestion.\n\nDocument généré par Ledger Fiscal Maroc.`;
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Rapport_${selectedRec.title.replace(/\s+/g, '_')}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4" />
                  Télécharger le rapport
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Card className="bg-slate-900 text-white border-none overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" />
            Besoin d'une recommandation personnalisée ?
          </CardTitle>
          <CardDescription className="text-slate-400">
            Notre IA analyse votre situation fiscale en temps réel pour vous proposer les meilleures stratégies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
            <DialogTrigger render={
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20">
                Démarrer l'analyse personnalisée
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Analyse Fiscale Personnalisée</DialogTitle>
                <DialogDescription>
                  Remplissez ces informations pour obtenir des recommandations adaptées à votre entreprise.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Secteur d'activité</label>
                  <Input 
                    placeholder="Ex: Immobilier, Tech, Commerce..." 
                    value={analysisData.sector}
                    onChange={(e) => setAnalysisData({...analysisData, sector: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Chiffre d'affaires annuel (DH)</label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 5000000" 
                    value={analysisData.turnover}
                    onChange={(e) => setAnalysisData({...analysisData, turnover: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Nombre d'employés</label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 15" 
                    value={analysisData.employees}
                    onChange={(e) => setAnalysisData({...analysisData, employees: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing || !analysisData.sector || !analysisData.turnover}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Analyse en cours...
                    </>
                  ) : "Lancer l'analyse"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

const TVACalculatorView = () => {
  const [amount, setAmount] = useState<string>('');
  const [rate, setRate] = useState<string>('20');
  const [mode, setMode] = useState<'ht_to_ttc' | 'ttc_to_ht'>('ht_to_ttc');
  
  const val = parseFloat(amount) || 0;
  const rateVal = parseFloat(rate) / 100;
  
  let htVal = 0;
  let tvaVal = 0;
  let ttcVal = 0;

  if (mode === 'ht_to_ttc') {
    htVal = val;
    tvaVal = htVal * rateVal;
    ttcVal = htVal + tvaVal;
  } else {
    ttcVal = val;
    htVal = ttcVal / (1 + rateVal);
    tvaVal = ttcVal - htVal;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Calculateur TVA Expert</h2>
        <p className="text-sm text-slate-500">Conversion bidirectionnelle HT/TTC avec les taux en vigueur au Maroc.</p>
      </div>
      <Card className="border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-1 flex">
          <button 
            onClick={() => setMode('ht_to_ttc')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${mode === 'ht_to_ttc' ? 'bg-blue-600 text-white rounded-md shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            HT vers TTC
          </button>
          <button 
            onClick={() => setMode('ttc_to_ht')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${mode === 'ttc_to_ht' ? 'bg-blue-600 text-white rounded-md shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            TTC vers HT
          </button>
        </div>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                {mode === 'ht_to_ttc' ? 'Montant Hors Taxe (HT)' : 'Montant Toutes Taxes Comprises (TTC)'}
              </label>
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 text-xl font-bold pl-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">MAD</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Taux de TVA</label>
              <select 
                className="w-full h-14 rounded-md border border-slate-200 bg-white px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              >
                <option value="20">20% — Taux Normal</option>
                <option value="14">14% — Transport / Électricité</option>
                <option value="10">10% — Hôtellerie / Restauration</option>
                <option value="7">7% — Produits de base / Eau</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant HT</p>
                <p className="text-xl font-bold text-slate-900">{htVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs">MAD</span></p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant TVA</p>
                <p className="text-xl font-bold text-blue-600">{tvaVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs">MAD</span></p>
              </div>
            </div>
            <div className="p-8 bg-blue-600 text-white rounded-3xl text-center shadow-2xl shadow-blue-100 relative overflow-hidden">
              <Sparkles className="absolute -bottom-4 -left-4 w-24 h-24 opacity-10 rotate-12" />
              <p className="text-xs font-bold opacity-70 uppercase tracking-[0.2em] mb-2">Total TTC Final</p>
              <div className="text-5xl font-black">
                {ttcVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-2xl">MAD</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t py-4 justify-center">
          <p className="text-[10px] text-slate-400 font-medium">Calcul conforme aux dispositions du Code Général des Impôts 2026.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

const ContactExpertDialog = ({ expert, open, onOpenChange }: { expert: Expert, open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setIsSuccess(false);
      }, 2000);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100">
              <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Contacter {expert.name}</p>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{expert.title}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Envoyez une demande de consultation ou une question spécifique à cet expert.
          </DialogDescription>
        </DialogHeader>
        
        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Message Envoyé !</h3>
            <p className="text-sm text-slate-500">L'expert vous répondra dans les plus brefs délais.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Nom Complet</label>
                <Input placeholder="Votre nom" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
                <Input type="email" placeholder="votre@email.com" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Sujet de consultation</label>
              <select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                <option>Optimisation IS 2026</option>
                <option>Audit de conformité TVA</option>
                <option>Conseil en investissement</option>
                <option>Autre demande</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Message</label>
              <textarea 
                className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez brièvement votre besoin..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : <Send className="w-4 h-4" />}
                Envoyer la demande
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

const DirectoryView = () => {
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black text-slate-900">Annuaire des Experts</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">Trouvez les meilleurs professionnels de la fiscalité au Maroc pour vous accompagner dans vos projets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPERTS.map((expert) => (
          <Card key={expert.id} className="border-slate-200 overflow-hidden hover:shadow-xl transition-all group">
            <CardContent className="p-0">
              <div className="h-32 bg-gradient-to-r from-blue-900 to-slate-900 relative">
                <div className="absolute -bottom-10 left-6">
                  <div className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden shadow-lg">
                    <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>
              <div className="pt-12 p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{expert.name}</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{expert.title}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{expert.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span>{expert.location}, Maroc</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold text-slate-900">{expert.rating}</span>
                    <span className="text-xs text-slate-400">({expert.reviews} avis)</span>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setSelectedExpert(expert)}>Contacter</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-100 p-8 text-center">
        <h3 className="text-xl font-bold text-blue-900 mb-2">Vous êtes un professionnel de la fiscalité ?</h3>
        <p className="text-sm text-blue-700 mb-6">Rejoignez notre réseau et augmentez votre visibilité auprès de milliers d'entreprises.</p>
        <Button className="bg-blue-900 hover:bg-black text-white px-8">Inscrire mon cabinet</Button>
      </Card>

      {selectedExpert && (
        <ContactExpertDialog 
          expert={selectedExpert} 
          open={!!selectedExpert} 
          onOpenChange={(open) => !open && setSelectedExpert(null)} 
        />
      )}
    </div>
  );
};

export default function App() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const urgentDeadlines = ALL_DEADLINES
    .filter(d => d.isMonthly || d.month === currentMonth)
    .map(d => processDeadline(d, currentMonth, currentYear, today))
    .filter(d => d.isUrgent)
    .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

  const [activeTab, setActiveTab] = useState('dashboard');
  const [publishedArticles, setPublishedArticles] = useState<PublishedArticle[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [aiNews, setAiNews] = useState<any[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const fetchContent = async () => {
    setIsLoadingContent(true);
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      setPublishedArticles(data.publishedArticles || []);
      setNews(data.news || []);
      setAiNews(data.aiNews || []);
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleForceRefresh = async (type: 'news' | 'aiNews' | 'article') => {
    setIsLoadingContent(true);
    console.log(`[AI] Starting refresh for: ${type}`);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 10) {
        throw new Error("Clé API Gemini non configurée ou invalide. Veuillez ajouter GEMINI_API_KEY dans les Secrets.");
      }

      let prompt = '';
      if (type === 'news') {
        prompt = `En tant qu'expert fiscaliste marocain, génère un titre d'actualité fiscale réaliste et pertinent pour l'année 2026 au Maroc (ex: Loi de Finances, circulaires DGI, décisions de justice). 
        Format JSON: { "title": string, "source": string, "category": "Législation" | "Jurisprudence" | "Économie", "url": string }. 
        La source doit être un média marocain crédible (L'Économiste, Médias24, Le Matin, etc.).
        Réponds uniquement avec le JSON.`;
      } else if (type === 'aiNews') {
        prompt = `Génère une actualité prospective sur l'impact de l'Intelligence Artificielle dans la pratique fiscale ou comptable au Maroc en 2026. 
        Format JSON: { "title": string, "impact": "Élevé" | "Moyen" | "Critique", "topic": string, "url": string }. 
        Le sujet doit être technique et professionnel (ex: audit automatisé, détection de fraude par IA, conformité en temps réel).
        Réponds uniquement avec le JSON.`;
      } else {
        prompt = `Rédige un article d'expertise fiscale marocaine de haut niveau (300-400 mots) pour l'année 2026. 
        Le sujet doit porter sur une réforme complexe, une optimisation fiscale légale ou une analyse de jurisprudence récente au Maroc.
        Format JSON: { "title": string, "content": string, "topic": string }. 
        Le contenu doit être structuré en Markdown avec des titres, des listes et des références aux articles du CGI.
        Le ton doit être académique et professionnel.
        Réponds uniquement avec le JSON.`;
      }

      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      
      const rawText = result.text || '{}';
      console.log("[AI] Raw Response:", rawText);
      
      let content;
      try {
        const cleanedText = rawText.replace(/```json|```/g, '').trim();
        content = JSON.parse(cleanedText);
      } catch (e) {
        console.error("[AI] JSON Parse Error:", e);
        throw new Error("L'IA a retourné un format de données corrompu. Veuillez réessayer.");
      }
      
      const body: any = {};
      if (type === 'news') {
        content.date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        body.news = content;
      } else if (type === 'aiNews') {
        body.aiNews = content;
      } else {
        content.id = Date.now().toString();
        content.date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        content.author = "Expert Ledger IA";
        body.article = content;
      }

      const updateRes = await fetch('/api/content/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.error || "Erreur lors de la sauvegarde sur le serveur.");
      }
      
      console.log(`[AI] ${type} updated successfully.`);
      await fetchContent();
    } catch (error) {
      console.error(`[AI] Refresh failed for ${type}:`, error);
      alert(`Erreur d'actualisation : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      setPublishedArticles(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error("Failed to delete article:", error);
    }
  };

  const handleUpdateArticle = async (updatedArticle: PublishedArticle) => {
    try {
      await fetch(`/api/articles/${updatedArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedArticle)
      });
      setPublishedArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
    } catch (error) {
      console.error("Failed to update article:", error);
    }
  };
  const [recommendationFilter, setRecommendationFilter] = useState('Tous');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre assistant fiscal IA. Comment puis-je vous aider dans vos recherches ou calculs fiscaux aujourd'hui ?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSummarize = async (doc: Document) => {
    setSelectedDoc(doc);
    setIsSummarizing(true);
    setSummary('');
    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `En tant qu'expert fiscal marocain, résume brièvement (3-4 phrases) l'importance et les points clés du document suivant pour l'année 2026 : "${doc.title}".`
      });
      setSummary(result.text || "Désolé, je n'ai pas pu générer de résumé.");
    } catch (error) {
      console.error("Summary error:", error);
      setSummary("Désolé, une erreur est survenue lors de la génération du résumé.");
    } finally {
      setIsSummarizing(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: Message = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: chatInput,
        config: {
          systemInstruction: "Tu es un assistant fiscal expert au Maroc pour l'année 2026. Réponds de manière précise et professionnelle.",
        },
      });
      const text = result.text;
      setMessages(prev => [...prev, { role: 'assistant', content: text || "Désolé, je n'ai pas pu générer de réponse." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion au service IA." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const SidebarItem = ({ icon: Icon, label, id, badge, color }: { icon: any, label: string, id: string, badge?: string | number, color?: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
        activeTab === id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${activeTab === id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge && (
        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center ${color || 'bg-slate-200'}`}>
          {badge}
        </Badge>
      )}
    </button>
  );

  const SectionTitle = ({ children }: { children: ReactNode }) => (
    <h3 className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </h3>
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
        {/* Sidebar */}
        <aside 
          className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col h-full overflow-hidden min-w-0 ${
            isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
          }`}
        >
          <div className="p-4 flex items-center gap-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">Ledger Fiscal</h1>
              <p className="text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-tighter">Intelligence Fiscale 2026</p>
            </div>
          </div>

          <div className="flex-1 px-3 py-4 overflow-hidden min-h-0">
            <ScrollArea className="h-full pr-3">
              <SectionTitle>Navigation</SectionTitle>
              <div className="space-y-1">
                <SidebarItem 
                  icon={LayoutDashboard} 
                  label="Tableau de bord" 
                  id="dashboard" 
                  badge={urgentDeadlines.length > 0 ? urgentDeadlines.length : undefined}
                  color="bg-red-500 text-white"
                />
                <SidebarItem icon={Users} label="Communauté" id="community" badge="Live" color="bg-green-500 text-white" />
                <SidebarItem icon={FileText} label="Articles Publiés" id="articles" badge={publishedArticles.length} color="bg-blue-100 text-blue-700" />
                <SidebarItem icon={Newspaper} label="Revue de presse" id="news" badge="Nouveau" color="bg-red-500 text-white" />
                <SidebarItem icon={Zap} label="Actualités IA" id="ai-news" badge={8} color="bg-blue-600 text-white" />
                <SidebarItem icon={Lightbulb} label="Recommandations" id="recommendations" badge="IA" color="bg-yellow-500 text-white" />
                <SidebarItem icon={Bot} label="Assistant fiscal" id="assistant" />
              </div>

              <SectionTitle>Bibliothèque CGI</SectionTitle>
              <div className="space-y-1">
                <SidebarItem icon={Library} label="CGI 2010-2026" id="cgi" badge={156} />
                <SidebarItem icon={FileText} label="Circulaires DGI" id="circulaires" badge={452} />
                <SidebarItem icon={FileCode} label="Bulletins Officiels" id="bulletins" badge={89} />
                <SidebarItem icon={Scale} label="Jurisprudence" id="jurisprudence" badge={234} />
              </div>

              <SectionTitle>Outils Fiscaux</SectionTitle>
              <div className="space-y-1">
                <SidebarItem icon={Calculator} label="Simulateur IS" id="is" />
                <SidebarItem icon={Calculator} label="Simulateur IR" id="ir" />
                <SidebarItem icon={Calculator} label="Calculateur TVA" id="tva" />
                <SidebarItem icon={Users} label="Annuaire Experts" id="directory" badge="Nouveau" color="bg-green-100 text-green-700" />
                <SidebarItem 
                  icon={Calendar} 
                  label="Calendrier fiscal" 
                  id="calendar" 
                  badge={urgentDeadlines.length > 0 ? urgentDeadlines.length : undefined}
                  color="bg-red-500 text-white"
                />
              </div>

              {isAdmin && (
                <>
                  <SectionTitle>SEO & Monétisation</SectionTitle>
                  <div className="space-y-1">
                    <SidebarItem icon={TrendingUp} label="Analyse SEO" id="seo" badge={90} color="bg-green-500 text-white" />
                    <SidebarItem icon={Globe} label="AdSense" id="adsense" />
                  </div>
                </>
              )}
            </ScrollArea>
          </div>

          <div className="p-4 bg-slate-900 m-3 rounded-2xl text-white space-y-4 shadow-2xl border border-slate-800 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-600/20 rounded-full blur-2xl group-hover:bg-blue-600/30 transition-all" />
            <div className="flex items-center gap-2 relative z-10">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Flash Fiscal</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed relative z-10">
              Recevez les alertes <strong>DGI 2026</strong> et les analyses d'experts directement par email.
            </p>
            <div className="space-y-2 relative z-10">
              <input 
                type="email" 
                placeholder="votre@email.com" 
                className="w-full text-[10px] px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
              />
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">
                S'abonner gratuitement
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 border-t border-slate-100">
              <GenerateArticleDialog onPublish={async (article) => {
                try {
                  await fetch('/api/articles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(article)
                  });
                  setPublishedArticles(prev => [article, ...prev]);
                  setActiveTab('articles');
                } catch (error) {
                  console.error("Failed to publish article:", error);
                }
              }} />
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
          {/* Top Navbar */}
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4 flex-1">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-500">
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Rechercher CGI, TVA, IS..." 
                  className="pl-10 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">IA Active</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              
              <ShareButton title="Ledger Fiscal Maroc - Intelligence Fiscale 2026" className="text-slate-500" />

              <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                <DialogTrigger render={
                  <Button variant="ghost" size="icon" className="relative text-slate-500">
                    <Bell className="w-5 h-5" />
                    {urgentDeadlines.length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
                    )}
                  </Button>
                } />
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      Alertes Fiscales Critiques
                    </DialogTitle>
                    <DialogDescription>
                      Échéances urgentes nécessitant votre attention immédiate.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-3">
                    {urgentDeadlines.length > 0 ? urgentDeadlines.map((alert, i) => (
                      <div 
                        key={i} 
                        className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 cursor-pointer hover:bg-red-100 transition-colors"
                        onClick={() => {
                          setActiveTab('calendar');
                          setIsNotificationsOpen(false);
                        }}
                      >
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-900">{alert.title}</p>
                          <p className="text-xs text-red-700 mt-1">Échéance le {alert.date}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">Aucune alerte critique en cours.</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        setActiveTab('calendar');
                        setIsNotificationsOpen(false);
                      }}
                    >
                      Voir le calendrier complet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                <DialogTrigger render={
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 px-2"
                    onClick={() => !isAdmin && setIsAdminDialogOpen(true)}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 leading-none">{isAdmin ? 'Admin' : 'Visiteur'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{isAdmin ? 'Accès Total' : 'Accès Public'}</p>
                    </div>
                  </Button>
                } />
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>{isAdmin ? 'Session Administrateur' : 'Connexion Administrateur'}</DialogTitle>
                    <DialogDescription>
                      {isAdmin ? 'Vous êtes connecté en tant qu\'administrateur.' : 'Entrez le mot de passe pour accéder aux outils d\'administration.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    {isAdmin ? (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-700 font-medium">Accès privilégié activé</p>
                      </div>
                    ) : (
                      <Input 
                        type="password" 
                        placeholder="Mot de passe" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && adminPassword === 'admin123') {
                            setIsAdmin(true);
                            setIsAdminDialogOpen(false);
                            setAdminPassword('');
                          }
                        }}
                      />
                    )}
                  </div>
                  <DialogFooter>
                    {isAdmin ? (
                      <Button 
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          setIsAdmin(false);
                          setIsAdminDialogOpen(false);
                        }}
                      >
                        Se déconnecter
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-blue-600"
                        onClick={() => {
                          if (adminPassword === 'admin123') {
                            setIsAdmin(true);
                            setIsAdminDialogOpen(false);
                            setAdminPassword('');
                          }
                        }}
                      >
                        Se connecter
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setIsAdmin(false)}
                >
                  Déconnexion
                </Button>
              )}
            </div>
          </header>

          {/* Content Area */}
          <main className={`flex-1 ${activeTab === 'assistant' ? 'p-4 md:p-8' : 'p-8'} ${activeTab === 'assistant' ? 'h-[calc(100vh-3.5rem)] overflow-hidden' : 'overflow-auto'}`}>
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-6xl mx-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Tableau de Bord Fiscal</h2>
                    <p className="text-sm text-slate-500">Aperçu de votre activité et des indicateurs clés.</p>
                  </div>
                  <DashboardView 
                    onNavigate={(tab, filter) => {
                      setActiveTab(tab);
                      if (filter) setRecommendationFilter(filter);
                    }} 
                    urgentDeadlines={urgentDeadlines}
                  />
                </motion.div>
              ) : activeTab === 'articles' ? (
                <motion.div
                  key="articles"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-6xl mx-auto"
                >
                  <PublishedArticlesView 
                    articles={publishedArticles} 
                    isAdmin={isAdmin}
                    onDelete={handleDeleteArticle}
                    onUpdate={handleUpdateArticle}
                    onRefresh={handleForceRefresh}
                    isLoading={isLoadingContent}
                  />
                </motion.div>
              ) : activeTab === 'recommendations' ? (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-6xl mx-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Recommandations Stratégiques</h2>
                    <p className="text-sm text-slate-500">Optimisez votre fiscalité avec nos conseils experts et l'IA.</p>
                  </div>
                  <RecommendationsView 
                    filter={recommendationFilter} 
                    setFilter={setRecommendationFilter} 
                  />
                </motion.div>
              ) : activeTab === 'cgi' || activeTab === 'circulaires' || activeTab === 'bulletins' || activeTab === 'jurisprudence' ? (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-5xl mx-auto space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>Accueil</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-blue-600">Bibliothèque CGI</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Library className="w-6 h-6 text-orange-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">CGI Maroc 2026 — Bibliothèque Officielle</h2>
                      </div>
                      <p className="text-sm text-slate-500">608 documents officiels — CGI 2026 complet, 452 circulaires DGI, Lois de Finances 2010-2026</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[2024, 2025, 2026].reverse().map(year => (
                      <div key={year} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-900">{year}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {DOCUMENTS.filter(d => d.year === year).length} DOCS
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {DOCUMENTS.filter(d => d.year === year).map(doc => (
                            <Card key={doc.id} className="group hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md border-slate-200">
                              <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                    doc.type === 'CGI' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    <FileText className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{doc.title}</h4>
                                      {doc.isOfficial && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-[9px] h-4 px-1 gap-1">
                                          <ShieldCheck className="w-2.5 h-2.5" />
                                          Officiel
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{doc.type}</span>
                                      <Separator orientation="vertical" className="h-3" />
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{doc.size}</span>
                                      <Separator orientation="vertical" className="h-3" />
                                      <p className="text-[10px] text-slate-500">{doc.description}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-2 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                    onClick={() => handleSummarize(doc)}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Résumé IA
                                  </Button>
                                  <a 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-background hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 h-8 px-3 gap-2"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Télécharger
                                  </a>
                                  {doc.hasAI && (
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={
                                          <Button variant="secondary" size="sm" className="h-8 gap-2 bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all">
                                            <Bot className="w-3.5 h-3.5" />
                                            IA
                                          </Button>
                                        }
                                      />
                                      <TooltipContent>Analyse IA disponible</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : activeTab === 'news' ? (
                <motion.div
                  key="news"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Revue de Presse Fiscale</h2>
                        <p className="text-sm text-slate-500">Les dernières actualités juridiques et économiques du Maroc.</p>
                      </div>
                      <div className="flex gap-2">
                        {isAdmin ? (
                          <Button variant="outline" size="sm" onClick={() => handleForceRefresh('news')} disabled={isLoadingContent} className="gap-2">
                            <Zap className={cn("w-4 h-4", isLoadingContent && "animate-pulse")} />
                            Actualiser (Admin)
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setIsAdminDialogOpen(true)} className="text-slate-400 hover:text-blue-600">
                            <LockIcon className="w-4 h-4 mr-2" />
                            Mode Admin pour actualiser
                          </Button>
                        )}
                      </div>
                    </div>
                  <NewsView news={news} onRefresh={() => handleForceRefresh('news')} isLoading={isLoadingContent} />
                </motion.div>
              ) : activeTab === 'ai-news' ? (
                <motion.div
                  key="ai-news"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-6xl mx-auto"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Actualités Intelligence Artificielle</h2>
                        <p className="text-sm text-slate-500">Comment l'IA révolutionne la gestion fiscale et juridique.</p>
                      </div>
                      <div className="flex gap-2">
                        {isAdmin ? (
                          <Button variant="outline" size="sm" onClick={() => handleForceRefresh('aiNews')} disabled={isLoadingContent} className="gap-2">
                            <Zap className={cn("w-4 h-4", isLoadingContent && "animate-pulse")} />
                            Actualiser (Admin)
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setIsAdminDialogOpen(true)} className="text-slate-400 hover:text-blue-600">
                            <LockIcon className="w-4 h-4 mr-2" />
                            Mode Admin pour actualiser
                          </Button>
                        )}
                      </div>
                    </div>
                  <AINewsView aiNews={aiNews} onRefresh={() => handleForceRefresh('aiNews')} isLoading={isLoadingContent} />
                </motion.div>
              ) : activeTab === 'seo' && isAdmin ? (
                <motion.div
                  key="seo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-5xl mx-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Analyse SEO Fiscale</h2>
                    <p className="text-sm text-slate-500">Performance de vos contenus sur les moteurs de recherche.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="border-blue-100 bg-blue-50/30">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          Diagnostic API Gemini
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600">
                          Pour vérifier si l'API est bien configurée :
                        </p>
                        <ol className="text-sm text-slate-600 list-decimal list-inside space-y-2">
                          <li>Vérifiez la variable <code className="bg-slate-200 px-1 rounded">GEMINI_API_KEY</code> dans les paramètres.</li>
                          <li>Cliquez sur le bouton <strong>Actualiser</strong> dans la Revue de Presse.</li>
                          <li>Si de nouveaux articles apparaissent avec la date d'aujourd'hui, l'API fonctionne.</li>
                          <li>En cas d'erreur, vérifiez les logs du serveur.</li>
                        </ol>
                        <Button 
                          onClick={() => handleForceRefresh('news')} 
                          disabled={isLoadingContent}
                          className="w-full bg-blue-600"
                        >
                          {isLoadingContent ? "Génération en cours..." : "Tester la génération IA"}
                        </Button>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          Conseils SEO 2026
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-slate-600">
                        <p>• Utilisez des titres avec l'année <strong>2026</strong>.</p>
                        <p>• Citez les articles du <strong>CGI</strong> (Code Général des Impôts).</p>
                        <p>• Ajoutez des liens vers la <strong>DGI</strong> ou le <strong>Bulletin Officiel</strong>.</p>
                        <p>• Publiez au moins 2 articles par semaine via l'IA.</p>
                      </CardContent>
                    </Card>
                  </div>
                  <SEOView />
                </motion.div>
              ) : activeTab === 'adsense' && isAdmin ? (
                <motion.div
                  key="adsense"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-5xl mx-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Monétisation AdSense</h2>
                    <p className="text-sm text-slate-500">Suivi de vos revenus publicitaires.</p>
                  </div>
                  <AdSenseView />
                </motion.div>
              ) : activeTab === 'calendar' ? (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex items-center justify-center"
                >
                  <CalendarView />
                </motion.div>
              ) : activeTab === 'ir' ? (
                <motion.div
                  key="ir"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex items-center justify-center"
                >
                  <IRSimulatorView />
                </motion.div>
              ) : activeTab === 'is' ? (
                <motion.div
                  key="is"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex items-center justify-center"
                >
                  <ISSimulatorView />
                </motion.div>
              ) : activeTab === 'tva' ? (
                <motion.div
                  key="tva"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex items-center justify-center"
                >
                  <TVACalculatorView />
                </motion.div>
              ) : activeTab === 'directory' ? (
                <motion.div
                  key="directory"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-6xl mx-auto"
                >
                  <DirectoryView />
                </motion.div>
              ) : activeTab === 'assistant' ? (
                <motion.div
                  key="assistant"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="h-full max-w-4xl mx-auto flex flex-col"
                >
                  <Card className="flex-1 flex flex-col shadow-xl border-slate-200 overflow-hidden min-h-0">
                    <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Assistant Fiscal IA</CardTitle>
                          <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-green-600">Expertise Marocaine</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-slate-200">CGI 2026</Badge>
                        <Button variant="ghost" size="icon" className="text-slate-400"><MoreHorizontal className="w-5 h-5" /></Button>
                      </div>
                    </CardHeader>
                    <ScrollArea className="flex-1 h-full" ref={scrollRef}>
                      <div className="p-6 space-y-6">
                        {messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                                msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
                              }`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                              </div>
                              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                  ? 'bg-blue-600 text-white rounded-tr-none' 
                                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                              }`}>
                                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-white">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200 shadow-sm">
                                <div className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <CardFooter className="p-4 border-t bg-white">
                      <div className="flex w-full items-center gap-2">
                        <Input 
                          placeholder="Posez votre question fiscale (ex: Quel est le taux d'IS pour 2026 ?)" 
                          className="flex-1 h-11 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button 
                          size="icon" 
                          className="h-11 w-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
                          onClick={handleSendMessage}
                          disabled={isChatLoading || !chatInput.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ) : activeTab === 'recommendations' ? (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-5xl mx-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Recommandations IA Personnalisées</h2>
                    <p className="text-sm text-slate-500">Conseils stratégiques basés sur l'analyse de votre profil et de la réglementation 2026.</p>
                  </div>
                  <RecommendationsView />
                </motion.div>
              ) : activeTab === 'community' ? (
                <motion.div
                  key="community"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-6xl mx-auto"
                >
                  <CommunityView />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                  <div className="p-6 bg-slate-100 rounded-full">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <p className="text-sm font-medium">Module "{activeTab}" en cours de développement par l'IA...</p>
                </div>
              )}
            </AnimatePresence>
          </main>

          {/* Floating Action Button for Mobile */}
          <Button className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 shadow-2xl shadow-blue-200 z-50">
            <Plus className="w-6 h-6" />
          </Button>

          <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  Résumé IA : {selectedDoc?.title}
                </DialogTitle>
                <DialogDescription>
                  Analyse automatique basée sur les dernières réglementations.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {isSummarizing ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Analyse du document en cours...</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <p className="text-slate-700 leading-relaxed text-sm italic">
                      "{summary}"
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source: Ledger Fiscal IA</span>
                      <Badge className="bg-blue-100 text-blue-700 border-none text-[10px]">CGI 2026</Badge>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedDoc(null)}>Fermer</Button>
                <a 
                  href={selectedDoc?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le PDF complet
                </a>
              </DialogFooter>
            </DialogContent>
          </Dialog>
