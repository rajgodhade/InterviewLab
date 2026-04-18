import { QuestionBankItem } from './types';

export const pythonQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "Which of the following is used to create a function in Python?", options: ["function", "def", "func", "define"], answer: "def" },
  { difficulty: 'Beginner', type: 'mcq', question: "How do you add a comment in Python?", options: ["//", "/* */", "#", "<!-- -->"], answer: "#" },
  { difficulty: 'Beginner', type: 'true_false', question: "Python is a case-sensitive language.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is a PEP in Python?", answer: "PEP stands for Python Enhancement Proposal. It is a design document providing information to the Python community or describing a new feature for Python." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the result of '2' + '3' in Python?", options: ["5", "23", "Error", "None"], answer: "23" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which method is used to remove an item from a list by value?", options: ["pop()", "remove()", "delete()", "discard()"], answer: "remove()" },
  { difficulty: 'Intermediate', type: 'true_false', question: "A list in Python is immutable.", answer: "False" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is a dictionary in Python?", answer: "A dictionary is an unordered collection of items. Each item is a key-value pair. Keys must be unique and immutable." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Explain the difference between a list and a tuple.", answer: "Lists are mutable, meaning their elements can be changed after creation. Tuples are immutable, meaning their elements cannot be changed after creation. Lists are defined with [] and tuples with ()." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of the '__init__' method in a class?", options: ["To delete an object", "To initialize an object's attributes", "To define a private method", "To inherit from another class"], answer: "To initialize an object's attributes" },
  { difficulty: 'Advanced', type: 'true_false', question: "Python supports multiple inheritance.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What are decorators in Python?", answer: "Decorators are a powerful tool in Python that allows you to modify the behavior of a function or class without permanently modifying its source code." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Explain the concept of 'List Comprehension'.", answer: "List comprehension offers a shorter syntax when you want to create a new list based on the values of an existing list. It consists of brackets containing an expression followed by a for clause." },
];
