import { useEffect, useRef, useState } from 'react';
import loadML5 from '../../../helpers/loadML5.js';

const STATUSES = {
  ML5_LOADING: 'Загрузка ml5.js',
  MODEL_LOADING: 'Загрузка весов модели',
  DRAWING: "'Цикл рисования запущен'",
  DRAWING_STOP: "'Цикл рисования остановлен'"
};

let isStarted = false;

let video;
let canvas;
let ctx;
let bodySegmentation;
let isWorking = false;
let segmentation = [];

function draw() {
  if (!isWorking) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (segmentation) {
    ctx.drawImage(segmentation.mask, 0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(draw);
}

function gotResults(results) {
  segmentation = results;
}

const startDraw = (setStatus) => {
  isWorking = true;
  requestAnimationFrame(draw);
  bodySegmentation.detectStart(video, gotResults);
  setStatus(STATUSES.DRAWING);
};

const stopDraw = (setStatus) => {
  isWorking = false;
  setStatus(STATUSES.DRAWING_STOP);
};

const startDrowPose = (setStatus) => {
  if (isStarted) {
    return null;
  }
  isStarted = true;

  loadML5(() => {
    setStatus(STATUSES.MODEL_LOADING);

    let options = {
      maskType: 'parts'
    };

    // Основная функция инициализации
    async function setup() {
      video = document.getElementById('video');
      canvas = document.getElementById('canvas');
      ctx = canvas.getContext('2d');

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = stream;
      await video.play();

      // Загружаем модель MoveNet через ml5
      bodySegmentation = window.ml5.bodySegmentation('BodyPix', options);
      startDraw(setStatus);
    }

    setup();
  });
};

const ImageClassifier = () => {
  const canvasRef = useRef();
  const videoRef = useRef();
  const [status, setStatus] = useState(STATUSES.ML5_LOADING);

  useEffect(() => {
    startDrowPose(setStatus);
    return () => {
      stopDraw(setStatus);
    };
  }, []);

  return (
    <>
      <div className="mb-6">
        <video
          ref={canvasRef}
          className="hidden"
          id="video"
          width="320"
          height="480"
          autoPlay
          playsInline></video>
        <canvas ref={videoRef} id="canvas" width="320" height="480"></canvas>
      </div>
      <div className="mb-4">{status}</div>
      <div className="flex flex-col gap-2">
        <div>
          {status === STATUSES.DRAWING && (
            <button
              onClick={() => stopDraw(setStatus)}
              type="button"
              className="text-white !bg-blue-500 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
              Остановить
            </button>
          )}
        </div>
        <div>
          {status === STATUSES.DRAWING_STOP && (
            <button
              onClick={() => startDraw(setStatus)}
              type="button"
              className="text-white !bg-blue-500 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
              Запустить
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ImageClassifier;
