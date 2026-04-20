import { QuestionBankItem } from './types';

export const tailwindQuestions: QuestionBankItem[] = [
  {
    question: "What is Tailwind CSS?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "A utility-first CSS framework."
  },
  {
    question: "How do you apply a margin of 4 units on all sides in Tailwind?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "m-4"
  },
  {
    question: "What is the benefit of using utility-first CSS?",
    type: "long_answer",
    difficulty: "Intermediate",
    answer: "It allows for rapid UI development without writing custom CSS, ensures smaller bundle sizes by purging unused styles, and provides a highly maintainable and consistent design system."
  },
  {
    question: "Which class is used to create a responsive layout at the 'medium' breakpoint?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "md:"
  },
  {
    question: "Can you customize the default theme in Tailwind?",
    type: "true_false",
    difficulty: "Beginner",
    answer: "True"
  }
];
