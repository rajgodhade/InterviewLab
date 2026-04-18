import { QuestionBankItem } from './types';

export const typescriptQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What is TypeScript?", options: ["A new programming language", "A superset of JavaScript", "A JavaScript library", "A database system"], answer: "A superset of JavaScript" },
  { difficulty: 'Beginner', type: 'mcq', question: "How do you specify the type of a variable in TypeScript?", options: ["variable: type", "type variable", "variable as type", "variable.type"], answer: "variable: type" },
  { difficulty: 'Beginner', type: 'true_false', question: "TypeScript code can be run directly in the browser.", answer: "False" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is 'any' type in TypeScript?", answer: "The 'any' type is a powerful way to work with existing JavaScript, allowing you to opt-out of type checking and let the values pass through compile-time checks." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which keyword is used to create a custom type in TypeScript?", options: ["type", "interface", "class", "Both type and interface"], answer: "Both type and interface" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is an enum in TypeScript?", options: ["A way to define constants", "A type of array", "A function decorator", "A module loader"], answer: "A way to define constants" },
  { difficulty: 'Intermediate', type: 'true_false', question: "TypeScript support generic types.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between an Interface and a Type alias?", answer: "Interfaces are mostly used for defining the shape of objects and can be merged. Type aliases can define primitives, unions, and intersections, but cannot be merged." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What are Decorators in TypeScript?", options: ["CSS styles", "Functions that modify classes or members", "Code comments", "Package managers"], answer: "Functions that modify classes or members" },
  { difficulty: 'Advanced', type: 'true_false', question: "The 'keyof' operator returns a union of keys from an object type.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What are Utility Types in TypeScript?", answer: "Utility types (like Partial, Readonly, Pick, Omit) are built-in types that help in transforming and manipulating existing types into new ones." },
];
