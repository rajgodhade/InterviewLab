import { QuestionBankItem } from './types';

export const mongodbQuestions: QuestionBankItem[] = [
  {
    question: "What type of database is MongoDB?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "NoSQL (Document-oriented)"
  },
  {
    question: "What format does MongoDB use to store data?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "BSON (Binary JSON)"
  },
  {
    question: "What is a 'Collection' in MongoDB?",
    type: "long_answer",
    difficulty: "Beginner",
    answer: "A collection is a group of MongoDB documents. It is equivalent to a table in an RDBMS."
  },
  {
    question: "How do you perform a join-like operation in MongoDB?",
    type: "mcq",
    difficulty: "Intermediate",
    options: ["$join", "$lookup", "$merge", "$combine"],
    answer: "$lookup"
  },
  {
    question: "Is MongoDB vertically or horizontally scalable?",
    type: "short_answer",
    difficulty: "Intermediate",
    answer: "Horizontally (via sharding)"
  }
];
