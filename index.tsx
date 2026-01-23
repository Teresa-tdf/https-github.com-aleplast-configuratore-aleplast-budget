import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  BadgeCheck, 
  Phone, 
  Mail,
  Home,
  Star,
  Award,
  Sparkles
} from 'lucide-react';

// --- Types ---

type Step = 'landing' | 'quiz' | 'lead-form' | 'result' | 'thank-you';

type ProductType = 'window' | 'sliding' | 'door';

interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  features: string[];
  scores: {
    light: number;
    thermal: number;
    design: number;
    value: number;
    acoustic: number;
  };
  imagePlaceholder: React.ReactNode;
}

interface QuestionOption {
  id: string;
  label: string;
  description?: string; // Added description for richer UI
  scoreEffect?: Partial<{
    light: number;
    thermal: number;
    design: number;
    value: number;
    acoustic: number;
  }>;
  typeFilter?: ProductType; 
}

interface Question {
  id: number;
  category: string;
  text: string;
  options: QuestionOption[];
}

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  privacy: boolean;
  marketing: boolean;
}

// --- Icons Helper ---
// Simple placeholder icons for products, usually these would be real images
const Icons = {
  Window: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full text-white/80">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  Sliding: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full text-white/80">
      <rect x="2" y="3" width="20" height="18" rx="1" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M14 12h4m-2-2v4" strokeWidth="2" />
    </svg>
  ),
  Door: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full text-white/80">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
    </svg>
  )
};

// --- Data ---

const PRODUCTS: Product[] = [
  {
    id: 'prolux',
    name: 'Oknoplast Prolux',
    type: 'window',
    description: 'La finestra che fa entrare fino al 22% di luce in più grazie al profilo ridotto ed elegante.',
    features: ['Profilo snello', 'Più luce naturale', 'Design simmetrico', 'Ideale per ristrutturazioni'],
    scores: { light: 10, thermal: 7, design: 8, value: 7, acoustic: 7 },
    imagePlaceholder: <Icons.Window />
  },
  {
    id: 'prismatic',
    name: 'Oknoplast Prismatic',
    type: 'window',
    description: 'Il perfetto equilibrio tra design moderno e prestazioni termiche eccezionali.',
    features: ['Linee squadrate', 'Isolamento superiore', 'Stabilità strutturale', 'Design moderno'],
    scores: { light: 8, thermal: 9, design: 10, value: 7, acoustic: 8 },
    imagePlaceholder: <Icons.Window />
  },
  {
    id: 'winergetic',
    name: 'Winergetic Premium Passive',
    type: 'window',
    description: 'Il massimo dell’isolamento termico per case a basso consumo e passive.',
    features: ['Triplo vetro di serie', 'Barriera spaziale', 'Massimo risparmio energetico', 'Certificata CasaClima'],
    scores: { light: 6, thermal: 10, design: 6, value: 6, acoustic: 10 },
    imagePlaceholder: <Icons.Window />
  },
  {
    id: 'koncept',
    name: 'Oknoplast Koncept',
    type: 'window',
    description: 'La soluzione versatile e conveniente con la qualità garantita Oknoplast.',
    features: ['Design classico', 'Ottimo rapporto qualità/prezzo', 'Robustezza', 'Funzionalità'],
    scores: { light: 5, thermal: 6, design: 5, value: 10, acoustic: 6 },
    imagePlaceholder: <Icons.Window />
  },
  {
    id: 'hst',
    name: 'Oknoplast HST Motion',
    type: 'sliding',
    description: 'Alzante scorrevole per grandi vetrate che unisce vista panoramica e facilità d’uso.',
    features: ['Grandi dimensioni', 'Soglia a pavimento', 'Scorrimento leggero', 'Luce massima'],
    scores: { light: 10, thermal: 8, design: 10, value: 5, acoustic: 7 },
    imagePlaceholder: <Icons.Sliding />
  },
  {
    id: 'tenvis',
    name: 'Portoncino Tenvis',
    type: 'door',
    description: 'Sicurezza antieffrazione e design curato per l’ingresso della tua casa.',
    features: ['Alta sicurezza', 'Isolamento termico', 'Design personalizzabile', 'Smart home ready'],
    scores: { light: 0, thermal: 9, design: 9, value: 6, acoustic: 8 },
    imagePlaceholder: <Icons.Door />
  }
];

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: 'Tipologia',
    text: 'Cosa stai cercando per la tua casa?',
    options: [
      { id: 'windows', label: 'Nuove Finestre', typeFilter: 'window' },
      { id: 'sliding', label: 'Grandi Vetrate Scorrevoli', typeFilter: 'sliding' },
      { id: 'door', label: 'Portoncino d\'Ingresso', typeFilter: 'door' }
    ]
  },
  {
    id: 2,
    category: 'Contesto',
    text: 'In che situazione ti trovi?',
    options: [
      { id: 'reno', label: 'Ristrutturazione', description: 'Sostituisco vecchi infissi', scoreEffect: { thermal: 2, acoustic: 1 } },
      { id: 'new', label: 'Nuova Costruzione', description: 'Cantiere in corso', scoreEffect: { design: 2, thermal: 1 } },
      { id: 'mix', label: 'Valutazione', description: 'Mi sto informando', scoreEffect: { value: 1 } }
    ]
  },
  {
    id: 3,
    category: 'Priorità',
    text: 'Qual è il desiderio principale?',
    options: [
      { id: 'light', label: 'Luce Naturale', description: 'Voglio ambienti luminosi', scoreEffect: { light: 5 } },
      { id: 'warm', label: 'Isolamento Termico', description: 'Risparmio in bolletta', scoreEffect: { thermal: 5 } },
      { id: 'style', label: 'Design Moderno', description: 'Estetica minimale', scoreEffect: { design: 5 } }
    ]
  },
  {
    id: 4,
    category: 'Stile',
    text: 'Quale stile senti più tuo?',
    options: [
      { id: 'modern', label: 'Amo le linee moderne e pulite', description: 'Grandi vetrate, profili squadrati, minimalismo.', scoreEffect: { design: 3 } },
      { id: 'classic', label: 'Preferisco uno stile classico', description: 'Forme più morbide e tradizionali.', scoreEffect: { value: 2 } },
      { id: 'rustic', label: 'Mi piacciono gli ambienti caldi', description: 'Effetto legno, finiture naturali e accoglienti.', scoreEffect: { acoustic: 1, thermal: 1 } }
    ]
  },
  {
    id: 5,
    category: 'Estetica',
    text: 'Cosa ti colpisce in una finestra?',
    options: [
      { id: 'slim', label: 'Profilo Sottile', description: 'Più vetro, meno telaio', scoreEffect: { light: 3, design: 2 } },
      { id: 'robust', label: 'Solidità', description: 'Struttura importante', scoreEffect: { thermal: 2, acoustic: 2 } },
      { id: 'square', label: 'Forme Squadrate', description: 'Design geometrico', scoreEffect: { design: 3 } }
    ]
  },
  {
    id: 6,
    category: 'Clima',
    text: 'Dove si trova l\'immobile?',
    options: [
      { id: 'wind', label: 'Zona Esposta', description: 'Vento forte o intemperie', scoreEffect: { thermal: 3 } },
      { id: 'cold', label: 'Zona Interna', description: 'Inverni più rigidi', scoreEffect: { thermal: 4 } },
      { id: 'mild', label: 'Zona Costiera', description: 'Clima mite', scoreEffect: { light: 1, design: 1 } }
    ]
  },
  {
    id: 7,
    category: 'Acustica',
    text: 'Com\'è la zona circostante?',
    options: [
      { id: 'city', label: 'Rumorosa', description: 'Traffico o centro città', scoreEffect: { acoustic: 5 } },
      { id: 'avg', label: 'Residenziale', description: 'Rumore nella media', scoreEffect: { acoustic: 2 } },
      { id: 'quiet', label: 'Tranquilla', description: 'Silenzio e pace', scoreEffect: { value: 1 } }
    ]
  },
  {
    id: 8,
    category: 'Spazio',
    text: 'Hai vincoli di spazio?',
    options: [
      { id: 'tight', label: 'Spazio Limitato', description: 'Apertura ante difficile', scoreEffect: { design: 2 } },
      { id: 'plenty', label: 'Ampio Spazio', description: 'Nessun problema', scoreEffect: { value: 1 } },
      { id: 'more', label: 'Vorrei più spazio', description: 'Ottimizzare l\'abitabilità', scoreEffect: { light: 1 } }
    ]
  },
  {
    id: 9,
    category: 'Investimento',
    text: 'Hai già un\'idea del budget da dedicare ai nuovi serramenti?',
    options: [
      { id: 'premium', label: 'Voglio il massimo della qualità', description: 'Cerco una soluzione definitiva, il budget è secondario.', scoreEffect: { design: 2, thermal: 2 } },
      { id: 'value', label: 'Ho un\'idea di spesa definita', description: 'Cerco il miglior rapporto qualità/prezzo.', scoreEffect: { value: 3, design: 1 } },
      { id: 'budget', label: 'Vorrei valutare una soluzione essenziale', description: 'Vorrei contenere i costi dove possibile.', scoreEffect: { value: 5 } }
    ]
  },
  {
    id: 10,
    category: 'Bonus',
    text: 'Ti interessano le detrazioni?',
    options: [
      { id: 'vital', label: 'Fondamentali', description: 'Ecobonus / CasaClima', scoreEffect: { thermal: 3 } },
      { id: 'imp', label: 'Utili', description: 'Se disponibili, bene', scoreEffect: { thermal: 1 } },
      { id: 'low', label: 'Indifferenti', description: 'Non è la priorità', scoreEffect: { value: 2 } }
    ]
  }
];

// --- UI Components ---

const Logo = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="border-2 border-white w-10 h-10 flex items-center justify-center mb-2">
      <div className="w-2 h-2 bg-white rounded-sm"></div>
    </div>
    <div className="text-2xl tracking-[0.2em] font-light text-white leading-none">
      ALE<span className="font-bold">PLAST</span>
    </div>
  </div>
);

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
    <div 
      className="h-full bg-brand-accent shadow-[0_0_10px_rgba(46,116,181,0.6)] transition-all duration-700 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

// --- Main Application ---

const AleplastQuiz = () => {
  const [step, setStep] = useState<Step>('landing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [leadData, setLeadData] = useState<LeadData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    privacy: false,
    marketing: false
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LeadData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Logic ---

  const handleOptionSelect = (questionId: number, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    // Smooth transition
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 400); // Slightly longer for the animation feel
    } else {
      setTimeout(() => {
        setStep('lead-form');
      }, 400);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('landing');
    }
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: any = {};
    if (!leadData.firstName) errors.firstName = 'Campo obbligatorio';
    if (!leadData.lastName) errors.lastName = 'Campo obbligatorio';
    if (!leadData.email || !/\S+@\S+\.\S+/.test(leadData.email)) errors.email = 'Email non valida';
    if (!leadData.phone) errors.phone = 'Campo obbligatorio';
    if (!leadData.privacy) errors.privacy = 'Devi accettare la privacy policy';
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setStep('result');
      }, 1500);
    }
  };

  const calculateResult = useMemo(() => {
    const q1Answer = answers[1];
    const typeFilterOption = QUESTIONS[0].options.find(o => o.id === q1Answer);
    const requiredType = typeFilterOption?.typeFilter || 'window';

    const userScores = { light: 0, thermal: 0, design: 0, value: 0, acoustic: 0 };
    
    Object.entries(answers).forEach(([qId, optId]) => {
      const question = QUESTIONS.find(q => q.id === parseInt(qId));
      const option = question?.options.find(o => o.id === optId);
      if (option?.scoreEffect) {
        Object.entries(option.scoreEffect).forEach(([key, val]) => {
          userScores[key as keyof typeof userScores] += val;
        });
      }
    });

    let filteredProducts = PRODUCTS.filter(p => p.type === requiredType);
    if (filteredProducts.length === 0) filteredProducts = PRODUCTS.filter(p => p.type === 'window');

    const scoredProducts = filteredProducts.map(product => {
      let score = 0;
      score += product.scores.light * (userScores.light || 1);
      score += product.scores.thermal * (userScores.thermal || 1);
      score += product.scores.design * (userScores.design || 1);
      score += product.scores.value * (userScores.value || 1);
      score += product.scores.acoustic * (userScores.acoustic || 1);
      return { product, score };
    });

    scoredProducts.sort((a, b) => b.score - a.score);

    return {
      winner: scoredProducts[0]?.product,
      userProfile: userScores
    };
  }, [answers]);

  // --- Views ---

  if (step === 'landing') {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto animate-fade-in">
          <div className="mb-12">
            <Logo />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 text-xs font-semibold tracking-widest uppercase mb-8 backdrop-blur-sm">
            <Star className="w-3 h-3 fill-current" />
            Premium Partner Oknoplast
          </div>

          <h1 className="text-4xl md:text-6xl font-light mb-8 leading-tight tracking-tight">
            Il serramento perfetto <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
              esiste.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-xl mx-auto font-light leading-relaxed">
            Un'esperienza guidata per identificare la soluzione tecnica ed estetica ideale per la tua casa in Sardegna.
          </p>

          <button 
            onClick={() => setStep('quiz')}
            className="group relative px-10 py-5 text-lg font-medium text-white transition-all duration-300 ease-out"
          >
            <div className="absolute inset-0 bg-brand-accent rounded-sm transform group-hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(46,116,181,0.4)]"></div>
            <div className="relative flex items-center gap-3">
              Inizia l'Esperienza
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 text-xs text-gray-500 font-medium tracking-wider uppercase">
            <div className="flex flex-col items-center gap-2">
              <Award className="w-5 h-5 text-gray-600" />
              Consulenza Tecnica
            </div>
            <div className="flex flex-col items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-gray-600" />
              Qualità Certificata
            </div>
            <div className="hidden md:flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-600" />
              Design Esclusivo
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

    return (
      <div className="min-h-screen flex flex-col max-w-5xl mx-auto p-6 md:p-12 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 relative z-10">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors uppercase tracking-widest font-medium"
          >
            <div className="p-2 rounded-full border border-white/10 group-hover:border-white/40 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Indietro
          </button>
          <div className="text-xs font-semibold tracking-widest text-brand-accent uppercase">
            Passo {currentQuestionIndex + 1} / {QUESTIONS.length}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-16">
          <ProgressBar progress={progress} />
        </div>

        {/* Question Content */}
        <div className="flex-1 flex flex-col justify-center animate-slide-up">
          <div className="text-center mb-16">
            <span className="text-brand-accent font-medium tracking-[0.2em] uppercase text-xs mb-4 block">
              {currentQuestion.category}
            </span>
            <h2 className="text-3xl md:text-5xl font-light text-white leading-tight">
              {currentQuestion.text}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                  className={`
                    group relative flex flex-col items-center justify-center p-8 text-center rounded-xl transition-all duration-300 border
                    ${isSelected 
                      ? 'bg-brand-accent/10 border-brand-accent shadow-glow translate-y-[-4px]' 
                      : 'bg-brand-glass border-brand-glassBorder hover:border-brand-accent/50 hover:bg-white/5 hover:translate-y-[-4px] hover:shadow-lg'}
                  `}
                >
                  {/* Selection Indicator */}
                  <div className={`
                    w-6 h-6 rounded-full border mb-6 flex items-center justify-center transition-all duration-300
                    ${isSelected
                      ? 'border-brand-accent bg-brand-accent scale-110 shadow-glow'
                      : 'border-white/20 group-hover:border-brand-accent/50'}
                  `}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>

                  <span className={`text-lg font-medium mb-2 transition-colors ${isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                    {option.label}
                  </span>
                  
                  {option.description && (
                    <span className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors font-light">
                      {option.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'lead-form') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-xl mx-auto animate-fade-in relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-[100px]"></div>

        <div className="w-full relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-accent border border-brand-accent/30 shadow-glow">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-light mb-3">Analisi Completata</h2>
            <p className="text-gray-400 font-light">
              Abbiamo individuato la soluzione perfetta.<br/>
              Inserisci i tuoi dati per visualizzare il risultato.
            </p>
          </div>

          <form onSubmit={handleLeadSubmit} className="space-y-5 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Nome</label>
                <input
                  type="text"
                  value={leadData.firstName}
                  onChange={e => setLeadData({...leadData, firstName: e.target.value})}
                  className="w-full bg-black/20 border-b border-white/20 focus:border-brand-accent px-0 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors rounded-t-lg px-2"
                  placeholder="Il tuo nome"
                />
                {formErrors.firstName && <span className="text-red-400 text-xs">{formErrors.firstName}</span>}
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Cognome</label>
                <input
                  type="text"
                  value={leadData.lastName}
                  onChange={e => setLeadData({...leadData, lastName: e.target.value})}
                  className="w-full bg-black/20 border-b border-white/20 focus:border-brand-accent px-0 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors rounded-t-lg px-2"
                  placeholder="Il tuo cognome"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={leadData.email}
                  onChange={e => setLeadData({...leadData, email: e.target.value})}
                  className="w-full bg-black/20 border-b border-white/20 focus:border-brand-accent px-0 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors rounded-t-lg px-2 pl-9"
                  placeholder="name@example.com"
                />
                <Mail className="absolute left-2 top-3 w-4 h-4 text-gray-500" />
              </div>
              {formErrors.email && <span className="text-red-400 text-xs">{formErrors.email}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Telefono</label>
              <div className="relative">
                <input
                  type="tel"
                  value={leadData.phone}
                  onChange={e => setLeadData({...leadData, phone: e.target.value})}
                  className="w-full bg-black/20 border-b border-white/20 focus:border-brand-accent px-0 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors rounded-t-lg px-2 pl-9"
                  placeholder="+39 ..."
                />
                <Phone className="absolute left-2 top-3 w-4 h-4 text-gray-500" />
              </div>
              {formErrors.phone && <span className="text-red-400 text-xs">{formErrors.phone}</span>}
            </div>

            <div className="pt-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={leadData.privacy}
                    onChange={e => setLeadData({...leadData, privacy: e.target.checked})}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/30 bg-transparent checked:border-brand-accent checked:bg-brand-accent transition-all"
                  />
                  <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                  Ho letto e accetto la <a href="#" className="text-brand-accent hover:underline">Privacy Policy</a>. *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={leadData.marketing}
                    onChange={e => setLeadData({...leadData, marketing: e.target.checked})}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/30 bg-transparent checked:border-brand-accent checked:bg-brand-accent transition-all"
                  />
                  <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                  Acconsento a ricevere comunicazioni personalizzate (Opzionale).
                </span>
              </label>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 bg-brand-accent hover:bg-[#2364a0] text-white font-medium tracking-wide py-4 rounded-lg transition-all shadow-glow flex items-center justify-center uppercase text-sm"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Visualizza il Risultato'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const { winner, userProfile } = calculateResult;
    
    if (!winner) return <div>Errore nel calcolo del risultato.</div>;

    // Determine key benefits
    const benefits = [];
    if (userProfile.light >= 3) benefits.push("Massima luminosità naturale");
    if (userProfile.thermal >= 3) benefits.push("Efficienza energetica superiore");
    if (userProfile.design >= 3) benefits.push("Estetica minimale e moderna");
    if (userProfile.acoustic >= 3) benefits.push("Isolamento acustico avanzato");
    if (userProfile.value >= 3) benefits.push("Investimento intelligente");
    if (benefits.length === 0) benefits.push("Qualità certificata Oknoplast");

    return (
      <div className="min-h-screen p-6 pb-12 flex items-center justify-center animate-fade-in relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-5xl w-full relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-brand-gold/30 text-brand-gold bg-brand-gold/5 text-sm font-semibold tracking-widest uppercase mb-6 shadow-glow-gold">
              <Star className="w-4 h-4 fill-current" />
              Il Match Perfetto
            </div>
            <h2 className="text-4xl md:text-5xl font-light">
              La scelta ideale per te è <span className="font-bold text-white block mt-2">{winner.name}</span>
            </h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-50"></div>
            
            <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
              {/* Product Visual */}
              <div className="w-full md:w-1/2 aspect-square flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/5 p-12 shadow-inner">
                <div className="w-full h-full text-brand-accent drop-shadow-[0_0_15px_rgba(46,116,181,0.5)]">
                  {winner.imagePlaceholder}
                </div>
              </div>
              
              {/* Details */}
              <div className="flex-1 text-left space-y-8">
                <div>
                  <h3 className="text-3xl font-light text-brand-accent mb-4">{winner.name}</h3>
                  <p className="text-xl text-gray-300 font-light leading-relaxed">
                    {winner.description}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs text-gray-500 font-bold uppercase tracking-widest border-b border-white/10 pb-2">
                    Perché questa scelta:
                  </h4>
                  <ul className="space-y-3">
                    {benefits.slice(0, 4).map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-4 text-white">
                        <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-lg font-light">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setStep('thank-you')}
                    className="flex-1 bg-brand-accent hover:bg-[#2364a0] text-white font-medium py-4 px-8 rounded-lg transition-all shadow-glow text-center uppercase tracking-wide text-sm"
                  >
                    Richiedi Preventivo Gratuito
                  </button>
                  <a 
                    href="tel:+39079000000" 
                    className="flex-1 bg-transparent hover:bg-white/5 border border-white/20 text-white font-medium py-4 px-8 rounded-lg transition-all text-center flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Parla con un esperto
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'thank-you') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        
        <h2 className="text-4xl font-light mb-6">Richiesta Inviata</h2>
        
        <p className="text-xl text-gray-300 font-light max-w-lg mx-auto mb-12 leading-relaxed">
          Grazie {leadData.firstName}.<br/>
          <span className="text-white font-medium">Umberto e Alessandra</span> stanno analizzando il tuo profilo e ti ricontatteranno entro 48 ore.
        </p>
        
        <button 
          onClick={() => window.location.href = 'https://aleplast.it'}
          className="group text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-medium"
        >
          <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Torna al sito Aleplast
        </button>
      </div>
    );
  }

  return null;
};

const root = createRoot(document.getElementById('root')!);
root.render(<AleplastQuiz />);