import { QuestionBankItem } from './types';

export const vueQuestions: QuestionBankItem[] = [
  {
    question: "What is Vue.js?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "Vue.js is a progressive JavaScript framework for building user interfaces."
  },
  {
    question: "What are the two main ways to write Vue components?",
    type: "mcq",
    difficulty: "Intermediate",
    options: ["Options API and Composition API", "Class API and Functional API", "Reactive API and State API", "Global API and Local API"],
    answer: "Options API and Composition API"
  },
  {
    question: "What directive is used for two-way data binding in Vue?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "v-model"
  },
  {
    question: "Explain the Vue Instance Lifecycle.",
    type: "long_answer",
    difficulty: "Intermediate",
    answer: "Each Vue instance goes through a series of initialization steps when it's created - for example, it needs to set up data observation, compile the template, mount the instance to the DOM, and update the DOM when data changes. Along the way, it also runs functions called lifecycle hooks, giving users the opportunity to add their own code at specific stages."
  },
  {
    question: "Is Vue.js a library or a framework?",
    type: "true_false",
    difficulty: "Beginner",
    answer: "Framework"
  }
];
