import Typed from 'typed.js';

let target = document.getElementById('typeytypey');
let options = {
  strings: [
    'hello',
    'goodbye',
    'threeeeee',
    'this is an experiment by Kaitlin Schaer',
  ],
  typeSpeed: 40,
  loop: false,
  showCursor: true,
  cursorChar: '|',
};
let typer = new Typed(target, options);
