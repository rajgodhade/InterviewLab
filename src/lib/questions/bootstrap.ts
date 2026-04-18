import { QuestionBankItem } from './types';

export const bootstrapQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "Which class is used to create a responsive container in Bootstrap 5?", options: ["container", "box", "wrapper", "content"], answer: "container" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which class provides a full-width container?", options: ["container-fixed", "container-fluid", "container-full", "container-wide"], answer: "container-fluid" },
  { difficulty: 'Beginner', type: 'true_false', question: "Bootstrap 5 requires jQuery to work.", answer: "False" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the Bootstrap grid system?", answer: "Bootstrap's grid system uses a series of containers, rows, and columns to layout and align content. It’s built with flexbox and is fully responsive." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which class is used to create a flexbox container in Bootstrap?", options: ["flex", "d-flex", "display-flex", "flex-box"], answer: "d-flex" },
  { difficulty: 'Intermediate', type: 'mcq', question: "How many columns are there in the default Bootstrap grid system?", options: ["10", "12", "16", "24"], answer: "12" },
  { difficulty: 'Intermediate', type: 'true_false', question: "The 'g-*' classes are used to control gutters (spacing between columns).", answer: "True" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What are utilities in Bootstrap?", answer: "Utilities are single-purpose CSS classes that provide quick styling for common properties like margin (m-*), padding (p-*), text alignment, and colors." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "Which Bootstrap component is used to display a small count of items?", options: ["Label", "Tag", "Badge", "Chip"], answer: "Badge" },
  { difficulty: 'Advanced', type: 'true_false', question: "Bootstrap 5 uses Sass as its CSS preprocessor.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "How do you customize Bootstrap using Sass variables?", answer: "You can override default variables by defining your own values before importing Bootstrap's Sass files. This allows you to change colors, fonts, and spacing globally." },
];
