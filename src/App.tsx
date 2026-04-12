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
  Briefcase
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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

// --- Types ---

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
    url: 'https://www.tax.gov.ma/wps/wcm/connect/dgi_fr/resources/8f7b5c00445d4e8b9e5f9e5f9e5f9e5f/CGI+2024+FR.pdf'
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
    url: 'https://www.tax.gov.ma/wps/wcm/connect/dgi_fr/resources/7f7b5c00445d4e8b9e5f9e5f9e5f9e5f/NC+717+LF+2024.pdf'
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
    url: 'https://www.tax.gov.ma/wps/wcm/connect/dgi_fr/resources/6f7b5c00445d4e8b9e5f9e5f9e5f9e5f/CGI+2025+FR.pdf'
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
    url: 'https://www.tax.gov.ma/wps/wcm/connect/dgi_fr/resources/5f7b5c00445d4e8b9e5f9e5f9e5f9e5f/NC+738+LF+2025.pdf'
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
    url: 'https://www.tax.gov.ma/wps/wcm/connect/dgi_fr/resources/4f7b5c00445d4e8b9e5f9e5f9e5f9e5f/CGI+2026+FR.pdf'
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

const DashboardView = ({ onNavigate }: { onNavigate: (tab: string, filter?: string) => void }) => {
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
            <div className="text-3xl font-bold text-slate-900">12</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-red-500">
              <Bell className="w-3 h-3" />
              <span>3 critiques à traiter</span>
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
              {[
                { label: "Déclaration TVA", date: "Dans 2 jours", color: "bg-red-500" },
                { label: "Paiement IS", date: "Dans 5 jours", color: "bg-orange-500" },
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${alert.color}`} />
                    <span className="text-sm font-medium text-slate-700">{alert.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{alert.date}</span>
                </div>
              ))}
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
                  onClick={() => onNavigate('recommendations', rec.type)}
                >
                  <span className="text-sm text-slate-600 group-hover:text-blue-600 transition-colors">{rec.title}</span>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-tighter group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{rec.type}</Badge>
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
  const [result, setResult] = useState<number | null>(null);

  const calculateIR = () => {
    const s = parseFloat(salary);
    if (isNaN(s)) return;
    
    // Simple Moroccan IR simulation (simplified brackets)
    let ir = 0;
    if (s <= 2500) ir = 0;
    else if (s <= 4166) ir = (s * 0.10) - 250;
    else if (s <= 5000) ir = (s * 0.20) - 666.67;
    else if (s <= 6666) ir = (s * 0.30) - 1166.67;
    else if (s <= 15000) ir = (s * 0.34) - 1433.33;
    else ir = (s * 0.38) - 2033.33;

    setResult(Math.max(0, ir));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Simulateur IR Maroc 2026</h2>
        <p className="text-sm text-slate-500">Calculez votre Impôt sur le Revenu selon les derniers barèmes de la LF 2026.</p>
      </div>
      <Card className="border-slate-200 shadow-lg">
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
            Calculer l'Impôt
          </Button>
          
          {result !== null && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center"
            >
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Estimation IR Mensuel</p>
              <div className="text-4xl font-black text-blue-900 mt-2">
                {result.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xl">MAD</span>
              </div>
              <p className="text-[10px] text-blue-400 mt-4 italic">Note: Ce calcul est une estimation simplifiée. Consultez un expert pour un calcul précis.</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const NewsView = () => {
  const news = [
    { title: "Réforme de l'IS 2026 : Ce qu'il faut retenir", date: "12 Avril 2026", source: "L'Economiste", category: "Fiscalité", url: "https://leconomiste.com" },
    { title: "Nouveaux seuils pour le régime de l'auto-entrepreneur", date: "10 Avril 2026", source: "DGI", category: "Réglementation", url: "https://www.tax.gov.ma" },
    { title: "Digitalisation : La DGI lance une nouvelle plateforme", date: "08 Avril 2026", source: "Medias24", category: "Digital", url: "https://medias24.com" },
    { title: "Jurisprudence : Arrêt de la cour de cassation sur la TVA", date: "05 Avril 2026", source: "Justice.ma", category: "Juridique", url: "https://www.justice.gov.ma" },
  ];

  return (
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
              <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
};

const AINewsView = () => {
  const aiNews = [
    { title: "L'IA générative au service de l'audit fiscal", impact: "Élevé", topic: "Audit", url: "https://www.pwc.fr/fr/decryptages/transformation-digitale/ia-generative-audit.html" },
    { title: "Automatisation des déclarations de TVA par Ledger Fiscal", impact: "Moyen", topic: "Automatisation", url: "https://www.ey.com/fr_fr/tax/tax-automation" },
    { title: "Nouveau modèle Gemini 3 pour l'analyse juridique", impact: "Critique", topic: "LLM", url: "https://deepmind.google/technologies/gemini/" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {aiNews.map((item, i) => (
        <Card key={i} className="border-slate-200 overflow-hidden group">
          <div className="h-2 bg-blue-600" />
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">{item.topic}</Badge>
              <span className={`text-[10px] font-bold uppercase ${item.impact === 'Critique' ? 'text-red-500' : 'text-green-500'}`}>
                Impact {item.impact}
              </span>
            </div>
            <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Découvrez comment cette avancée technologique transforme le paysage fiscal marocain en 2026.</p>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t">
            <a 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-blue-600 hover:text-blue-700 gap-2"
              >
                Lire l'analyse <ChevronRight className="w-4 h-4" />
              </Button>
            </a>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const ISSimulatorView = () => {
  const [turnover, setTurnover] = useState<string>('');
  const [profit, setProfit] = useState<string>('');
  const [result, setResult] = useState<{ is: number, cm: number, final: number } | null>(null);

  const calculateIS = () => {
    const t = parseFloat(turnover) || 0;
    const p = parseFloat(profit) || 0;
    
    // Moroccan IS 2026 (Simplified for simulation)
    // Brackets: 0-300k: 10%, 300k-1M: 20%, >1M: 31% (Standard)
    let isAmount = 0;
    if (p <= 300000) isAmount = p * 0.10;
    else if (p <= 1000000) isAmount = (p * 0.20) - 30000;
    else isAmount = (p * 0.31) - 140000;

    // Cotisation Minimale (CM) - Standard rate 0.25% of turnover
    const cmAmount = t * 0.0025;

    setResult({
      is: Math.max(0, isAmount),
      cm: cmAmount,
      final: Math.max(isAmount, cmAmount)
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Simulateur IS Maroc 2026</h2>
        <p className="text-sm text-slate-500">Calculez votre Impôt sur les Sociétés et la Cotisation Minimale.</p>
      </div>
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          <Button onClick={calculateIS} className="w-full h-12 bg-blue-900 hover:bg-black text-white text-lg">
            Calculer l'IS
          </Button>
          
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">IS Théorique</p>
                  <p className="text-lg font-bold text-slate-900">{result.is.toLocaleString('fr-FR')} MAD</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cotisation Minimale</p>
                  <p className="text-lg font-bold text-slate-900">{result.cm.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>
              <div className="p-6 bg-blue-600 text-white rounded-2xl text-center shadow-xl shadow-blue-100">
                <p className="text-sm font-medium opacity-80 uppercase tracking-widest">Impôt à Payer (Le plus élevé)</p>
                <div className="text-4xl font-black mt-2">
                  {result.final.toLocaleString('fr-FR')} <span className="text-xl">MAD</span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CalendarView = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const getDeadlines = () => {
    const deadlines = [
      { day: 20, title: "Déclaration & Paiement TVA", type: "Mensuel", monthOffset: 0 },
      { day: 31, title: "Versement IS (Acompte)", type: "Trimestriel", months: [2, 5, 8, 11] },
      { day: 28, title: "Déclaration IR (Salaires)", type: "Mensuel", monthOffset: 0 },
      { day: 31, title: "Déclaration Annuelle IS", type: "Annuel", months: [2] },
      { day: 30, title: "Taxe Professionnelle", type: "Annuel", months: [5] },
    ];

    return deadlines
      .filter(d => !d.months || d.months.includes(currentMonth))
      .map(d => ({
        date: `${d.day} ${months[currentMonth]}`,
        title: d.title,
        type: d.type,
        isUrgent: d.day - today.getDate() < 5 && d.day >= today.getDate()
      }))
      .sort((a, b) => parseInt(a.date) - parseInt(b.date));
  };

  const events = getDeadlines();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Calendrier Fiscal Dynamique</h2>
        <Badge variant="outline" className="bg-white">{months[currentMonth]} {currentYear}</Badge>
      </div>
      <Card className="border-slate-200 shadow-xl">
        <CardHeader className="bg-slate-50 border-b py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Échéances du mois en cours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {events.length > 0 ? events.map((event, i) => (
              <div key={i} className={`p-5 flex items-center justify-between hover:bg-slate-50 transition-colors ${event.isUrgent ? 'bg-red-50/30' : ''}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shadow-sm ${
                    event.isUrgent ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase leading-none ${event.isUrgent ? 'text-red-100' : 'text-slate-400'}`}>
                      {event.date.split(' ')[1].substring(0, 3)}
                    </span>
                    <span className="text-xl font-black leading-none mt-1">{event.date.split(' ')[0]}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{event.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-slate-100 text-slate-500 border-none uppercase tracking-tighter">
                        {event.type}
                      </Badge>
                      {event.isUrgent && (
                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                  Détails
                </Button>
              </div>
            )) : (
              <div className="p-10 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-slate-600">Aucune échéance majeure pour le reste du mois.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-[10px] text-slate-400 text-center italic">
        * Ce calendrier est mis à jour automatiquement en fonction de la date système ({today.toLocaleDateString('fr-FR')}).
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

const GenerateArticleDialog = () => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Professionnel & Expert');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setGeneratedArticle('');
    try {
      const prompt = `En tant qu'expert fiscal marocain et rédacteur SEO, rédige un article de blog complet et structuré sur le sujet suivant : "${topic}". 
      Utilise les mots-clés : ${keywords}. 
      Le ton doit être : ${tone}. 
      L'article doit inclure un titre accrocheur, une introduction, des sous-titres (H2, H3), et une conclusion. 
      Optimise le contenu pour le SEO au Maroc pour l'année 2026.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setGeneratedArticle(response.text || "Désolé, je n'ai pas pu générer l'article.");
    } catch (error) {
      console.error("Generation error:", error);
      setGeneratedArticle("Désolé, une erreur est survenue lors de la génération de l'article.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-100">
            <Sparkles className="w-4 h-4" />
            Générer un article
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Générer un article IA</DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour rédiger un article fiscal optimisé SEO en quelques secondes.
          </DialogDescription>
        </DialogHeader>
        
        {!generatedArticle ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet de l'article</label>
              <Input 
                placeholder="Ex: Les nouveautés de la LF 2026 sur l'IS" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mots-clés cibles</label>
              <Input 
                placeholder="Ex: IS, Maroc, Fiscalité, 2026" 
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ton de l'article</label>
              <select 
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option>Professionnel & Expert</option>
                <option>Informatif & Simple</option>
                <option>Analytique & Critique</option>
              </select>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 py-4">
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
                {generatedArticle}
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2">
          {generatedArticle ? (
            <>
              <Button variant="outline" onClick={() => setGeneratedArticle('')}>Recommencer</Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
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
                Télécharger
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={handleGenerate}
                disabled={isGenerating || !topic}
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Génération...
                  </>
                ) : "Lancer la génération"}
              </Button>
            </>
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
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const text = response.text || "";
      const cleanedText = text.replace(/```json|```/g, '').trim();
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
                  <Badge className={`${
                    rec.priority === 'Critique' ? 'bg-red-500' : 
                    rec.priority === 'Haute' ? 'bg-orange-500' : 
                    rec.priority === 'Moyenne' ? 'bg-blue-500' : 'bg-slate-500'
                  } text-white border-none text-[9px]`}>
                    {rec.priority}
                  </Badge>
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
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${selectedRec.bgColor}`}>
                    <selectedRec.icon className={`w-6 h-6 ${selectedRec.color}`} />
                  </div>
                  <Badge variant="outline" className="uppercase tracking-widest text-[10px]">{selectedRec.type}</Badge>
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
  const [ht, setHt] = useState<string>('');
  const [rate, setRate] = useState<string>('20');
  
  const htVal = parseFloat(ht) || 0;
  const rateVal = parseFloat(rate) / 100;
  const tvaVal = htVal * rateVal;
  const ttcVal = htVal + tvaVal;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Calculateur TVA Rapide</h2>
        <p className="text-sm text-slate-500">Convertissez vos montants HT, TVA et TTC instantanément.</p>
      </div>
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Montant HT (MAD)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={ht}
                onChange={(e) => setHt(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Taux TVA (%)</label>
              <select 
                className="w-full h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              >
                <option value="20">20% (Standard)</option>
                <option value="14">14% (Transport, etc.)</option>
                <option value="10">10% (Hôtellerie, etc.)</option>
                <option value="7">7% (Eau, Electricité, etc.)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Montant TVA</span>
              <span className="text-lg font-bold text-slate-900">{tvaVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl">
              <span className="text-base font-medium opacity-80">Total TTC</span>
              <span className="text-2xl font-black">{ttcVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recommendationFilter, setRecommendationFilter] = useState('Tous');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre assistant fiscal IA. Comment puis-je vous aider dans vos recherches ou calculs fiscaux aujourd'hui ?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const handleSummarize = async (doc: Document) => {
    setSelectedDoc(doc);
    setIsSummarizing(true);
    setSummary('');
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `En tant qu'expert fiscal marocain, résume brièvement (3-4 phrases) l'importance et les points clés du document suivant pour l'année 2026 : "${doc.title}".`,
      });
      setSummary(response.text || "Désolé, je n'ai pas pu générer de résumé.");
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
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: chatInput,
        config: {
          systemInstruction: "Tu es un expert fiscal marocain de Ledger Fiscal Maroc. Tu aides les utilisateurs avec le Code Général des Impôts (CGI), les circulaires de la DGI et la jurisprudence. Réponds de manière professionnelle, précise et cite les articles si possible. Ton ton est sérieux et expert."
        }
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "Désolé, je n'ai pas pu générer de réponse." }]);
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

          <div className="flex-1 px-3 py-4 overflow-y-auto">
            <SectionTitle>Navigation</SectionTitle>
            <div className="space-y-1">
              <SidebarItem icon={LayoutDashboard} label="Tableau de bord" id="dashboard" />
              <SidebarItem icon={Users} label="Communauté" id="community" badge="Live" color="bg-green-500 text-white" />
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
              <SidebarItem icon={Calendar} label="Calendrier fiscal" id="calendar" />
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
          </div>

          {isAdmin && (
            <div className="p-4 border-t border-slate-100">
              <GenerateArticleDialog />
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
              <Button variant="ghost" size="icon" className="relative text-slate-500">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
              </Button>
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
                      <p className="text-xs font-bold text-slate-900 leading-none">{isAdmin ? 'Admin' : 'Utilisateur'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{isAdmin ? 'Accès Total' : 'Accès Public'}</p>
                    </div>
                  </Button>
                } />
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Connexion Administrateur</DialogTitle>
                    <DialogDescription>
                      Entrez le mot de passe pour accéder aux outils d'administration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
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
                  </div>
                  <DialogFooter>
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
                  <DashboardView onNavigate={(tab, filter) => {
                    setActiveTab(tab);
                    if (filter) setRecommendationFilter(filter);
                  }} />
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
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-2 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                    onClick={() => window.open(doc.url, '_blank')}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Télécharger
                                  </Button>
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
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Revue de Presse Fiscale</h2>
                    <p className="text-sm text-slate-500">Les dernières actualités juridiques et économiques du Maroc.</p>
                  </div>
                  <NewsView />
                </motion.div>
              ) : activeTab === 'ai-news' ? (
                <motion.div
                  key="ai-news"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-6xl mx-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Actualités Intelligence Artificielle</h2>
                    <p className="text-sm text-slate-500">Comment l'IA révolutionne la gestion fiscale et juridique.</p>
                  </div>
                  <AINewsView />
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
                    <div className="flex-1 p-6 overflow-y-auto" ref={scrollRef}>
                      <div className="space-y-6">
                        {messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                              </div>
                              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                  ? 'bg-blue-600 text-white rounded-tr-none' 
                                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                              }`}>
                                {msg.content}
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
                    </div>
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
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={() => {
                    if (selectedDoc?.url) {
                      window.open(selectedDoc.url, '_blank');
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                  Télécharger le PDF complet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
