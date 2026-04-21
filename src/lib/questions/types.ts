export type QuestionBankItem = {
  question: string;
  answer: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'coding';
  options?: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
};
