import MyComponent from './MyComponent.html';

const component = new MyComponent({
  target: document.querySelector('main'),
  data: {
    question: [
      'life',
      'the universe',
      'everything'
    ],
    answer: 42
  }
})
