/*eslint no-loop-func: */
/* eslint no-eval: 0 */

import seedRamdom from 'seedrandom';
let rng;

var TreeNode = function(left, right, operator) {
  this.left = left;
  this.right = right;
  this.operator = operator;

  this.toString = function() {
    return '(' + left + ' ' + operator + ' ' + right + ')';
  };
};

function randomNumberRange(max) {
  return parseInt(rng() * 100) % max;
}

function randomRange() {
  return parseInt(rng() * 100);
}

// var x = ['/', '*', '-', '+'];
var x = ['-', '+'];

function buildTree(numNodes) {
  if (numNodes === 1) return randomRange();

  var numLeft = Math.floor(numNodes / 2);
  var leftSubTree = buildTree(numLeft);
  var numRight = Math.ceil(numNodes / 2);
  var rightSubTree = buildTree(numRight);

  var m = randomNumberRange(x.length);
  var str = x[m];
  return new TreeNode(leftSubTree, rightSubTree, str);
}

let simplify = (a) => {
  let s;
  let b;
  for (
    s = [], b = '';
    a !== b;
    a = b.replace(/\(([^()]*)\)(?=(.?))/, (x, y, z, p) =>
      y.indexOf('+') < 0 ? y : -s.push((b[p - 1] === '*') | (z === '*') ? x : y)
    )
  )
    b = a;
  for (b = 0; a !== b; a = b.replace(/-\d+/, (x) => s[~x])) b = a;
  return a;
};

let genAnswer = (question) => {
  let answers = [];
  let answer = eval(question);
  for (let i = 0; i < 3; i++) {
    let ans;
    let randomly;

    do {
      randomly = Math.floor(rng() * 100);
    } while (randomly === 0);

    if (i % 2 === 0) ans = answer + randomly;
    else ans = answer - randomly;
    answers.push(ans);
  }
  answers.push(answer);
  // suffle element in array
  answers.sort(() => Math.random() - 0.5);

  return answers;
};

export const genQuestion = (seed, numQuestion, numElement) => {
  rng = seedRamdom(seed);
  let questions = [];
  for (let i = 0; i < numQuestion; i++) {
    var quesAns = {};

    quesAns.ques = simplify(buildTree(numElement).toString());
    quesAns.ans = genAnswer(quesAns.ques);

    questions.push(quesAns);
  }
  return questions;
};

export const genQuestionIncLv = (seed, numQuestion) => {
  rng = seedRamdom(seed);
  let questions = [];
  let incLevel;
  for (let i = 0; i < numQuestion; i++) {
    var quesAns = {};
    incLevel = parseInt(i / 3);
    if (i === numQuestion - 1) incLevel = parseInt(i / 3) + 1;
    quesAns.quesNumber = i + 1;
    quesAns.ques = simplify(buildTree(2 + incLevel).toString());
    quesAns.ans = genAnswer(quesAns.ques);
    questions.push(quesAns);
  }
  return questions;
};
