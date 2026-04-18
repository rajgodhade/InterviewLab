import { QuestionBankItem } from './types';

export const jsonQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What does JSON stand for?", options: ["JavaScript Object Notation", "Java Serialized Object Network", "JavaScript Output Name", "Java Standard Object Notation"], answer: "JavaScript Object Notation" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which of the following is a valid JSON data type?", options: ["Function", "Date", "String", "Undefined"], answer: "String" },
  { difficulty: 'Beginner', type: 'true_false', question: "In JSON, keys must be enclosed in double quotes.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the primary use of JSON?", answer: "JSON is a lightweight data-interchange format primarily used to transmit data between a server and a web application." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which character is used to separate key-value pairs in JSON?", options: [";", ",", ".", ":"], answer: "," },
  { difficulty: 'Intermediate', type: 'mcq', question: "How are arrays represented in JSON?", options: ["{}", "[]", "()", "<>"], answer: "[]" },
  { difficulty: 'Intermediate', type: 'true_false', question: "JSON supports comments.", answer: "False" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between JSON.parse() and JSON.stringify()?", answer: "JSON.parse() converts a JSON string into a JavaScript object. JSON.stringify() converts a JavaScript object into a JSON string." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "Which MIME type is used for JSON data?", options: ["text/javascript", "application/json", "application/javascript", "text/json"], answer: "application/json" },
  { difficulty: 'Advanced', type: 'true_false', question: "JSON is language-independent.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is JSON Schema?", answer: "JSON Schema is a vocabulary that allows you to annotate and validate JSON documents, ensuring the data follows a specific structure and format." },
];
