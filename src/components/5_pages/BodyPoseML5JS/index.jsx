import { useEffect, useRef, useState, useCallback } from 'react';
import loadML5 from '../../../helpers/loadML5.js';

const BodyPoseML5JS = () => {
  const STATUSES = {
    ML5_LOADING: 'Загрузка ml5.js',
    MODEL_LOADING: 'Загрузка весов модели',
    DRAWING: 'Цикл рисования запущен',
    DRAWING_STOP: 'Цикл рисования остановлен'
  };

  // Управление состоянием и ссылками (refs)
  const [status, setStatus] = useState(STATUSES.ML5_LOADING);
  const [cameraFacingMode, setCameraFacingMode] = useState('user'); // user | environment

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const isWorkingRef = useRef(false);
  const isStartedRef = useRef(false);

  const bodyPoseRef = useRef(null);
  const connectionsRef = useRef([]);
  const posesRef = useRef([]);

  // Функция, вызываемая моделью при получении поз
  const gotPoses = useCallback((results) => {
    posesRef.current = results;
  }, []);

  // Рекурсивный цикл рендера кадра с разметкой позы
  const draw = useCallback(() => {
    if (!isWorkingRef.current) return;

    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return;

    const ctx = canvasEl.getContext('2d');

    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

    // Рисуем "скелет"
    for (let i = 0; i < posesRef.current.length; i++) {
      const pose = posesRef.current[i];
      for (let j = 0; j < connectionsRef.current.length; j++) {
        const [pointAIndex, pointBIndex] = connectionsRef.current[j];
        const pointA = pose.keypoints[pointAIndex];
        const pointB = pose.keypoints[pointBIndex];

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

    // Рисуем ключевые точки
    for (let i = 0; i < posesRef.current.length; i++) {
      const pose = posesRef.current[i];
      for (let j = 0; j < pose.keypoints.length; j++) {
        const keypoint = pose.keypoints[j];
        if (keypoint.confidence > 0.2) {
          ctx.fillStyle = 'green';
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(draw);
  }, []);

  // Запуск отрисовки и детекта
  const startDraw = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !bodyPoseRef.current) return;

    isWorkingRef.current = true;
    setStatus(STATUSES.DRAWING);

    requestAnimationFrame(draw);
    bodyPoseRef.current.detectStart(videoEl, gotPoses);
  }, [draw, gotPoses, STATUSES.DRAWING]);

  // Остановка отрисовки и детекта
  const stopDraw = useCallback(() => {
    if (!bodyPoseRef.current) return;
    isWorkingRef.current = false;
    bodyPoseRef.current.detectStop();
    setStatus(STATUSES.DRAWING_STOP);
  }, [STATUSES.DRAWING_STOP]);

  // Инициализация видео и модели (с учётом выбранного cameraFacingMode)
  const initVideoAndModel = useCallback(async () => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return;

    // Запрашиваем медиапоток с учётом facingMode
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraFacingMode },
      audio: false
    });
    videoEl.srcObject = stream;
    await videoEl.play();

    // Загружаем модель MoveNet через ml5
    bodyPoseRef.current = window.ml5.bodyPose(() => {
      setStatus(STATUSES.DRAWING);
      connectionsRef.current = bodyPoseRef.current.getSkeleton();
      startDraw();
    });
  }, [startDraw, cameraFacingMode, STATUSES.DRAWING]);

  // Основная функция, которую вызываем при загрузке ml5
  const setup = useCallback(() => {
    loadML5(() => {
      setStatus(STATUSES.MODEL_LOADING);
      initVideoAndModel();
    });
  }, [initVideoAndModel, STATUSES.MODEL_LOADING]);

  // Первичный запуск (один раз при маунте)
  useEffect(() => {
    if (!isStartedRef.current) {
      isStartedRef.current = true;
      setup();
    }

    // При размонтировании остановим отрисовку
    return () => {
      if (isWorkingRef.current) {
        stopDraw();
      }
    };
  }, [setup, stopDraw]);

  // Хендлер переключения камеры (между фронтальной и тыловой)
  const handleSwitchCamera = useCallback(() => {
    stopDraw();
    // После остановки переключаем режим и пересоздаём стрим
    setStatus(STATUSES.MODEL_LOADING);
    setCameraFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, [stopDraw, STATUSES.MODEL_LOADING]);

  // При каждом изменении cameraFacingMode - пересоздаём видеопоток и модель
  useEffect(() => {
    // Если initVideoAndModel ещё не был создан (до первой загрузки), пропускаем.
    if (isStartedRef.current) {
      initVideoAndModel();
    }
  }, [cameraFacingMode, initVideoAndModel]);

  return (
    <>
      <div className="mb-6">
        <video
          ref={videoRef}
          className="hidden"
          id="video"
          width="320"
          height="400"
          autoPlay
          playsInline></video>
        <canvas ref={canvasRef} id="canvas" width="320" height="400"></canvas>
      </div>

      <div className="mb-4">{status}</div>

      <div className="flex flex-col gap-2">
        {/* Кнопки управления */}
        <div>
          {status === STATUSES.DRAWING && (
            <button
              onClick={stopDraw}
              type="button"
              className="text-white !bg-blue-500 hover:bg-blue-800 focus:ring-4
                         focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2
                         dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none
                         dark:focus:ring-blue-800">
              Остановить
            </button>
          )}
          {status === STATUSES.DRAWING_STOP && (
            <button
              onClick={startDraw}
              type="button"
              className="text-white !bg-blue-500 hover:bg-blue-800 focus:ring-4
                         focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2
                         dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none
                         dark:focus:ring-blue-800">
              Запустить
            </button>
          )}
        </div>

        {/* Кнопка для переключения фронтальной/тыловой камеры */}
        <button
          type="button"
          onClick={handleSwitchCamera}
          className="text-white !bg-green-500 hover:bg-green-700 focus:ring-4
                     focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2
                     dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none
                     dark:focus:ring-green-800">
          Переключить камеру
        </button>
      </div>
    </>
  );
};

export default BodyPoseML5JS;
