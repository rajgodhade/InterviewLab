import { QuestionBankItem } from './types';

export const angularQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What is the command to create a new Angular component using CLI?", options: ["ng new component", "ng create component", "ng g component", "ng add component"], answer: "ng g component" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which decorator is used to define an Angular module?", options: ["@Component", "@Directive", "@NgModule", "@Injectable"], answer: "@NgModule" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is the primary language used for Angular development?", options: ["JavaScript", "Python", "TypeScript", "Java"], answer: "TypeScript" },
  { difficulty: 'Beginner', type: 'true_false', question: "Angular uses two-way data binding by default with [(ngModel)].", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "Interpolation in Angular uses single curly braces {}.", answer: "False" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What are Angular directives?", answer: "Directives are classes that add new behavior to elements in the template. There are three types: Components, Structural directives (*ngIf, *ngFor), and Attribute directives (ngClass, ngStyle)." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which life cycle hook is called after Angular has initialized all data-bound properties?", options: ["ngOnInit", "ngOnChanges", "ngAfterContentInit", "ngDoCheck"], answer: "ngOnInit" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the purpose of a Pipe in Angular?", options: ["To handle routing", "To transform data in templates", "To manage state", "To inject services"], answer: "To transform data in templates" },
  { difficulty: 'Intermediate', type: 'true_false', question: "Reactive Forms are more scalable and robust than Template-driven forms.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is Dependency Injection in Angular?", answer: "DI is a coding pattern in which a class asks for dependencies from external sources rather than creating them itself. Angular's DI framework provides dependencies to components, directives, and services." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Explain the difference between a Component and a Directive.", answer: "A component is a directive with a template. It is a building block of an Angular application. A directive is used to add behavior to an existing DOM element. All components are directives, but not all directives are components." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of NgZone in Angular?", options: ["To manage routing", "To run code outside of Angular's change detection", "To handle HTTP requests", "To store global state"], answer: "To run code outside of Angular's change detection" },
  { difficulty: 'Advanced', type: 'true_false', question: "ChangeDetectionStrategy.OnPush can improve performance by reducing the number of checks.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is AOT compilation in Angular?", answer: "Ahead-of-Time (AOT) compilation converts Angular HTML and TypeScript code into efficient JavaScript code during the build phase, before the browser downloads and runs that code." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Explain the concept of Lazy Loading in Angular modules.", answer: "Lazy loading is a technique that allows you to load JavaScript components only when they are needed, rather than loading everything when the application starts. This significantly improves the initial load time of the application." },
];
