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
let bodyPose;
let poses = [];
let connections = [];
let isWorking = false;

function draw() {
  if (!isWorking) return null;
  // Рисуем кадр с видео на canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Рисуем "скелет" (линии между ключевыми точками)
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];
    for (let j = 0; j < connections.length; j++) {
      const [pointAIndex, pointBIndex] = connections[j];
      const pointA = pose.keypoints[pointAIndex];
      const pointB = pose.keypoints[pointBIndex];

      // Рисуем линию, если уверенность (confidence) обеих точек > 0.2
      if (pointA.confidence > 0.2 && pointB.confidence > 0.2) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pointA.x, pointA.y);
        ctx.lineTo(pointB.x, pointB.y);
        ctx.stroke();
      }
    }
  }

  // Рисуем сами ключевые точки
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];
    for (let j = 0; j < pose.keypoints.length; j++) {
      const keypoint = pose.keypoints[j];
      // Рисуем кружок, если уверенность > 0.2
      if (keypoint.confidence > 0.2) {
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // Снова вызываем анимацию
  requestAnimationFrame(draw);
}

function gotPoses(results) {
  poses = results;
}

const startDraw = (setStatus) => {
  isWorking = true;
  requestAnimationFrame(draw);
  bodyPose.detectStart(video, gotPoses);
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

    // Основная функция инициализации
    async function setup() {
      video = document.getElementById('video');
      canvas = document.getElementById('canvas');
      ctx = canvas.getContext('2d');

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = stream;
      await video.play();

      // Загружаем модель MoveNet через ml5
      bodyPose = window.ml5.bodyPose(modelReady);
    }

    // Колбэк по завершении загрузки модели
    function modelReady() {
      connections = bodyPose.getSkeleton();
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
