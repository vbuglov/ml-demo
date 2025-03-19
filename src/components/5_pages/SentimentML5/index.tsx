import { useEffect, useState } from 'react';
import loadML5 from '../../../helpers/loadML5.js';
import { VIDEO_HEIGHT, VIDEO_WIDTH } from '../../../app/config.js';

const STATUSES = {
    ML5_LOADING: 'Загрузка ml5.js',
    MODEL_LOADING: 'Запуск ml5.js',
    DONE: "Модель готова",
};


let sentiment;
// Инициализация видео с веб-камеры
function initSentiment(setStatus) {
    setStatus(STATUSES.MODEL_LOADING);
    loadML5(() => {
        sentiment = ml5.sentiment("MovieReviews", () =>
            setStatus(STATUSES.DONE)
        );
    })
}


const ML5Sentiment = () => {
    const [status, setStatus] = useState(STATUSES.ML5_LOADING);
    const [text, setText] = useState("Today is the happiest day and is full of rainbows!")
    const [sentimentValue, setSentimentValue] = useState("")

    useEffect(() => {
            initSentiment(setStatus);
    }, []);

    function gotResult(prediction) {
        setSentimentValue(prediction.confidence)
    }


    const calcSentiment = () => {
        sentiment.predict(text, gotResult);
    }

    return (
        <div className="max-w-[450px]">
            <div className="mb-6 flex flex-col gap-4">
                <h3>{status}</h3>

                <h1 className="!text-xl">Sentiment Analysis Demo</h1>

                <h2>В этом примере используется модель, обученная на обзорах фильмов. Эта модель оценивает тональность текста со значением от 0 («отрицательно») до 1 («положительно»). Обзоры фильмов были усечены до максимума в 200 слов, и используются только 20 000 самых распространенных слов в обзорах. Нажмите «Enter» на клавиатуре или «Отправить», чтобы увидеть оценку!</h2>
                <div className="flex flex-col gap-4">
                    <div
                        className="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <div
                            className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-600 border-gray-200">
                        </div>
                        <div className="px-4 py-2 bg-white rounded-b-lg dark:bg-gray-800">
                            <label htmlFor="editor" className="sr-only">Publish post</label>
                            <textarea value={text} onChange={(e) => setText(e.target.value)} id="editor" rows="8"
                                      className="block w-full px-0 text-sm text-gray-800 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
                                      placeholder="Write an article..." required></textarea>
                        </div>
                    </div>
                    <button type="button"
                            onClick={calcSentiment}
                            className="inline-flex w-[130px] items-center px-5 py-2.5 text-sm font-medium text-center text-white !bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800">
                        Publish post
                    </button>
                </div>
                <div>
                    <span>Настроение: {sentimentValue}</span>
                </div>
            </div>
        </div>
    );
};

export default ML5Sentiment;
