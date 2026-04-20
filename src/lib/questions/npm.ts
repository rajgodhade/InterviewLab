import { QuestionBankItem } from './types';

export const npmQuestions: QuestionBankItem[] = [
  {
    question: "What does NPM stand for?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "Node Package Manager"
  },
  {
    question: "Which file contains the metadata and dependencies of a project?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "package.json"
  },
  {
    question: "What command is used to install all dependencies listed in package.json?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "npm install"
  },
  {
    question: "What is the difference between --save and --save-dev?",
    type: "long_answer",
    difficulty: "Intermediate",
    answer: "--save (or -S) adds the package to 'dependencies', which are required to run the application. --save-dev (or -D) adds the package to 'devDependencies', which are only required for development and testing (like linters or compilers)."
  },
  {
    question: "Can npm run scripts be customized?",
    type: "true_false",
    difficulty: "Beginner",
    answer: "True"
  }
];
