let isLoading = false;

const loadML5 = (onLoad = () => {}) => {
  if (!window.ml5 && !isLoading) {
    isLoading = true;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/ml5@1/dist/ml5.js';
    script.async = true;

    // Append the script to the body
    document.body.appendChild(script);

    script.onload = () => {
      isLoading = false;
      onLoad(window.ml5);
    };
  } else if (window.ml5) {
    onLoad(window.ml5);
  }
};

export default loadML5;
