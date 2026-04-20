import { QuestionBankItem } from './types';

export const gitQuestions: QuestionBankItem[] = [
  {
    question: "What is Git?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "Git is a distributed version control system for tracking changes in source code during software development."
  },
  {
    question: "Which command is used to initialize a new Git repository?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "git init"
  },
  {
    question: "What is the difference between 'git pull' and 'git fetch'?",
    type: "long_answer",
    difficulty: "Intermediate",
    answer: "git fetch only downloads the new data from a remote repository but doesn't integrate any of this new data into your working files. git pull, on the other hand, runs git fetch followed by git merge to update your local branch with the remote version."
  },
  {
    question: "How do you stage all changes for a commit?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "git add ."
  },
  {
    question: "Can you revert a commit that has already been pushed to a public repository?",
    type: "true_false",
    difficulty: "Intermediate",
    answer: "True"
  }
];
