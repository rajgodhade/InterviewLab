import { QuestionBankItem } from './types';

export const apiQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "What does API stand for?", options: ["Application Programming Interface", "Automated Program Integration", "Advanced Program Interaction", "Application Protocol Interface"], answer: "Application Programming Interface" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which HTTP method is most commonly used to retrieve data from an API?", options: ["POST", "GET", "PUT", "DELETE"], answer: "GET" },
  { difficulty: 'Beginner', type: 'true_false', question: "An API allows two different software applications to communicate with each other.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is an endpoint in an API?", answer: "An endpoint is a specific URL path where an API can be accessed to perform a particular task or retrieve a specific resource." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which HTTP status code represents 'Not Found'?", options: ["200", "400", "404", "500"], answer: "404" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the purpose of the 'Authentication' header in an API request?", options: ["To format the response", "To prove the identity of the requester", "To specify the data type", "To set the timeout"], answer: "To prove the identity of the requester" },
  { difficulty: 'Intermediate', type: 'true_false', question: "REST is the only architecture used for building APIs.", answer: "False" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between a GET and a POST request?", answer: "GET is used to retrieve data from a server and parameters are typically sent in the URL. POST is used to send data to a server to create/update a resource, and parameters are sent in the request body." },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "What does idempotency mean in the context of APIs?", options: ["The API is always available", "Multiple identical requests have the same effect as a single request", "The API automatically scales", "The API uses encryption"], answer: "Multiple identical requests have the same effect as a single request" },
  { difficulty: 'Advanced', type: 'true_false', question: "GraphQL allows clients to request exactly the data they need and nothing more.", answer: "True" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is Rate Limiting in an API?", answer: "Rate limiting is a strategy for limiting network traffic. It puts a cap on how often someone can repeat an action within a certain timeframe—for example, limiting an IP address to 100 requests per minute." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Explain the difference between REST and GraphQL.", answer: "REST is an architectural style based on resources accessed via unique URLs using standard HTTP methods. It often results in over-fetching or under-fetching data. GraphQL is a query language for APIs that allows clients to request specific fields from multiple related resources in a single request, providing exactly what is needed." },
];
