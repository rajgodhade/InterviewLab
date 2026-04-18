import { QuestionBankItem } from './types';

export const javaQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What is the default value of an integer variable in Java?", options: ["0", "null", "undefined", "1"], answer: "0" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which keyword is used to inherit a class in Java?", options: ["implements", "inherits", "extends", "base"], answer: "extends" },
  { difficulty: 'Beginner', type: 'true_false', question: "Java is a platform-independent language.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the JVM?", answer: "JVM (Java Virtual Machine) is an abstract machine that provides a runtime environment in which Java bytecode can be executed." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which collection type allows storing key-value pairs in Java?", options: ["ArrayList", "HashSet", "HashMap", "LinkedList"], answer: "HashMap" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the purpose of the 'static' keyword?", options: ["To define a private variable", "To allow access without creating an instance", "To prevent inheritance", "To handle exceptions"], answer: "To allow access without creating an instance" },
  { difficulty: 'Intermediate', type: 'true_false', question: "An interface can have method implementations (default methods) since Java 8.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between '==' and 'equals()'?", answer: "'==' compares memory locations (object references), while 'equals()' compares the actual content or values within the objects." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of the 'transient' keyword?", options: ["To make a variable constant", "To prevent a variable from being serialized", "To allow multi-threading", "To define a global variable"], answer: "To prevent a variable from being serialized" },
  { difficulty: 'Advanced', type: 'true_false', question: "Java supports multiple inheritance for classes.", answer: "False" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is Reflection in Java?", answer: "Reflection is an API which is used to examine or modify the behavior of methods, classes, interfaces at runtime." },
];
