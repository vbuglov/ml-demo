import React, {useEffect, useState, useRef, useCallback} from 'react';
// Если у вас есть собственная реализация loadML5.js, импортируйте её так:
import loadML5 from '../../../helpers/loadML5.js';
// Иначе можно прописать напрямую – тогда нужно будет заменить loadML5 соответствующим кодом.

const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 400;

const STATUSES = {
    ML5_LOADING: 'Загрузка ml5.js',
    MODEL_LOADING: 'Запуск ml5.js',
    DRAWING: 'Цикл рисования запущен',
    DRAWING_STOP: 'Цикл рисования остановлен'
};

const ML5FaceMesh = () => {
    const [status, setStatus] = useState(STATUSES.ML5_LOADING);
    const [facingMode, setFacingMode] = useState('user'); // выбор камеры ('user' или 'environment')

    // Ссылки, чтобы хранить объекты и не перерисовывать компонент:
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceMeshRef = useRef(null);
    const facesRef = useRef([]); // здесь храним массив лиц, найденных faceMesh
    const isWorkingRef = useRef(false); // флаг «идёт ли сейчас рисование?»

    // Параметры для faceMesh:
    const options = {
        maxFaces: 1,
        refineLandmarks: false,
        flipHorizontal: false
    };

    // Функция, которую ml5 вызывает при каждом новом фрейме распознавания:
    const gotFaces = (results) => {
        facesRef.current = results;
    };

    // Основной цикл отрисовки canvas:
    const drawFrame = () => {
        if (!isWorkingRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;

        if (!canvas || !ctx || !video) return;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Нарисовать кадр с веб-камеры
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Отрисовать точки лица поверх
        facesRef.current.forEach((face) => {
            face.keypoints.forEach((kp) => {
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });
        });

        ctx.restore();
        requestAnimationFrame(drawFrame);
    };

    // Запуск faceMesh и цикла отрисовки
    const startDraw = () => {
        if (!videoRef.current || !faceMeshRef.current) return;

        // Начинаем рисовать:
        isWorkingRef.current = true;
        setStatus(STATUSES.DRAWING);

        // Запустить детектирование:
        faceMeshRef.current.detectStart(videoRef.current, gotFaces);

        // Запустить цикл рисования:
        requestAnimationFrame(drawFrame);
    };

    // Остановка faceMesh и цикла отрисовки
    const stopDraw = () => {
        if (faceMeshRef.current) {
            faceMeshRef.current.detectStop();
        }
        isWorkingRef.current = false;
        setStatus(STATUSES.DRAWING_STOP);
    };

    // Функция инициализации камеры:
    const initVideo = async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            // Запрашиваем стрим
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: VIDEO_WIDTH,
                    height: VIDEO_HEIGHT,
                    facingMode: facingMode // 'user' или 'environment'
                }
            });

            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                // Как только видео готово, загружаем ml5, если ещё не загружен
                loadML5(() => {
                    setStatus(STATUSES.MODEL_LOADING);
                    // Инициализируем faceMesh
                    faceMeshRef.current = window.ml5.faceMesh(options, () => {
                        // Когда модель готова, запускаем всё
                        startDraw();
                    });
                });
            };
        } catch (err) {
            alert('Ошибка доступа к веб-камере: ' + err);
        }
    };

    // Эффект, который при загрузке компонента и при смене facingMode
    // перезапускает камеру и faceMesh
    useEffect(() => {
        stopDraw(); // на всякий случай останавливаем предыдущий стрим, если был
        initVideo();

        // Очищаемся при размонтировании:
        return () => {
            stopDraw();
            // Останавливаем стрим, если есть
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    const handleSwitchCamera = useCallback(() => {
        stopDraw();
        // После остановки переключаем режим и пересоздаём стрим
        setStatus(STATUSES.MODEL_LOADING);
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    }, [stopDraw, STATUSES.MODEL_LOADING]);

    return (
      <div>
          <div className="mb-6">
              <canvas
                id="canvas"
                ref={canvasRef}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
              />
              <video
                id="video"
                ref={videoRef}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
                autoPlay
                muted
                playsInline
                className="hidden"
              />
          </div>

          <div className="mb-4">{status}</div>

          {/* Кнопки управления */}
          <div className="flex flex-col gap-2">
              {/* Остановка распознавания */}
              {status === STATUSES.DRAWING && (
                <button
                  onClick={stopDraw}
                  type="button"
                  className="text-white !bg-blue-500 hover:bg-blue-800
                       focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm
                       px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700
                       focus:outline-none dark:focus:ring-blue-800"
                >
                    Остановить
                </button>
              )}

              {/* Запуск распознавания */}
              {status === STATUSES.DRAWING_STOP && (
                <button
                  onClick={startDraw}
                  type="button"
                  className="text-white !bg-blue-500 hover:bg-blue-800
                       focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm
                       px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700
                       focus:outline-none dark:focus:ring-blue-800"
                >
                    Запустить
                </button>
              )}
          </div>
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
    );
};

export default ML5FaceMesh;
