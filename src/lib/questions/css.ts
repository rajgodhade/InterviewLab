import { QuestionBankItem } from './types';

export const cssQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "Which CSS property is used to change the text color?", options: ["font-color", "text-color", "color", "foreground"], answer: "color" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which property creates space outside an element's border?", options: ["padding", "margin", "border-spacing", "gap"], answer: "margin" },
  { difficulty: 'Beginner', type: 'mcq', question: "How do you select an element with id='main'?", options: [".main", "#main", "main", "*main"], answer: "#main" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which property changes the font size?", options: ["text-size", "font-style", "font-size", "text-font"], answer: "font-size" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which value of display hides an element?", options: ["hidden", "none", "invisible", "collapse"], answer: "none" },
  { difficulty: 'Beginner', type: 'true_false', question: "display: none removes the element from the layout entirely.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "Inline styles have higher priority than external stylesheets.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "The default position value for HTML elements is 'relative'.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "padding adds space inside the element's border.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the CSS Box Model?", answer: "Every element is a box consisting of: content, padding, border, and margin (from inside out)." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the difference between class and id selectors?", answer: "Class (.) can be used on multiple elements. ID (#) must be unique per page and has higher specificity." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "What does position: absolute position an element relative to?", options: ["The viewport", "The nearest positioned ancestor", "The body", "Its normal position"], answer: "The nearest positioned ancestor" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which CSS property is used to create rounded corners?", options: ["corner-radius", "border-radius", "border-corner", "round-corner"], answer: "border-radius" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which unit is relative to the root element's font size?", options: ["em", "rem", "vh", "px"], answer: "rem" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the default value of flex-direction?", options: ["column", "row", "row-reverse", "inherit"], answer: "row" },
  { difficulty: 'Intermediate', type: 'true_false', question: "The z-index property works on all elements regardless of position.", answer: "False" },
  { difficulty: 'Intermediate', type: 'true_false', question: "Flexbox is a two-dimensional layout system.", answer: "False" },
  { difficulty: 'Intermediate', type: 'true_false', question: "CSS Grid is a two-dimensional layout system.", answer: "True" },
  { difficulty: 'Intermediate', type: 'true_false', question: "Media queries can detect device orientation.", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between em and rem units?", answer: "em is relative to the parent element's font size. rem is relative to the root <html> element's font size." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "Explain Flexbox and its main properties.", answer: "Flexbox is a layout model. Key properties: display: flex, justify-content (main axis), align-items (cross axis), flex-direction, flex-wrap." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is CSS specificity?", answer: "Specificity determines which CSS rule is applied when multiple rules match. Order: inline > ID > class > element. !important overrides all." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Write CSS to create a centered card with a shadow, rounded corners, max-width of 400px, and a hover effect.", answer: ".card {\n  max-width: 400px;\n  margin: 0 auto;\n  padding: 2rem;\n  border-radius: 12px;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n.card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 8px 25px rgba(0,0,0,0.15);\n}" },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "Which CSS function is used for custom property fallback?", options: ["calc()", "var()", "env()", "attr()"], answer: "var()" },
  { difficulty: 'Advanced', type: 'mcq', question: "Which property controls how an element's content is clipped?", options: ["clip-path", "overflow", "mask", "visibility"], answer: "clip-path" },
  { difficulty: 'Advanced', type: 'true_false', question: "CSS custom properties (variables) can be changed with JavaScript.", answer: "True" },
  { difficulty: 'Advanced', type: 'true_false', question: "The :has() pseudo-class is a parent selector in CSS.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What are CSS Container Queries?", answer: "Container queries allow styling based on the size of a parent container instead of the viewport, enabling truly reusable components." },
  { difficulty: 'Advanced', type: 'short_answer', question: "Explain the CSS cascade layers feature (@layer).", answer: "@layer allows grouping CSS rules into layers with explicit ordering, giving fine-grained control over specificity and cascade precedence." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Write a CSS Grid layout with a header spanning full width, a sidebar (250px), main content (flexible), and a footer spanning full width.", answer: ".layout {\n  display: grid;\n  grid-template-columns: 250px 1fr;\n  grid-template-rows: auto 1fr auto;\n  grid-template-areas:\n    'header header'\n    'sidebar main'\n    'footer footer';\n  min-height: 100vh;\n}\n.header { grid-area: header; }\n.sidebar { grid-area: sidebar; }\n.main { grid-area: main; }\n.footer { grid-area: footer; }" },
];
