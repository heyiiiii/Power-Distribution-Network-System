export default function () {
  // eslint-disable-next-line no-extend-native
  Array.prototype.deleteMany = function (fn) {
    if (typeof fn === 'function') {
      const indexes = [];
      for (let i = 0; i < this.length; ++i) {
        if (fn(this[i], i, this)) {
          indexes.unshift(i);
        }
      }
      for (const i of indexes) {
        this.splice(i, 1);
      }
    } else {
      const indexes = [];
      for (let i = 0; i < this.length; ++i) {
        if (fn === this[i]) {
          indexes.unshift(i);
        }
      }
      for (const i of indexes) {
        this.splice(i, 1);
      }
    }
  };
  // eslint-disable-next-line no-extend-native
  Array.prototype.deleteOne = function (fn) {
    if (typeof fn === 'function') {
      for (let i = 0; i < this.length; ++i) {
        if (fn(this[i], i, this)) {
          this.splice(i, 1);
          return i;
        }
      }
    } else {
      for (let i = 0; i < this.length; ++i) {
        if (this[i] === fn) {
          this.splice(i, 1);
          return i;
        }
      }
    }
    return -1;
  };
}
