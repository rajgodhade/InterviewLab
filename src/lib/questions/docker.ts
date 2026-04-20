import { QuestionBankItem } from './types';

export const dockerQuestions: QuestionBankItem[] = [
  {
    question: "What is Docker?",
    type: "long_answer",
    difficulty: "Beginner",
    answer: "Docker is an open-platform for developing, shipping, and running applications. It allows you to separate your applications from your infrastructure so you can deliver software quickly by using containers."
  },
  {
    question: "What is a Dockerfile?",
    type: "long_answer",
    difficulty: "Beginner",
    answer: "A Dockerfile is a text document that contains all the commands a user could call on the command line to assemble an image."
  },
  {
    question: "Which command is used to run a container from an image?",
    type: "short_answer",
    difficulty: "Beginner",
    answer: "docker run"
  },
  {
    question: "What is the difference between an image and a container?",
    type: "long_answer",
    difficulty: "Intermediate",
    answer: "An image is a read-only template with instructions for creating a Docker container. A container is a runnable instance of an image."
  },
  {
    question: "Which file is used to define and run multi-container Docker applications?",
    type: "short_answer",
    difficulty: "Intermediate",
    answer: "docker-compose.yml"
  }
];
