export default function(strOne: any, strTwo: any) {
  const referenceHTML = HtmlTextParser(strOne);
  const compareHTML = HtmlTextParser(strTwo);
  const referenceSizeCarrier = new Array(2 * (referenceHTML.length + compareHTML.length));
  const compareSizeCarrier = new Array(2 * (referenceHTML.length + compareHTML.length));
  const referenceTerminal = {
    StartIndex: 0,
    EndIndex: referenceHTML.length
  };
  const compareTerminal = {
    StartIndex: 0,
    EndIndex: compareHTML.length
  };
  return compareAndMerge(referenceTerminal, compareTerminal, referenceHTML, compareHTML, referenceSizeCarrier, compareSizeCarrier);
}

class Record {
  private _StartIndex: any;
  private _EndIndex: any;

  constructor(StartIndex: any, EndIndex: any) {
    this._StartIndex = StartIndex;
    this._EndIndex = EndIndex;
  }


  get StartIndex(): any {
    return this._StartIndex;
  }

  set StartIndex(value: any) {
    this._StartIndex = value;
  }

  get EndIndex(): any {
    return this._EndIndex;
  }

  set EndIndex(value: any) {
    this._EndIndex = value;
  }
}

function compareAndMerge(referenceTerminal: any, compareTerminal: any, referenceHTML: any, compareHTML: any, referenceSizeCarrier: any, compareSizeCarrier: any) {
  let result = '';
  let tail = '';
  let s = null;
  let y = compareTerminal.StartIndex;
  while (referenceTerminal.StartIndex < compareTerminal.EndIndex && compareTerminal.StartIndex < compareTerminal.EndIndex && referenceHTML[referenceTerminal.StartIndex].word === compareHTML[compareTerminal.StartIndex].word) {
    referenceTerminal.StartIndex++;
    compareTerminal.StartIndex++;
  }
  if (compareTerminal.StartIndex > y) {
    s = new Record(y, compareTerminal.StartIndex);
    const cr = constructText(s, 2, referenceHTML, compareHTML);
    result = result + cr;
  }
  y = compareTerminal.EndIndex;

  while (referenceTerminal.StartIndex < referenceTerminal.EndIndex && compareTerminal.StartIndex < compareTerminal.EndIndex && referenceHTML[referenceTerminal.EndIndex - 1].word === compareHTML[compareTerminal.EndIndex - 1].word) {
    referenceTerminal.EndIndex--;
    compareTerminal.EndIndex--;
  }
  if (compareTerminal.EndIndex < y) {
    s = new Record(compareTerminal.EndIndex, y);
    tail = constructText(s, 2, referenceHTML, compareHTML);
  }
  const N = referenceTerminal.EndIndex - referenceTerminal.StartIndex;
  const M = compareTerminal.EndIndex - compareTerminal.StartIndex;
  if (N < 1 && M < 1) {
    return result + tail;
  } else if (N < 1) {
    const crt = constructText(compareTerminal, 1, referenceHTML, compareHTML);
    result = result + crt;
    result += tail;
    return result;
  } else if (M < 1) {
    result += constructText(referenceTerminal, 0, referenceHTML, compareHTML);
    result += tail;
    return result;
  } else if (M === 1 && N === 1) {
    result += constructText(referenceTerminal, 0, referenceHTML, compareHTML);
    result += constructText(compareTerminal, 1, referenceHTML, compareHTML);
    result += tail;
    return result;
  } else {
    const snake = findMiddleSnake(referenceTerminal, compareTerminal, referenceHTML, compareHTML, referenceSizeCarrier, compareSizeCarrier);

    if (snake.SESLength > 1) {
      const leftSrc = new Record(referenceTerminal.StartIndex, snake.Source.StartIndex);
      const leftDes = new Record(compareTerminal.StartIndex, snake.Destination.StartIndex);
      const rightSrc = new Record(snake.Source.EndIndex, referenceTerminal.EndIndex);
      const rightDes = new Record(snake.Destination.EndIndex, compareTerminal.EndIndex);

      result += compareAndMerge(leftSrc, leftDes, referenceHTML, compareHTML, referenceSizeCarrier, compareSizeCarrier);
      if (snake.Source.StartIndex < snake.Source.EndIndex) {
        result += constructText(snake.Destination, 2, referenceHTML, compareHTML);
      }
      result += compareAndMerge(rightSrc, rightDes, referenceHTML, compareHTML, referenceSizeCarrier, compareSizeCarrier);
      result += tail;
      return result;
    } else {
      if (N > M) {
        if (referenceTerminal.StartIndex !== snake.Source.StartIndex) {
          const leftSrc = new Record(referenceTerminal.StartIndex, snake.Source.StartIndex);
          result += constructText(leftSrc, 0, referenceHTML, compareHTML);
          result += constructText(snake.Destination, 2, referenceHTML, compareHTML);
        } else {
          const rightSrc = new Record(snake.Source.StartIndex, referenceTerminal.EndIndex);
          result += constructText(rightSrc, 0, referenceHTML, compareHTML);
          result += constructText(snake.Destination, 2, referenceHTML, compareHTML);
        }
      } else {
        if (compareTerminal.StartIndex !== snake.Destination.StartIndex) {
          const upDes = new Record(compareTerminal.StartIndex, snake.Destination.StartIndex);
          result += constructText(upDes, 1, referenceHTML, compareHTML);
          result += constructText(snake.Destination, 2, referenceHTML, compareHTML);
        } else {
          const bottomDes = new Record(snake.Destination.EndIndex, compareTerminal.EndIndex);
          result += constructText(bottomDes, 1, referenceHTML, compareHTML);
          result += constructText(snake.Destination, 2, referenceHTML, compareHTML);
        }
      }
      result += tail;
      return result;
    }
  }
}

function constructText(seq: any, status: any, referenceHTML: any, compareHTML: any) {
  let result = '';
  switch (status) {
    case 0:
      for (let i = seq.StartIndex; i < seq.EndIndex; i++) {
        result += referenceHTML[i].reconstructs('<span style="text-decoration: line-through; color: red">', '</span>');
      }
      break;
    case 1:
      for (let i = seq.StartIndex; i < seq.EndIndex; i++) {
        result += compareHTML[i].reconstructs('<span style="background: SpringGreen">', '</span>');
      }
      break;
    case 2:
      for (let i = seq.StartIndex; i < seq.EndIndex; i++) {
        result += compareHTML[i].reconstruct();
      }
      break;
    default:
      break;
  }
  return result;
}

function HtmlTextParser(s: any) {
  let curPos = 0;
  let prevPos = 0;
  let prefix = '';
  let suffix = '';
  let word = '';

  const result = [];

  while (curPos < s.length) {
    prevPos = curPos;
    while (curPos < s.length && (s[curPos] === null || s[curPos] === '' || s[curPos] === undefined || !s[curPos].trim())) {
      curPos++;
    }
    prefix += s.substring(prevPos, curPos);
    if (curPos === s.length) {
      if (prefix !== '') {
        result.push(new Word('', prefix, ''));
      }
      break;
    }
    if (s[curPos] === '<') {
      prevPos = curPos;
      while (s[curPos] !== '>' && curPos < s.length) {
        curPos++;
      }
      prefix += s.substring(prevPos, curPos + 1);
      if (curPos === s.length) {
        result.push(new Word('', prefix, ''));
        break;
      }
      curPos++;
      if (curPos === s.length) {
        result.push(new Word('', prefix, ''));
        break;
      }
      continue;
    } else if (s[curPos] === '&') {
      prevPos = curPos;
      if (curPos + 6 < s.length && s.substring(prevPos, prevPos + 6) === '&nbsp;') {
        prefix += '&nbsp;';
        curPos += 6;
        continue;
      }
      const pattern1 = /@"&#[0-9]{3};"/;

      if (curPos + 6 < s.length &&
        pattern1.test(s.substring(prevPos, prevPos + 6))) {
        result.push(new Word(s.substring(prevPos, prevPos + 6), prefix, ''));
        prefix = '';
        curPos += 6;
        continue;
      }

      const pattern2 = /@"&#[0-9]{2};"/;
      if (curPos + 5 < s.length &&
        pattern2.test(s.substring(prevPos, prevPos + 5))) {
        result.push(new Word(s.substring(prevPos, prevPos + 5), prefix, ''));
        prefix = '';
        curPos += 5;
        continue;
      }
      prevPos = curPos;
      while (curPos < s.length && s[curPos] !== '<') {
        curPos++;
      }
      word = s.substring(prevPos, curPos);

      prevPos = curPos;
      while (curPos < s.Length && (s[curPos] === null || s[curPos] === '' || s[curPos] === undefined || !s[curPos].trim())) {
        curPos++;
      }
      suffix += s.substring(prevPos, curPos);

      result.push(new Word(word, prefix, suffix));
      prefix = '';
      suffix = '';
    } else {
      prevPos = curPos;
      while (curPos < s.length && s[curPos] !== null && s[curPos] !== '' && s[curPos] !== undefined && s[curPos].trim() && s[curPos].trim() !== '' && s[curPos] !== '<' && s[curPos] !== '&') {
        curPos++;
      }
      word = s.substring(prevPos, curPos);

      prevPos = curPos;
      while (curPos < s.length && (s[curPos] === null || s[curPos] === '' || s[curPos] === undefined || !s[curPos].trim())) {
        curPos++;
      }
      suffix = s.substring(prevPos, curPos);
      processWord(result, prefix, word, suffix);
      prefix = '';
      suffix = '';
    }
  }
  return result;
}

function processWord(result: any, prefix: any, word: any, suffix: any) {
  const length = word.length;

  if (length === 1) {
    result.push(new Word(word, prefix, suffix));
  } else {
    result.push(new Word(word, prefix, suffix));
  }
}

class Word {
  _word = '';
  _prefix = '';
  _suffix = '';

  constructor(word: any, prefix: any, suffix: any) {
    this._word = word;
    this._prefix = prefix;
    this._suffix = suffix;
  }

  get word() {
    return this._word;
  }

  set word(value) {
    this._word = value;
  }

  get prefix() {
    return this._prefix;
  }

  set prefix(value) {
    this._prefix = value;
  }

  get suffix() {
    return this._suffix;
  }

  set suffix(value) {
    this._suffix = value;
  }

  reconstruct() {
    return this._prefix + this._word + this._suffix;
  }


  reconstructs(beginTag: any, endTag: any) {
    return this._prefix + beginTag + this._word + endTag + this._suffix;
  }
}

class MiddleSnake {
  Source = new Record(0, 0);
  Destination = new Record(0, 0);
  SESLength = 0;

  constructor() {
    this.Source = new Record(0, 0);
    this.Destination = new Record(0, 0);
  }
}

function findMiddleSnake(referenceTerminal: any, compareTerminal: any, referenceHTML: any, compareHTML: any, referenceSizeCarrier: any, compareSizeCarrier: any) {
  let d;
  let k;
  let x;
  let y;
  const midSnake = new MiddleSnake();

  const minDiag = referenceTerminal.StartIndex - compareTerminal.EndIndex;
  const maxDiag = referenceTerminal.EndIndex - compareTerminal.StartIndex;

  const fwdMid = referenceTerminal.StartIndex - compareTerminal.StartIndex;
  const bwdMid = referenceTerminal.EndIndex - compareTerminal.EndIndex;

  let fwdMin = fwdMid;
  let fwdMax = fwdMid;

  let bwdMin = bwdMid;
  let bwdMax = bwdMid;

  const odd = ((fwdMin - bwdMid) & 1) === 1;

  referenceSizeCarrier[fwdMid] = referenceTerminal.StartIndex;
  compareSizeCarrier[bwdMid] = referenceTerminal.EndIndex;

  for (d = 1; ; d++) {
    if (fwdMin > minDiag) {
      referenceSizeCarrier[--fwdMin - 1] = -1;
    } else {
      ++fwdMin;
    }

    if (fwdMax < maxDiag) {
      referenceSizeCarrier[++fwdMax + 1] = -1;
    } else {
      --fwdMax;
    }
    for (k = fwdMax; k >= fwdMin; k -= 2) {
      if (referenceSizeCarrier[k - 1] < referenceSizeCarrier[k + 1]) {
        x = referenceSizeCarrier[k + 1];
      } else {
        x = referenceSizeCarrier[k - 1] + 1;
      }
      y = x - k;
      midSnake.Source.StartIndex = x;
      midSnake.Destination.StartIndex = y;

      while (x < referenceTerminal.EndIndex &&
      y < compareTerminal.EndIndex &&
      referenceHTML[x].word === compareHTML[y].word) {
        x++;
        y++;
      }

      referenceSizeCarrier[k] = x;
      if (odd && k >= bwdMin && k <= bwdMax && x >= compareSizeCarrier[k]) {
        midSnake.Source.EndIndex = x;
        midSnake.Destination.EndIndex = y;
        midSnake.SESLength = 2 * d - 1;
        return midSnake;
      }
    }

    if (bwdMin > minDiag) {
      compareSizeCarrier[--bwdMin - 1] = Number.MAX_VALUE;
    } else {
      ++bwdMin;
    }
    if (bwdMax < maxDiag) {
      compareSizeCarrier[++bwdMax + 1] = Number.MAX_VALUE;
    } else {
      --bwdMax;
    }
    for (k = bwdMax; k >= bwdMin; k -= 2) {
      if (compareSizeCarrier[k - 1] < compareSizeCarrier[k + 1]) {
        x = compareSizeCarrier[k - 1];
      } else {
        x = compareSizeCarrier[k + 1] - 1;
      }
      y = x - k;
      midSnake.Source.EndIndex = x;
      midSnake.Destination.EndIndex = y;

      while (x > referenceTerminal.StartIndex &&
      y > compareTerminal.StartIndex &&
      referenceHTML[x - 1].word === compareHTML[y - 1].word) {
        x--;
        y--;
      }
      compareSizeCarrier[k] = x;
      if (!odd && k >= fwdMin && k <= fwdMax && x <= referenceSizeCarrier[k]) {
        midSnake.Source.StartIndex = x;
        midSnake.Destination.StartIndex = y;
        midSnake.SESLength = 2 * d;
        return midSnake;
      }
    }
  }
}
