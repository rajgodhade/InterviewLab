import { QuestionBankItem } from './types';

export const cppQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "Which header file is used for input/output in C++?", options: ["<stdio.h>", "<iostream>", "<conio.h>", "<stdlib.h>"], answer: "<iostream>" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which operator is used for dynamic memory allocation in C++?", options: ["malloc", "new", "alloc", "calloc"], answer: "new" },
  { difficulty: 'Beginner', type: 'true_false', question: "C++ supports both procedural and object-oriented programming.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is a pointer in C++?", answer: "A pointer is a variable that stores the memory address of another variable." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the purpose of a constructor in a class?", options: ["To delete an object", "To initialize an object", "To copy an object", "To define a private member"], answer: "To initialize an object" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which keyword is used for inheritance in C++?", options: ["extends", "inherits", ":", "base"], answer: ":" },
  { difficulty: 'Intermediate', type: 'true_false', question: "The 'this' pointer points to the current object instance.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between 'std::vector' and an array?", answer: "A vector is a dynamic array that can grow or shrink in size, while a regular array has a fixed size determined at compile time." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of the 'virtual' keyword in a function declaration?", options: ["To make a function private", "To enable polymorphism (late binding)", "To define a static function", "To prevent inheritance"], answer: "To enable polymorphism (late binding)" },
  { difficulty: 'Advanced', type: 'true_false', question: "C++ supports multiple inheritance.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What are Smart Pointers in C++?", answer: "Smart pointers (like std::unique_ptr, std::shared_ptr) are wrapper classes that manage the lifetime of dynamically allocated objects, automatically deleting them when they are no longer needed." },
];
