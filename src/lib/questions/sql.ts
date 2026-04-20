import { QuestionBankItem } from './types';

export const sqlQuestions: QuestionBankItem[] = [
  {
    question: "What does SQL stand for?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "Structured Query Language"
  },
  {
    question: "What is a primary key?",
    type: "long_answer",
    difficulty: "Beginner",
    answer: "A primary key is a unique identifier for a record in a database table. It must contain unique values and cannot contain NULL values."
  },
  {
    question: "What is the difference between INNER JOIN and LEFT JOIN?",
    type: "long_answer",
    difficulty: "Intermediate",
    answer: "INNER JOIN returns only the rows that have matching values in both tables. LEFT JOIN returns all rows from the left table, and the matched rows from the right table; if no match is found, NULL values are returned for the right table columns."
  },
  {
    question: "Which command is used to remove all records from a table without deleting the table itself?",
    type: "mcq",
    difficulty: "Intermediate",
    options: ["DELETE", "REMOVE", "TRUNCATE", "DROP"],
    answer: "TRUNCATE"
  },
  {
    question: "Does the WHERE clause come before or after the GROUP BY clause?",
    type: "short_answer",
    difficulty: "Intermediate",
    answer: "Before"
  }
];
