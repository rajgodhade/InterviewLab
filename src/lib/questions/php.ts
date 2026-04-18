import { QuestionBankItem } from './types';

export const phpQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What does PHP stand for?", options: ["Personal Home Page", "Hypertext Preprocessor", "Pretext Hypertext Processor", "Private Home Page"], answer: "Hypertext Preprocessor" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which symbol is used to declare a variable in PHP?", options: ["&", "$", "@", "#"], answer: "$" },
  { difficulty: 'Beginner', type: 'true_false', question: "PHP is a server-side scripting language.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "How do you start and end a PHP code block?", answer: "A PHP code block starts with <?php and ends with ?>." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which function is used to include a file in PHP, but will stop execution if the file is not found?", options: ["include()", "require()", "import()", "fetch()"], answer: "require()" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the purpose of the '$_POST' superglobal in PHP?", options: ["To store session data", "To collect data from an HTML form with method='post'", "To get URL parameters", "To upload files"], answer: "To collect data from an HTML form with method='post'" },
  { difficulty: 'Intermediate', type: 'true_false', question: "PHP arrays can store different types of data in the same array.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is a session in PHP?", answer: "A session is a way to store information in variables to be used across multiple pages. Unlike cookies, session data is stored on the server." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the purpose of 'composer' in the PHP ecosystem?", options: ["To compile PHP code", "To manage dependencies and libraries", "To design the UI", "To manage the database"], answer: "To manage dependencies and libraries" },
  { difficulty: 'Advanced', type: 'true_false', question: "PHP 7+ supports scalar type hints for function parameters.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What are Traits in PHP?", answer: "Traits are a mechanism for code reuse in single inheritance languages like PHP. They allow developers to reuse sets of methods freely in several independent classes living in different class hierarchies." },
];
