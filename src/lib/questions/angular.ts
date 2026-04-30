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

  // ===== NEW BEGINNER (101–135) =====
  { difficulty: 'Beginner', type: 'mcq', question: "What symbol is used for interpolation?", options: ["{{ }}", "[ ]", "( )", "# "], answer: "{{ }}" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which decorator defines a module?", options: ["@Component", "@Injectable", "@NgModule", "@Directive"], answer: "@NgModule" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is the root component of an Angular app?", options: ["AppModule", "AppComponent", "MainComponent", "RootModule"], answer: "AppComponent" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which file contains Angular project configuration?", options: ["package.json", "angular.json", "tsconfig.json", "main.ts"], answer: "angular.json" },
  { difficulty: 'Beginner', type: 'mcq', question: "What does [(ngModel)] provide?", options: ["One-way binding", "Two-way binding", "Event binding", "Style binding"], answer: "Two-way binding" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which command creates a new Angular app?", options: ["ng build", "ng new", "ng serve", "ng generate"], answer: "ng new" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which command runs an Angular app locally?", options: ["ng run", "ng start", "ng serve", "ng launch"], answer: "ng serve" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is property binding syntax?", options: ["{{ }}", "[property]", "(event)", "#ref"], answer: "[property]" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is event binding syntax?", options: ["{{ }}", "[property]", "(event)", "#ref"], answer: "(event)" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which built-in pipe converts text to uppercase?", options: ["uppercase", "upper", "toUpper", "capslock"], answer: "uppercase" },
  { difficulty: 'Beginner', type: 'true_false', question: "Angular is maintained by Google.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "AngularJS and Angular are the same framework.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "A component must have a template.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "Angular apps are compiled to plain JavaScript.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "The *ngSwitch directive is used for conditional rendering.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the purpose of app.module.ts?", answer: "It is the root module that bootstraps the Angular application." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What does ng generate component do?", answer: "Creates a new component with its files using Angular CLI." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is a directive?", answer: "A class that adds behavior or modifies the DOM." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the difference between a class and an interface in Angular?", answer: "A class can have implementation; an interface defines a contract with no implementation." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is one-way data binding?", answer: "Data flows in one direction, from component to template." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the selector in a component decorator?", answer: "It defines the HTML tag used to include the component in a template." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What does the currency pipe do?", answer: "Formats a number as a currency string." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is FormsModule used for?", answer: "Enables template-driven forms and ngModel in Angular." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the purpose of index.html in Angular?", answer: "It is the main HTML page that hosts the Angular application." },
  { difficulty: 'Beginner', type: 'short_answer', question: "How do you apply a CSS class conditionally?", answer: "Using [ngClass] directive with a condition." },

  // ===== NEW INTERMEDIATE (136–170) =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which lifecycle hook is called on every input change?", options: ["ngOnInit", "ngOnChanges", "ngDoCheck", "ngAfterViewInit"], answer: "ngOnChanges" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What does the async pipe do?", options: ["Subscribes to Observable automatically", "Creates async functions", "Delays rendering", "Handles HTTP errors"], answer: "Subscribes to Observable automatically" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which RxJS operator cancels previous request on new emission?", options: ["mergeMap", "concatMap", "switchMap", "exhaustMap"], answer: "switchMap" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is ViewChild used for?", options: ["Access parent component", "Access child DOM element or component", "Create child routes", "Inject services"], answer: "Access child DOM element or component" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which operator filters Observable emissions?", options: ["map", "tap", "filter", "take"], answer: "filter" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is ContentChild used for?", options: ["Access projected content", "Access child routes", "Inject dependencies", "Query the DOM"], answer: "Access projected content" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What does ng-content do?", options: ["Injects a service", "Projects content into a component", "Defines a route", "Creates a pipe"], answer: "Projects content into a component" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which decorator is used to pass data into a child component?", options: ["@Output", "@Input", "@ViewChild", "@HostListener"], answer: "@Input" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which decorator emits events to a parent component?", options: ["@Output", "@Input", "@ViewChild", "@Inject"], answer: "@Output" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the purpose of BehaviorSubject?", options: ["Hold and emit the latest value to subscribers", "Create HTTP streams", "Define form validators", "Manage routes"], answer: "Hold and emit the latest value to subscribers" },
  { difficulty: 'Intermediate', type: 'true_false', question: "A Subject in RxJS is both an Observable and an Observer.", answer: "True" },
  { difficulty: 'Intermediate', type: 'true_false', question: "Template-driven forms use FormGroup explicitly.", answer: "False" },
  { difficulty: 'Intermediate', type: 'true_false', question: "CanActivate is a route guard interface.", answer: "True" },
  { difficulty: 'Intermediate', type: 'true_false', question: "ngAfterViewInit is called before ngOnInit.", answer: "False" },
  { difficulty: 'Intermediate', type: 'true_false', question: "FormControl tracks the value and validation status of a single input.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is EventEmitter?", answer: "A class used with @Output to emit custom events from a child component." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between Promise and Observable?", answer: "A Promise emits a single value; an Observable emits multiple values over time and is cancellable." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the purpose of RouterLink?", answer: "It is a directive used to navigate between routes declaratively in templates." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is an HTTP interceptor?", answer: "A service that intercepts HTTP requests and responses for tasks like adding headers or logging." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is ActivatedRoute?", answer: "A service that provides information about the currently active route." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the takeUntil operator used for?", answer: "To automatically unsubscribe from an Observable when a notifier emits." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is Angular's ChangeDetectorRef?", answer: "A service to manually control change detection for a component." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What are route parameters?", answer: "Dynamic values in the URL path used to pass data to a route." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Explain the difference between ngOnChanges and ngDoCheck.", answer: "ngOnChanges fires only when @Input properties change with simple reference changes. ngDoCheck fires on every change detection cycle, allowing custom detection logic for deep or complex changes." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Explain template-driven vs reactive forms.", answer: "Template-driven forms define logic in the HTML template using directives like ngModel, making them simpler but less scalable. Reactive forms define logic in the component class using FormGroup and FormControl, offering more control, testability, and scalability." },

  // ===== NEW ADVANCED (171–200) =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of InjectionToken?", options: ["Provide non-class dependencies", "Define routes", "Create pipes", "Handle errors"], answer: "Provide non-class dependencies" },
  { difficulty: 'Advanced', type: 'mcq', question: "Which zone is Angular's change detection tied to?", options: ["RootZone", "NgZone", "BrowserZone", "AppZone"], answer: "NgZone" },
  { difficulty: 'Advanced', type: 'mcq', question: "What does runOutsideAngular() do?", options: ["Runs code without triggering change detection", "Bypasses guards", "Skips HTTP interceptors", "Disables lazy loading"], answer: "Runs code without triggering change detection" },
  { difficulty: 'Advanced', type: 'mcq', question: "What is a standalone component in Angular?", options: ["Component without a module", "Component with lazy loading", "Component with SSR", "Component with no template"], answer: "Component without a module" },
  { difficulty: 'Advanced', type: 'mcq', question: "Which Angular feature replaces NgModules in modern apps?", options: ["Standalone APIs", "Ivy renderer", "NgZone", "Signals"], answer: "Standalone APIs" },
  { difficulty: 'Advanced', type: 'mcq', question: "What is Angular Signals?", options: ["Reactive state primitive", "HTTP library", "Routing feature", "Animation tool"], answer: "Reactive state primitive" },
  { difficulty: 'Advanced', type: 'mcq', question: "What is the Ivy renderer?", options: ["Angular's default compilation and rendering engine", "A state management library", "A routing strategy", "A CSS preprocessor"], answer: "Angular's default compilation and rendering engine" },
  { difficulty: 'Advanced', type: 'mcq', question: "What does tree shaking do?", options: ["Removes unused code from bundle", "Optimizes change detection", "Pre-renders routes", "Splits lazy modules"], answer: "Removes unused code from bundle" },
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of APP_INITIALIZER?", options: ["Run logic before app starts", "Define root module", "Bootstrap components", "Configure HttpClient"], answer: "Run logic before app starts" },
  { difficulty: 'Advanced', type: 'mcq', question: "What is dynamic component loading?", options: ["Creating components at runtime", "Lazy loading modules", "Pre-fetching routes", "Server rendering"], answer: "Creating components at runtime" },
  { difficulty: 'Advanced', type: 'true_false', question: "Angular Signals are synchronous by default.", answer: "True" },
  { difficulty: 'Advanced', type: 'true_false', question: "Standalone components require an NgModule to be declared.", answer: "False" },
  { difficulty: 'Advanced', type: 'true_false', question: "The Ivy engine enables better tree shaking than the View Engine.", answer: "True" },
  { difficulty: 'Advanced', type: 'true_false', question: "APP_INITIALIZER can return a Promise or Observable.", answer: "True" },
  { difficulty: 'Advanced', type: 'true_false', question: "Zone.js is required for Signals-based change detection.", answer: "False" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is the ComponentFactoryResolver?", answer: "A service used to dynamically create components at runtime." },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is the difference between forRoot and forChild in routing?", answer: "forRoot registers the router with app-wide providers once; forChild registers routes for feature modules without re-providing the router." },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is providedIn: 'root' in @Injectable?", answer: "It registers the service as a singleton at the root injector level, available app-wide." },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is a micro-frontend in Angular context?", answer: "An architecture where an app is divided into independently deployable frontend units, often using Module Federation." },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is Module Federation?", answer: "A Webpack feature that allows Angular apps to share and load remote modules at runtime." },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is the difference between mergeMap and concatMap?", answer: "mergeMap subscribes to inner Observables concurrently; concatMap waits for each to complete before subscribing to the next." },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is a memory leak in Angular and how do you prevent it?", answer: "A memory leak occurs when subscriptions are not unsubscribed. Prevent it using takeUntil, async pipe, or the Subscription.unsubscribe() pattern." },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is the purpose of ng-template?", answer: "It defines a reusable template block that is not rendered unless explicitly instantiated." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Explain the Angular compilation pipeline with Ivy.", answer: "Ivy is Angular's current compilation and rendering engine. It compiles components into efficient JavaScript instructions called 'locality', meaning each component is compiled independently. Ivy enables better tree shaking, smaller bundle sizes, faster testing, and improved debugging. It replaced the older View Engine starting in Angular 9." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Explain Angular Signals and how they differ from Observables.", answer: "Angular Signals are a reactive primitive introduced to simplify state management. A Signal holds a value and automatically notifies dependents when it changes, without needing subscriptions or manual unsubscription. Unlike Observables which are stream-based and require RxJS operators, Signals are synchronous, simpler to use, and integrate directly with Angular's change detection to enable zone-less applications." },

];