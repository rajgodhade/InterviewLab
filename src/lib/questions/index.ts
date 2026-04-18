import { htmlQuestions } from './html';
import { cssQuestions } from './css';
import { javascriptQuestions } from './javascript';
import { reactQuestions } from './react';
import { angularQuestions } from './angular';
import { nodejsQuestions } from './nodejs';
import { bootstrapQuestions } from './bootstrap';
import { dotnetQuestions } from './dotnet';
import { pythonQuestions } from './python';
import { javaQuestions } from './java';
import { csharpQuestions } from './csharp';
import { cppQuestions } from './cpp';
import { typescriptQuestions } from './typescript';
import { phpQuestions } from './php';
import { jsonQuestions } from './json';
import { apiQuestions } from './api';
import { QuestionBankItem } from './types';

export const questionBank: Record<string, QuestionBankItem[]> = {
  html: htmlQuestions,
  css: cssQuestions,
  javascript: javascriptQuestions,
  react: reactQuestions,
  angular: angularQuestions,
  nodejs: nodejsQuestions,
  bootstrap: bootstrapQuestions,
  dotnet: dotnetQuestions,
  python: pythonQuestions,
  java: javaQuestions,
  csharp: csharpQuestions,
  cpp: cppQuestions,
  typescript: typescriptQuestions,
  php: phpQuestions,
  json: jsonQuestions,
  api: apiQuestions,
};

export * from './types';
