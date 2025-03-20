import React, {useCallback, useEffect, useRef, useState} from 'react';

// Ширина и высота холста/видео
const VIDEO_WIDTH = 300;
const VIDEO_HEIGHT = 480;

// Статусы, чтобы информировать пользователя о процессе
const STATUSES = {
    ML5_LOADING: 'Загрузка ml5.js...',
    MODEL_LOADING: 'Запуск FaceMesh...',
    DRAWING: 'Цикл рисования запущен',
    DRAWING_STOP: 'Цикл рисования остановлен',
    ERROR: 'Ошибка'
};

// Функция для динамической загрузки ml5 из CDN (можно изменить на локальный файл).
function loadML5() {
    return new Promise((resolve, reject) => {
        // Проверим, не загружен ли уже скрипт
        if (window.ml5) {
            return resolve(window.ml5);
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/ml5@latest/dist/ml5.min.js';
        script.async = true;
        script.onload = () => {
            if (window.ml5) {
                resolve(window.ml5);
            } else {
                reject(new Error('Не удалось загрузить ml5.js'));
            }
        };
        script.onerror = () => reject(new Error('Ошибка загрузки скрипта ml5.js'));
        document.body.appendChild(script);
    });
}

const ML5FaceMesh = () => {
    const [status, setStatus] = useState(STATUSES.ML5_LOADING);
    const [facingMode, setFacingMode] = useState('user'); // "user" = фронтальная камера, "environment" = основная (задняя)


    // Рефы вместо глобальных переменных
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceMeshRef = useRef(null);
    const isWorkingRef = useRef(false);
    const facesRef = useRef([]);

    // Запуск детекции лица
    const detectStart = () => {
        faceMeshRef.current?.detectStart(videoRef.current, (results) => {
            facesRef.current = results || [];
        });
    };

    // Основной цикл отрисовки
    const drawFrame = () => {
        if (!isWorkingRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Отрисовываем видео
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Отрисовываем ключевые точки на лице
        const faces = facesRef.current;
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            for (let j = 0; j < face.keypoints.length; j++) {
                const { x, y } = face.keypoints[j];
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        ctx.restore();
        requestAnimationFrame(drawFrame);
    };

    const startDrawing = () => {
        isWorkingRef.current = true;
        setStatus(STATUSES.DRAWING);
        detectStart();
        requestAnimationFrame(drawFrame);
    };

    const stopDrawing = () => {
        isWorkingRef.current = false;
        setStatus(STATUSES.DRAWING_STOP);
        faceMeshRef.current?.detectStop();
    };

    // Инициализация видео с выбранной камеры
    const initVideo = async () => {
        try {
            // Отключаем поток, если он уже был запущен (при смене facingMode)
            if (videoRef.current && videoRef.current.srcObject) {
                const oldStream = videoRef.current.srcObject;
                if (oldStream && oldStream.getTracks) {
                    oldStream.getTracks().forEach((track) => track.stop());
                }
            }

            const constraints = {
                video: {
                    width: VIDEO_WIDTH,
                    height: VIDEO_HEIGHT,
                    facingMode: facingMode // "user" или "environment"
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoRef.current.srcObject = stream;

            // Ждём, пока метаданные загрузятся, после чего запускаем всё остальное
            videoRef.current.onloadedmetadata = async () => {
                videoRef.current.play();
                try {
                    setStatus(STATUSES.ML5_LOADING);
                    const ml5 = await loadML5();
                    setStatus(STATUSES.MODEL_LOADING);

                    // Инициализация faceMesh
                    faceMeshRef.current = ml5.faceMesh(
                      {
                          maxFaces: 1,
                          refineLandmarks: false,
                          flipHorizontal: false
                      },
                      () => {
                          // Когда модель готова, запускаем отрисовку
                          startDrawing();
                      }
                    );
                } catch (err) {
                    console.error(err);
                    setStatus(STATUSES.ERROR);
                }
            };
        } catch (err) {
            console.error('Ошибка доступа к веб-камере:', err);
            setStatus(STATUSES.ERROR);
        }
    };

    const handleSwitchCamera = useCallback(() => {
        stopDrawing();
        // После остановки переключаем режим и пересоздаём стрим
        setStatus(STATUSES.MODEL_LOADING);
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    }, [stopDrawing, STATUSES.MODEL_LOADING]);

    // При первом рендере и при смене facingMode — инициализируем видео.
    useEffect(() => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert('getUserMedia не поддерживается вашим браузером.');
            setStatus(STATUSES.ERROR);
            return;
        }
        initVideo();

        // При размонтаже останавливаем рисование и потоки
        return () => {
            stopDrawing();
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    return (
      <div style={{ maxWidth: 700 }}>
          <div style={{ marginBottom: 10 }}>
              <canvas
                ref={canvasRef}
                id="canvas"
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
                style={{ border: '1px solid #ddd' }}
              />
              <video
                ref={videoRef}
                id="video"
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
                autoPlay
                muted
                playsInline
                style={{ display: 'none' }}
              />
          </div>

          <div style={{ marginBottom: 10 }}>
              <strong>Статус: </strong>
              {status}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
              {status === STATUSES.DRAWING && (
                <button
                  className="text-white !bg-blue-500 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                  onClick={stopDrawing} type="button">
                    Остановить
                </button>
              )}
              {status === STATUSES.DRAWING_STOP && (
                <button
                  className="text-white !bg-blue-500 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                  onClick={startDrawing} type="button">
                    Запустить
                </button>
              )}
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
      </div>
    );
};

export default ML5FaceMesh;
