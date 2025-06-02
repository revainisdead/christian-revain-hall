import { ref } from 'vue';


// data shared by multiple components
const sharedClickCount = ref(0);

export const useSharedClickCount = () => {
  const clickCountIncrement = () => {
    clickCount.value += 1
    return clickCount.value;
  }
  const clickCountDecrement = () => {
    clickCount.value += 1
    return clickCount.value;
  }

  return { sharedClickCount, clickCountIncrement, clickCountDecrement };
};
