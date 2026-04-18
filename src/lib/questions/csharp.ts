import { QuestionBankItem } from './types';

export const csharpQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "Which keyword is used to declare a constant in C#?", options: ["const", "final", "readonly", "static"], answer: "const" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is the entry point of a C# console application?", options: ["start()", "main()", "Main()", "init()"], answer: "Main()" },
  { difficulty: 'Beginner', type: 'true_false', question: "C# is an object-oriented language.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is a Namespace in C#?", answer: "A namespace is a way to organize classes and other types into logical groups and prevent naming conflicts." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the difference between 'ref' and 'out' parameters?", options: ["They are the same", "'ref' requires initialization before passing, 'out' does not", "'out' requires initialization, 'ref' does not", "None of the above"], answer: "'ref' requires initialization before passing, 'out' does not" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which collection is best for unique items in C#?", options: ["List<T>", "Dictionary<T, K>", "HashSet<T>", "Array"], answer: "HashSet<T>" },
  { difficulty: 'Intermediate', type: 'true_false', question: "C# support 'async' and 'await' for asynchronous programming.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between an Interface and an Abstract Class?", answer: "An interface can only have method signatures (mostly), while an abstract class can have both signatures and implementations. A class can implement multiple interfaces but inherit only one abstract class." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of the 'using' statement in C#?", options: ["To import a namespace", "To ensure proper disposal of objects that implement IDisposable", "To define a generic type", "To handle exceptions"], answer: "To ensure proper disposal of objects that implement IDisposable" },
  { difficulty: 'Advanced', type: 'true_false', question: "Delegates are types that represent references to methods.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is LINQ in C#?", answer: "LINQ (Language Integrated Query) is a set of features that extends C# with native data querying capabilities for various data sources." },
];
