export type QuestionBankItem = {
  question: string;
  answer: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'long_answer';
  options?: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
};
