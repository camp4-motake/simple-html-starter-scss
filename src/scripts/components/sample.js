import { createApp } from 'petite-vue';

export const sample = () => {
  createApp({
    count: 0,
    get plusOne() {
      return this.count + 1;
    },
    increment() {
      this.count++;
      console.log(this.count);
    },
  }).mount();
};
