import { QuestionBankItem } from './types';

export const javascriptQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What does typeof null return in JavaScript?", options: ["'null'", "'undefined'", "'object'", "'boolean'"], answer: "'object'" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which method converts a JSON string to a JavaScript object?", options: ["JSON.stringify()", "JSON.parse()", "JSON.convert()", "JSON.decode()"], answer: "JSON.parse()" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is the output of console.log(0.1 + 0.2 === 0.3)?", options: ["true", "false", "undefined", "NaN"], answer: "false" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which keyword declares a block-scoped variable?", options: ["var", "let", "global", "define"], answer: "let" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which operator checks both value and type?", options: ["==", "===", "!=", "="], answer: "===" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which method adds an element to the end of an array?", options: ["push()", "pop()", "shift()", "append()"], answer: "push()" },
  { difficulty: 'Beginner', type: 'true_false', question: "JavaScript is a single-threaded language.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "undefined and null are the same in JavaScript.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "const variables can never be changed.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "NaN === NaN evaluates to true.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "Arrays in JavaScript are objects.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the difference between let, const, and var?", answer: "var is function-scoped and hoisted. let is block-scoped and can be reassigned. const is block-scoped and cannot be reassigned." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is hoisting in JavaScript?", answer: "Hoisting is JavaScript's behavior of moving declarations to the top of their scope before execution. var declarations are hoisted, but let/const are not accessible before declaration." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which method creates a new array from calling a function on every element?", options: ["forEach()", "map()", "filter()", "reduce()"], answer: "map()" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the result of typeof []?", options: ["'array'", "'object'", "'list'", "'undefined'"], answer: "'object'" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which method removes the last element from an array?", options: ["shift()", "splice()", "pop()", "delete()"], answer: "pop()" },
  { difficulty: 'Intermediate', type: 'true_false', question: "Arrow functions have their own 'this' context.", answer: "False" },
  { difficulty: 'Intermediate', type: 'true_false', question: "Promises can be in three states: pending, fulfilled, rejected.", answer: "True" },
  { difficulty: 'Intermediate', type: 'true_false', question: "The spread operator (...) creates a deep copy of objects.", answer: "False" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "Explain closures in JavaScript.", answer: "A closure is a function that remembers variables from its outer scope even after the outer function has finished executing." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the event loop in JavaScript?", answer: "The event loop handles async operations. It checks the call stack, and when empty, pushes callbacks from the task queue to the stack." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between == and ===?", answer: "== compares values with type coercion. === compares values without type coercion (strict equality)." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What are Promises in JavaScript?", answer: "Promises represent the eventual completion or failure of an async operation. They have .then(), .catch(), and .finally() methods." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Write a JavaScript function debounce(fn, delay) that delays invoking fn until after delay milliseconds.", answer: "function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}" },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Write a function that reverses a string without using the built-in .reverse() method.", answer: "function reverseString(str) {\n  let result = '';\n  for (let i = str.length - 1; i >= 0; i--) {\n    result += str[i];\n  }\n  return result;\n}" },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "Which pattern does JavaScript use for asynchronous iteration?", options: ["Observer", "Symbol.asyncIterator", "Generator", "Proxy"], answer: "Symbol.asyncIterator" },
  { difficulty: 'Advanced', type: 'mcq', question: "What does Object.freeze() do?", options: ["Deletes the object", "Prevents modifications", "Creates a copy", "Locks the prototype"], answer: "Prevents modifications" },
  { difficulty: 'Advanced', type: 'true_false', question: "WeakMap keys must be objects.", answer: "True" },
  { difficulty: 'Advanced', type: 'true_false', question: "JavaScript supports tail call optimization in strict mode.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is the difference between call(), apply(), and bind()?", answer: "call() invokes with arguments listed. apply() invokes with arguments as array. bind() returns a new function with 'this' bound." },
  { difficulty: 'Advanced', type: 'short_answer', question: "Explain the JavaScript Proxy object.", answer: "Proxy wraps an object and intercepts operations like property access, assignment, and function calls through handler traps." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Implement a simple Promise.all() polyfill.", answer: "function promiseAll(promises) {\n  return new Promise((resolve, reject) => {\n    const results = [];\n    let completed = 0;\n    promises.forEach((p, i) => {\n      Promise.resolve(p).then(val => {\n        results[i] = val;\n        completed++;\n        if (completed === promises.length) resolve(results);\n      }).catch(reject);\n    });\n  });\n}" },
];
