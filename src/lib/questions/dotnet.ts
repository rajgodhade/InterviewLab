import { QuestionBankItem } from './types';

export const dotnetQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What does CLR stand for in .NET?", options: ["Common Language Runtime", "Core Language Repository", "Common Level Runtime", "Code Linker Runtime"], answer: "Common Language Runtime" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which language is primarily used for .NET development?", options: ["Java", "C#", "C++", "Python"], answer: "C#" },
  { difficulty: 'Beginner', type: 'true_false', question: ".NET Core is cross-platform.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is NuGet?", answer: "NuGet is the package manager for .NET, used to discover, install, and manage libraries and dependencies." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the purpose of Entity Framework?", options: ["Unit testing", "ORM (Object-Relational Mapping)", "UI design", "Server configuration"], answer: "ORM (Object-Relational Mapping)" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which attribute is used to define an API route in ASP.NET Core?", options: ["[Route]", "[Path]", "[Url]", "[Link]"], answer: "[Route]" },
  { difficulty: 'Intermediate', type: 'true_false', question: "LINQ (Language Integrated Query) allows querying data from different sources using a consistent syntax.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is Dependency Injection (DI) in ASP.NET Core?", answer: "DI is a built-in feature in ASP.NET Core that manages the creation and lifetime of objects (services) and provides them to classes that need them." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of the 'Middleware' in ASP.NET Core?", options: ["To connect to the database", "To handle requests and responses in the pipeline", "To design the UI", "To compile the code"], answer: "To handle requests and responses in the pipeline" },
  { difficulty: 'Advanced', type: 'true_false', question: "The 'Kestrel' is a high-performance web server for .NET.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is Garbage Collection in .NET?", answer: "Garbage Collection is an automatic memory management feature that reclaims memory used by objects that are no longer being used by the application." },
];
