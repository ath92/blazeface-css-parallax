import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-backend-webgl';

const strength = 10;
const amountOfSmoothingValues = 4;

(async () => {
    // Pass in a video stream to the model to obtain 
    // a prediction from the MediaPipe graph.
    const video = document.querySelector("video");
    const room = document.querySelector(".room");

    let pastValues = Array(amountOfSmoothingValues).fill(0).map(val => [val, val]);
    
    const loop = async (model) => {
        const faces = await model.estimateFaces(video);
         
        faces.forEach(face => {
            if (face.probability < 0.95) return;
            const x = face.topLeft[0];
            const y = face.topLeft[1];
            const width = face.bottomRight[0] - x;
            const height = face.bottomRight[1] - y;
            // get coordinates ranging from 0 to 1, and flipped horizontally
            const middle = [2 * (x + width / 2) / video.videoWidth - 1, -2 * (y + height / 2) / video.videoHeight + 1];
            pastValues = [...pastValues.slice(1, amountOfSmoothingValues), middle];
            const average = pastValues
                .reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0])
                .map(v => v / amountOfSmoothingValues);

            room.style.transform = `translate3D(${strength * average[0]}vw, ${strength * average[1]}vh, -45vw)`;
        });

        requestAnimationFrame(() => loop(model));
    }
    
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(async (stream) => {
          video.srcObject = stream;
          // Load the MediaPipe handpose model assets.
          const model = await blazeface.load();
          document.querySelector('.message').innerHTML = '';
          video.addEventListener('loadeddata', () => loop(model));
        })
        .catch(function (error) {
          console.log("Something went wrong!", error);
        });
    }
})();