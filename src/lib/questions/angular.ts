import { QuestionBankItem } from './types';

export const angularQuestions: QuestionBankItem[] = [

  // ===== BEGINNER (1–30) =====
  { difficulty: 'Beginner', type: 'mcq', question: "What is Angular?", options: ["Framework", "Library", "Language", "Database"], answer: "Framework" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which language is used in Angular?", options: ["Java", "Python", "TypeScript", "PHP"], answer: "TypeScript" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is a component?", options: ["Service", "UI block", "Module", "Pipe"], answer: "UI block" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which decorator defines a component?", options: ["@NgModule", "@Component", "@Injectable", "@Pipe"], answer: "@Component" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is interpolation?", options: ["Binding syntax", "Loop", "Condition", "Directive"], answer: "Binding syntax" },

  { difficulty: 'Beginner', type: 'true_false', question: "Angular CLI is used to create Angular projects.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "Angular supports two-way data binding.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "Components cannot have styles.", answer: "False" },

  { difficulty: 'Beginner', type: 'short_answer', question: "What is data binding?", answer: "It connects data between component and template." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is a module?", answer: "A module groups related components and services." },

  { difficulty: 'Beginner', type: 'mcq', question: "Which directive is used for looping?", options: ["*ngIf", "*ngFor", "*ngSwitch", "*ngLoop"], answer: "*ngFor" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which directive is used for condition?", options: ["*ngIf", "*ngFor", "*ngSwitch", "*ngClass"], answer: "*ngIf" },

  { difficulty: 'Beginner', type: 'short_answer', question: "What is a template?", answer: "HTML view of a component." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is Angular CLI?", answer: "Command-line tool to manage Angular apps." },

  { difficulty: 'Beginner', type: 'mcq', question: "What file starts Angular app?", options: ["main.ts", "app.ts", "index.js", "server.ts"], answer: "main.ts" },

  { difficulty: 'Beginner', type: 'true_false', question: "Services are used for business logic.", answer: "True" },

  { difficulty: 'Beginner', type: 'short_answer', question: "What is a service?", answer: "Reusable logic shared across components." },

  // ===== INTERMEDIATE (31–70) =====
  { difficulty: 'Intermediate', type: 'mcq', question: "What is Dependency Injection?", options: ["Design pattern", "Directive", "Pipe", "Module"], answer: "Design pattern" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "Explain DI.", answer: "Dependencies are provided externally instead of created inside class." },

  { difficulty: 'Intermediate', type: 'mcq', question: "Which lifecycle hook runs first?", options: ["ngOnInit", "constructor", "ngAfterViewInit", "ngOnChanges"], answer: "constructor" },

  { difficulty: 'Intermediate', type: 'true_false', question: "ngOnInit runs after constructor.", answer: "True" },

  { difficulty: 'Intermediate', type: 'short_answer', question: "What is ngOnInit?", answer: "Lifecycle hook called after component initialization." },

  { difficulty: 'Intermediate', type: 'mcq', question: "What is a pipe?", options: ["Service", "Transform data", "Directive", "Module"], answer: "Transform data" },

  { difficulty: 'Intermediate', type: 'short_answer', question: "What is a custom pipe?", answer: "User-defined data transformation." },

  { difficulty: 'Intermediate', type: 'mcq', question: "Which module handles routing?", options: ["RouterModule", "HttpModule", "FormsModule", "CoreModule"], answer: "RouterModule" },

  { difficulty: 'Intermediate', type: 'short_answer', question: "What is routing?", answer: "Navigation between views." },

  { difficulty: 'Intermediate', type: 'true_false', question: "Lazy loading improves performance.", answer: "True" },

  { difficulty: 'Intermediate', type: 'long_answer', question: "Explain lazy loading.", answer: "Loads modules only when required to reduce initial load time." },

  { difficulty: 'Intermediate', type: 'mcq', question: "Which form type is scalable?", options: ["Template", "Reactive", "Static", "Inline"], answer: "Reactive" },

  { difficulty: 'Intermediate', type: 'short_answer', question: "What is Reactive Form?", answer: "Form built using FormControl & FormGroup." },

  { difficulty: 'Intermediate', type: 'short_answer', question: "What is FormGroup?", answer: "Group of form controls." },

  { difficulty: 'Intermediate', type: 'mcq', question: "Which decorator is for services?", options: ["@Component", "@Injectable", "@Pipe", "@Directive"], answer: "@Injectable" },

  { difficulty: 'Intermediate', type: 'true_false', question: "Observables are part of RxJS.", answer: "True" },

  { difficulty: 'Intermediate', type: 'short_answer', question: "What is Observable?", answer: "Stream of async data." },

  { difficulty: 'Intermediate', type: 'mcq', question: "Which operator maps values?", options: ["map", "filter", "reduce", "find"], answer: "map" },

  { difficulty: 'Intermediate', type: 'short_answer', question: "What is HttpClient?", answer: "Service to make HTTP calls." },

  { difficulty: 'Intermediate', type: 'true_false', question: "Angular supports REST APIs.", answer: "True" },

  // ===== ADVANCED (71–100) =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is Change Detection?", options: ["Tracking changes", "Routing", "Rendering", "Compilation"], answer: "Tracking changes" },

  { difficulty: 'Advanced', type: 'short_answer', question: "Explain change detection.", answer: "Angular updates DOM when data changes." },

  { difficulty: 'Advanced', type: 'mcq', question: "Which strategy improves performance?", options: ["Default", "OnPush", "Lazy", "Fast"], answer: "OnPush" },

  { difficulty: 'Advanced', type: 'true_false', question: "OnPush reduces checks.", answer: "True" },

  { difficulty: 'Advanced', type: 'short_answer', question: "What is AOT?", answer: "Ahead-of-Time compilation." },

  { difficulty: 'Advanced', type: 'long_answer', question: "Explain AOT vs JIT.", answer: "AOT compiles before runtime, JIT compiles in browser." },

  { difficulty: 'Advanced', type: 'mcq', question: "What is NgZone?", options: ["State", "Execution context", "Routing", "Pipe"], answer: "Execution context" },

  { difficulty: 'Advanced', type: 'short_answer', question: "What is NgZone?", answer: "Controls Angular change detection execution." },

  { difficulty: 'Advanced', type: 'mcq', question: "What is trackBy?", options: ["Optimize ngFor", "Routing", "Pipe", "Service"], answer: "Optimize ngFor" },

  { difficulty: 'Advanced', type: 'short_answer', question: "What is trackBy?", answer: "Improves rendering performance in ngFor." },

  { difficulty: 'Advanced', type: 'true_false', question: "SSR improves SEO.", answer: "True" },

  { difficulty: 'Advanced', type: 'short_answer', question: "What is Angular Universal?", answer: "Server-side rendering for Angular." },

  { difficulty: 'Advanced', type: 'mcq', question: "What is state management?", options: ["Managing app data", "Routing", "Styling", "Testing"], answer: "Managing app data" },

  { difficulty: 'Advanced', type: 'short_answer', question: "What is NgRx?", answer: "Redux-like state management library." },

  { difficulty: 'Advanced', type: 'long_answer', question: "Explain NgRx.", answer: "Uses store, actions, reducers to manage state." },

  { difficulty: 'Advanced', type: 'mcq', question: "What is a resolver?", options: ["Fetch data before route", "Pipe", "Service", "Guard"], answer: "Fetch data before route" },

  { difficulty: 'Advanced', type: 'short_answer', question: "What is a guard?", answer: "Controls route access." },

  { difficulty: 'Advanced', type: 'true_false', question: "Guards protect routes.", answer: "True" },

  { difficulty: 'Advanced', type: 'short_answer', question: "What is interceptor?", answer: "Intercepts HTTP requests." },

  { difficulty: 'Advanced', type: 'long_answer', question: "Explain interceptors.", answer: "Used to modify HTTP requests/responses globally." },

];