import { useEffect, useState } from 'react';
import loadML5 from '../../../helpers/loadML5.js';

const checkImage = (setResults, setStatus) => {
  loadML5(() => {
    setStatus('Загрузка весов модели');

    const classifier = window.ml5.imageClassifier('MobileNet', modelLoaded);

    function modelLoaded() {
      setStatus('Вычисление результатов');
      classifyImage();
    }

    function classifyImage() {
      const image = document.getElementById('inputImage');
      classifier.classify(image, gotResult);
    }

    function gotResult(results) {
      setStatus('Вычисление закончено');
      setResults(results);
    }
  });
};

const ImageClassifier = () => {
  const [imageResults, setResults] = useState([]);
  const [src, setSrc] = useState(
    'https://avatars.mds.yandex.net/get-vertis-journal/4466156/200.jpg_1633347258286/orig'
  );
  const [status, setStatus] = useState('Загрузка ml5.js');

  const onFileUpload = (fileInput) => {
    const file = fileInput.target.files[0];
    if (!file) return;

    const imageURL = URL.createObjectURL(file);
    setSrc(imageURL);
  };

  useEffect(() => {
    checkImage(setResults, setStatus);
  }, [src]);

  return (
    <>
      <form className="max-w-sm mb-4">
        <label htmlFor="file-input" className="sr-only">
          Выбрать файл
        </label>
        <input
          onChange={onFileUpload}
          accept=".jpg, .png"
          type="file"
          name="file-input"
          id="file-input"
          className="block w-full border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none
    file:bg-gray-50 file:border-0
    file:me-4
    file:py-3 file:px-4
   "
        />
      </form>

      <div className="mb-6">
        <img
          id="inputImage"
          crossOrigin="anonymous"
          src={src}
          alt="Пример изображения"
          width="400"
        />
      </div>
      <div className="mb-4">{status}</div>
      <div className="flex flex-col">
        {imageResults.map(({ label, confidence }) => {
          return (
            <div className="flex gap-2" key={Math.random().toString(36).slice(-2)}>
              <div>{label}</div>
              <div>{(+confidence * 100).toFixed(2)}%</div>
            </div>
          );
        })}
      </div>

    </>
  );
};

export default ImageClassifier;
