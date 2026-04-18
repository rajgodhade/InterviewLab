import { QuestionBankItem } from './types';

export const nodejsQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What is Node.js built on?", options: ["Java", "V8 Engine", "Python", "C#"], answer: "V8 Engine" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which command is used to initialize a new Node.js project?", options: ["npm start", "npm init", "node init", "npm create"], answer: "npm init" },
  { difficulty: 'Beginner', type: 'true_false', question: "Node.js is asynchronous and event-driven.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is npm?", answer: "npm (Node Package Manager) is the default package manager for Node.js, used to install, share, and manage dependencies in JavaScript projects." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which core module is used for handling file operations?", options: ["path", "http", "fs", "url"], answer: "fs" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What does the 'module.exports' do in Node.js?", options: ["Imports a package", "Exports a module for use in other files", "Initializes a server", "Defines a global variable"], answer: "Exports a module for use in other files" },
  { difficulty: 'Intermediate', type: 'true_false', question: "The 'path' module is used to work with file and directory paths.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the purpose of the 'buffer' class in Node.js?", answer: "The Buffer class provides a way of handling binary data directly. It is a subclass of the JavaScript Uint8Array class." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Explain the difference between process.nextTick() and setImmediate().", answer: "process.nextTick() adds a callback to the 'next tick queue', which is processed before the event loop continues. setImmediate() schedules a script to be run in the next iteration of the event loop (the 'check' phase)." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What is the main advantage of using streams in Node.js?", options: ["They are faster than arrays", "They process data piece by piece without loading everything in memory", "They automatically encrypt data", "They handle multi-threading"], answer: "They process data piece by piece without loading everything in memory" },
  { difficulty: 'Advanced', type: 'true_false', question: "Node.js cluster module allows you to create child processes that share server ports.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What are worker threads in Node.js?", answer: "Worker threads allow the execution of JavaScript in parallel on multiple threads, which is useful for CPU-intensive tasks without blocking the main event loop." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Explain the Node.js event loop architecture.", answer: "The event loop is what allows Node.js to perform non-blocking I/O operations. It offloads operations to the system kernel whenever possible. Phases include: timers, pending callbacks, idle/prepare, poll, check, and close callbacks." },
];
