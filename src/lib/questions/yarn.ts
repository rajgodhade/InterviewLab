import { QuestionBankItem } from './types';

export const yarnQuestions: QuestionBankItem[] = [
  {
    question: "What is Yarn?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "Yarn is a package manager for JavaScript code, developed by Facebook as an alternative to npm."
  },
  {
    question: "What is the equivalent of 'npm install' in Yarn?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "yarn install"
  },
  {
    question: "What is a yarn.lock file used for?",
    type: "long_answer",
    difficulty: "Intermediate",
    answer: "The yarn.lock file ensures that the same dependencies are installed across all machines by locking the exact versions of the packages."
  },
  {
    question: "How do you add a new dependency in Yarn?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "yarn add [package-name]"
  },
  {
    question: "Does Yarn support parallel installation of packages?",
    type: "true_false",
    difficulty: "Intermediate",
    answer: "True"
  }
];
