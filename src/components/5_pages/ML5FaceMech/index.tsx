import { useEffect, useState } from 'react';
import loadML5 from '../../../helpers/loadML5.js';
import { VIDEO_HEIGHT, VIDEO_WIDTH } from '../../../app/config.js';

const STATUSES = {
    ML5_LOADING: 'Загрузка ml5.js',
    MODEL_LOADING: 'Запуск ml5.js',
    DRAWING: "'Цикл рисования запущен'",
    DRAWING_STOP: "'Цикл рисования остановлен'"
};

let faceMesh;
let video;
let faces = [];
const options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let isWorking = false;

const detectStart = () => {
    faceMesh.detectStart(video, gotFaces);
};

function drawFrame() {
    if (!isWorking) {
        return null;
    }
    const canvas = document.getElementById('canvas');
    const canvasCtx = canvas.getContext('2d');

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the video frame first
    canvasCtx.drawImage(
        video,
        0, 0,
        canvas.width,
        canvas.height
    );

    for (let i = 0; i < faces.length; i++) {
        let face = faces[i];
        for (let j = 0; j < face.keypoints.length; j++) {
            let keypoint = face.keypoints[j];

            canvasCtx.beginPath();
            canvasCtx.arc(keypoint.x, keypoint.y, 2 /* radius */, 0, 2 * Math.PI);
            canvasCtx.fill();
        }
    }

    canvasCtx.restore();

    requestAnimationFrame(drawFrame);
}

const startDraw = (setStatus) => {
    isWorking = true;
    drawFrame();
    detectStart();
    setStatus(STATUSES.DRAWING);
};

const stopDraw = (setStatus) => {
    isWorking = false;
    faceMesh.detectStop();
    setStatus(STATUSES.DRAWING_STOP);
};

// Инициализация видео с веб-камеры
function initVideo(setStatus) {
    video = document.getElementById('video');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia({ video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } })
            .then((stream) => {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play();

                    loadML5(() => {
                        setStatus(STATUSES.ML5_LOADING);
                        faceMesh = window.ml5.faceMesh(options, () =>
                            startDraw(setStatus)
                        );
                    });
                };
            })
            .catch((err) => {
                alert('Ошибка доступа к веб-камере:', err);
            });
    } else {
        alert('getUserMedia не поддерживается вашим браузером.');
    }
}

function gotFaces(result) {
    faces = result;
}

const ML5FaceMech = () => {
    const [status, setStatus] = useState(STATUSES.ML5_LOADING);

    useEffect(() => {
        initVideo(setStatus);
        return () => {
            if (isWorking) {
                stopDraw(setStatus);
            }
        };
    }, []);

    return (
        <>
            <div className="mb-6">
                <canvas id="canvas" width={VIDEO_WIDTH} height={VIDEO_HEIGHT}></canvas>
                <video
                    id="video"
                    width={VIDEO_WIDTH}
                    height={VIDEO_HEIGHT}
                    autoPlay
                    muted
                    playsInline
                    className="hidden"></video>
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

export default ML5FaceMech;
