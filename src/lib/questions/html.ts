import { QuestionBankItem } from './types';

export const htmlQuestions: QuestionBankItem[] = [
  // ===== BEGINNER =====
  { difficulty: 'Beginner', type: 'mcq', question: "Which HTML tag is used to define an unordered list?", options: ["<ol>", "<ul>", "<li>", "<list>"], answer: "<ul>" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which attribute is used to provide alternative text for an image?", options: ["title", "src", "alt", "name"], answer: "alt" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which HTML element is used for the largest heading?", options: ["<h6>", "<heading>", "<h1>", "<head>"], answer: "<h1>" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which tag is used to create a hyperlink?", options: ["<link>", "<a>", "<href>", "<url>"], answer: "<a>" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which tag is used for a line break in HTML?", options: ["<break>", "<lb>", "<br>", "<newline>"], answer: "<br>" },
  { difficulty: 'Beginner', type: 'mcq', question: "Which element is used to define a paragraph?", options: ["<paragraph>", "<p>", "<para>", "<text>"], answer: "<p>" },
  { difficulty: 'Beginner', type: 'mcq', question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language", "Hyperlinking Text Making Language"], answer: "Hyper Text Markup Language" },
  { difficulty: 'Beginner', type: 'true_false', question: "The <head> tag contains content visible to the user on the page.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "HTML5 introduced new semantic elements like <article> and <section>.", answer: "True" },
  { difficulty: 'Beginner', type: 'true_false', question: "The <img> tag requires a closing tag.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "HTML tags are case-sensitive.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "The <br> tag inserts a horizontal rule.", answer: "False" },
  { difficulty: 'Beginner', type: 'true_false', question: "The <title> tag is placed inside the <head> section.", answer: "True" },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the purpose of the DOCTYPE declaration?", answer: "It tells the browser which version of HTML the page is written in, ensuring the page is rendered in standards mode." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the difference between <div> and <span>?", answer: "A <div> is a block-level element used for grouping content, while <span> is an inline element used for styling small pieces of text." },
  { difficulty: 'Beginner', type: 'short_answer', question: "What is the difference between an ordered list and unordered list?", answer: "An ordered list (<ol>) displays items with numbers/letters, while an unordered list (<ul>) displays items with bullet points." },

  // ===== INTERMEDIATE =====
  { difficulty: 'Intermediate', type: 'mcq', question: "Which attribute is used to open a link in a new tab?", options: ["target='_self'", "target='_blank'", "target='_new'", "target='_tab'"], answer: "target='_blank'" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which input type is used for date selection?", options: ["datetime", "date", "calendar", "datepicker"], answer: "date" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which HTML5 element is used for navigation links?", options: ["<navigation>", "<nav>", "<menu>", "<links>"], answer: "<nav>" },
  { difficulty: 'Intermediate', type: 'mcq', question: "What is the correct HTML5 element for playing audio?", options: ["<sound>", "<mp3>", "<audio>", "<media>"], answer: "<audio>" },
  { difficulty: 'Intermediate', type: 'mcq', question: "Which attribute is used to specify that an input field must be filled out?", options: ["validate", "required", "mandatory", "placeholder"], answer: "required" },
  { difficulty: 'Intermediate', type: 'true_false', question: "The <canvas> element is used to draw graphics via JavaScript.", answer: "True" },
  { difficulty: 'Intermediate', type: 'true_false', question: "localStorage data persists even after the browser is closed.", answer: "True" },
  { difficulty: 'Intermediate', type: 'true_false', question: "The <figure> element is used to mark up a photo in a document.", answer: "True" },
  { difficulty: 'Intermediate', type: 'true_false', question: "HTML5 does not support inline SVG.", answer: "False" },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What are semantic HTML elements? Give examples.", answer: "Semantic elements clearly describe their meaning. Examples: <header>, <nav>, <main>, <article>, <section>, <footer>." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between sessionStorage and localStorage?", answer: "localStorage persists data until manually cleared. sessionStorage data is cleared when the browser tab is closed." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What are data attributes in HTML5?", answer: "Custom attributes prefixed with data- that allow storing extra information on HTML elements, accessible via JavaScript's dataset property." },
  { difficulty: 'Intermediate', type: 'short_answer', question: "What is the difference between <section> and <div>?", answer: "<section> is semantic and represents a thematic grouping of content. <div> is non-semantic and used purely for styling/layout." },
  { difficulty: 'Intermediate', type: 'long_answer', question: "Create an HTML form with fields for Name (text), Email (email), a dropdown for Country, and a Submit button.", answer: "<form>\n  <label>Name: <input type='text' name='name' required></label>\n  <label>Email: <input type='email' name='email' required></label>\n  <label>Country:\n    <select name='country'>\n      <option>India</option>\n      <option>USA</option>\n    </select>\n  </label>\n  <button type='submit'>Submit</button>\n</form>" },

  // ===== ADVANCED =====
  { difficulty: 'Advanced', type: 'mcq', question: "Which API allows web applications to work offline?", options: ["WebSocket API", "Service Worker API", "Fetch API", "Storage API"], answer: "Service Worker API" },
  { difficulty: 'Advanced', type: 'mcq', question: "What is the correct MIME type for HTML documents?", options: ["text/html", "application/html", "text/xml", "application/xhtml"], answer: "text/html" },
  { difficulty: 'Advanced', type: 'true_false', question: "The Shadow DOM allows encapsulation of styles and markup.", answer: "True" },
  { difficulty: 'Advanced', type: 'true_false', question: "Web Components require a JavaScript framework to work.", answer: "False" },
  { difficulty: 'Advanced', type: 'short_answer', question: "What is the Shadow DOM and why is it useful?", answer: "Shadow DOM provides encapsulation for web components. It allows hidden DOM trees to be attached to elements, keeping styles and markup isolated from the main document." },
  { difficulty: 'Advanced', type: 'short_answer', question: "Explain the concept of Progressive Enhancement.", answer: "Building web content starting with a basic level of functionality that works everywhere, then adding enhanced features for browsers that support them." },
  { difficulty: 'Advanced', type: 'long_answer', question: "Create a responsive HTML5 page structure with header, nav, main content area with aside, and footer using semantic elements.", answer: "<!DOCTYPE html>\n<html lang='en'>\n<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Page</title></head>\n<body>\n  <header><h1>Site Title</h1></header>\n  <nav><a href='/'>Home</a> <a href='/about'>About</a></nav>\n  <main>\n    <article><h2>Content</h2><p>Main content here.</p></article>\n    <aside><h3>Sidebar</h3><p>Related links.</p></aside>\n  </main>\n  <footer><p>&copy; 2024</p></footer>\n</body>\n</html>" },
];
