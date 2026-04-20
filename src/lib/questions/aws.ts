import { QuestionBankItem } from './types';

export const awsQuestions: QuestionBankItem[] = [
  {
    question: "What does AWS stand for?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "Amazon Web Services"
  },
  {
    question: "What is Amazon S3 used for?",
    type: "long_answer",
    difficulty: "Beginner",
    answer: "Amazon S3 (Simple Storage Service) is an object storage service that offers industry-leading scalability, data availability, security, and performance."
  },
  {
    question: "Which AWS service is used for serverless compute functions?",
    type: "short_answer",
    difficulty: "Intermediate",
    answer: "AWS Lambda"
  },
  {
    question: "What is an IAM user?",
    type: "long_answer",
    difficulty: "Intermediate",
    answer: "IAM (Identity and Access Management) allows you to securely control access to AWS services and resources for your users."
  },
  {
    question: "Which service is used for hosting relational databases in AWS?",
    type: "mcq",
    difficulty: "Beginner",
    options: ["Redshift", "DynamoDB", "RDS", "ElastiCache"],
    answer: "RDS"
  }
];
