import { QuestionBankItem } from './types';

export const reactQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "Which hook is used to manage state in a functional component?", options: ["useEffect", "useState", "useContext", "useReducer"], answer: "useState" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is JSX compiled to?", options: ["HTML strings", "DOM nodes", "React.createElement() calls", "Web Components"], answer: "React.createElement() calls" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which method is used to render a React component to the DOM?", options: ["ReactDOM.render()", "React.mount()", "document.render()", "React.display()"], answer: "ReactDOM.render()" },
  { difficulty: 'Beginner', type: 'mcq', question: "What is the correct way to pass data from parent to child?", options: ["state", "props", "context", "refs"], answer: "props" },
  { difficulty: 'Beginner', type: 'true_false', question: "In React, keys should be unique among siblings in a list.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "You can use hooks inside a regular JavaScript function (not a component).", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "React components must return a single root element.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "Props in React are read-only.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the Virtual DOM and how does it work?", answer: "The Virtual DOM is an in-memory representation of the real DOM. React compares (diffs) the old and new virtual DOM and updates only changed parts." },
  { difficulty: 'Beginner', type: 'short_answer', question: "Explain the difference between state and props.", answer: "Props are read-only data passed from parent to child. State is mutable data managed within a component." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "What does the dependency array in useEffect control?", options: ["The return value", "When the effect re-runs", "The component's props", "The render order"], answer: "When the effect re-runs" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which hook is used for performance optimization with expensive calculations?", options: ["useCallback", "useMemo", "useRef", "useReducer"], answer: "useMemo" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the purpose of React.memo()?", options: ["Memorize state", "Prevent unnecessary re-renders", "Cache API calls", "Store references"], answer: "Prevent unnecessary re-renders" },
  { difficulty: 'Intermediate', type: 'true_false', question: "useCallback returns a memoized callback function.", answer: "True" },
  { difficulty: 'Intermediate', type: 'true_false', question: "useRef causes a re-render when its value changes.", answer: "False" },
  { difficulty: 'Intermediate', type: 'true_false', question: "Context API can replace Redux for all use cases.", answer: "False" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is prop drilling and how do you avoid it?", answer: "Prop drilling is passing props through many component layers. Avoid it with Context API, Redux, or other state management." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is React Context API?", answer: "Context provides a way to share values (theme, auth) across components without passing props at every level." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between useEffect and useLayoutEffect?", answer: "useEffect fires after paint. useLayoutEffect fires synchronously after DOM mutations but before paint, useful for measuring layout." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Write a React component Counter with increment and decrement buttons using useState.", answer: "function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count - 1)}>-</button>\n      <button onClick={() => setCount(count + 1)}>+</button>\n    </div>\n  );\n}" },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "Which pattern is used by React to share logic between components?", options: ["Singleton", "Custom Hooks", "Adapter", "Factory"], answer: "Custom Hooks" },
  { difficulty: 'Advanced', type: 'mcq', question: "What does React.lazy() enable?", options: ["Lazy state updates", "Code splitting", "Deferred rendering", "Memoization"], answer: "Code splitting" },
  { difficulty: 'Advanced', type: 'true_false', question: "React Suspense can be used for data fetching in React 18+.", answer: "True" },
  { difficulty: 'Advanced', type: 'true_false', question: "Server Components can use hooks like useState.", answer: "False" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is React Fiber?", answer: "Fiber is React's reconciliation engine introduced in React 16. It enables incremental rendering, splitting work into chunks and prioritizing updates." },
  { difficulty: 'Advanced', type: 'short_answer', question: "Explain React Server Components.", answer: "Server Components render on the server, reducing bundle size. They can access server resources directly but cannot use state or effects." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Create a custom hook useDebounce(value, delay) that returns a debounced value.", answer: "function useDebounce(value, delay) {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n}" },
];
