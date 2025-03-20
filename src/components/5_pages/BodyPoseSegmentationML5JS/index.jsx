import React, { useEffect, useRef, useState } from 'react';
import loadML5 from '../../../helpers/loadML5.js';
import { VIDEO_WIDTH, VIDEO_HEIGHT } from '../../../app/config.js';

// Функция для остановки медиапотока
function stopStream(stream) {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

function ImageClassifier() {
  const STATUSES = {
    ML5_LOADING: 'Загрузка ml5.js',
    MODEL_LOADING: 'Запуск ml5.js',
    DRAWING: 'Цикл рисования запущен',
    DRAWING_STOP: 'Цикл рисования остановлен'
  };

  const [status, setStatus] = useState(STATUSES.ML5_LOADING);

  // Ссылки на объекты
  const bodySegmentationRef = useRef(null);
  const videoRef = useRef(null);
  const segmentationRef = useRef(null);
  const isWorkingRef = useRef(false);
  const streamRef = useRef(null); // Храним текущий поток

  // Опции для BodyPix
  const optionsRef = useRef({
    maskType: 'parts'
  });

  // Список доступных видеокамер
  const [videoDevices, setVideoDevices] = useState([]);
  // Выбранная камера (deviceId)
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Получаем результат сегментации
  const gotResults = (result) => {
    segmentationRef.current = result;
  };

  // Если в ml5 нет метода detectStart, вызываем detect() в цикле
  const detect = () => {
    bodySegmentationRef.current?.segment(videoRef.current, gotResults);
  };

  // Пытаемся вызвать detectStart, иначе - detect
  const detectStart = () => {
    if (bodySegmentationRef.current?.detectStart) {
      bodySegmentationRef.current.detectStart(videoRef.current, gotResults);
    } else {
      detect();
    }
  };

  // Цикл отрисовки (перерисовываем видео + маску сегментации)
  const drawFrame = () => {
    if (!isWorkingRef.current) return;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    if (segmentationRef.current?.mask) {
      const maskData = segmentationRef.current.mask;
      const imageData = new ImageData(
        new Uint8ClampedArray(maskData.data),
        maskData.width,
        maskData.height
      );
      ctx.putImageData(imageData, 0, 0);
    }

    requestAnimationFrame(drawFrame);
  };

  // Запускаем отрисовку и сегментацию
  const startDraw = () => {
    isWorkingRef.current = true;
    drawFrame();
    detectStart();
    setStatus(STATUSES.DRAWING);
  };

  // Останавливаем отрисовку и сегментацию
  const stopDraw = () => {
    isWorkingRef.current = false;
    bodySegmentationRef.current?.detectStop?.();
    setStatus(STATUSES.DRAWING_STOP);
  };

  // Инициализация видео по выбранному deviceId
  const initVideo = async () => {
    // Останавливаем предыдущий стрим, если был
    stopStream(streamRef.current);

    // Запрашиваем новый стрим с нужной камерой
    const constraints = {
      video: {
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();

          // Загружаем ml5 и создаём модель
          loadML5(() => {
            setStatus(STATUSES.ML5_LOADING);
            bodySegmentationRef.current = window.ml5.bodySegmentation(
              'BodyPix',
              optionsRef.current,
              () => {
                setStatus(STATUSES.MODEL_LOADING);
                startDraw();
              }
            );
          });
        };
      }
    } catch (err) {
      alert('Ошибка доступа к веб-камере: ' + err);
    }
  };

  // При первом рендере получаем список камер.
  useEffect(() => {
    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter((d) => d.kind === 'videoinput');

        setVideoDevices(videoInputDevices);

        // Пытаемся найти фронтальную по названию (просто пример, может не сработать во всех браузерах)
        const frontCam = videoInputDevices.find((d) => d.label.toLowerCase().includes('front'));

        // Если есть "фронталка" – выбираем её, иначе берём первую
        if (frontCam) {
          setSelectedDeviceId(frontCam.deviceId);
        } else if (videoInputDevices.length > 0) {
          setSelectedDeviceId(videoInputDevices[0].deviceId);
        }
      } catch (err) {
        alert('Не удалось получить список устройств: ' + err);
      }
    })();
  }, []);

  // Каждый раз, когда меняется selectedDeviceId, перезапускаем видео
  useEffect(() => {
    if (selectedDeviceId) {
      initVideo();
    }
    // При размонтировании останавливаем стрим
    return () => {
      stopStream(streamRef.current);
      if (isWorkingRef.current) {
        stopDraw();
      }
    };
  }, [selectedDeviceId]);

  // Обработка выбора из списка
  const handleDeviceChange = (e) => {
    setSelectedDeviceId(e.target.value);
  };

  return (
    <div>
      <div className="mb-2">
        <label htmlFor="videoSelect">Выберите камеру:</label>{' '}
        <select id="videoSelect" value={selectedDeviceId} onChange={handleDeviceChange}>
          {videoDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Камера ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <canvas id="canvas" width={VIDEO_WIDTH} height={VIDEO_HEIGHT} />
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

      <div className="flex flex-col gap-2">
        <div>
          {status === STATUSES.DRAWING && (
            <button
              onClick={stopDraw}
              type="button"
              className="text-white !bg-blue-500 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
              Остановить
            </button>
          )}
        </div>
        <div>
          {status === STATUSES.DRAWING_STOP && (
            <button
              onClick={startDraw}
              type="button"
              className="text-white !bg-blue-500 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
              Запустить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImageClassifier;
