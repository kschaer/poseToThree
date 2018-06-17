const BiquadFilterInstance = (() => {
  class BiquadFilterInstance {
    constructor(fc) {
      this.Fc = 0.5;
      this.Q = 0.707;
      this.peakGain = 0.0;
      this.z1 = 0.0;
      this.z2 = 0.0;
      this.a0 = 0;
      this.a1 = 0;
      this.a2 = 0;
      this.b1 = 0;
      this.b2 = 0;
      this.Fc = fc;
      this.calcBiquad();
    }

    process(__in) {
      const out = __in * this.a0 + this.z1;
      this.z1 = __in * this.a1 + this.z2 - this.b1 * out;
      this.z2 = __in * this.a2 - this.b2 * out;
      return out;
    }

    calcBiquad() {
      let norm;
      const K = Math.tan(Math.PI * this.Fc);
      norm = 1 / (1 + K / this.Q + K * K);
      this.a0 = K * K * norm;
      this.a1 = 2 * this.a0;
      this.a2 = this.a0;
      this.b1 = 2 * (K * K - 1) * norm;
      this.b2 = (1 - K / this.Q + K * K) * norm;
    }
  }

  return BiquadFilterInstance;
})();
BiquadFilterInstance['__class'] = 'BiquadFilterInstance';
