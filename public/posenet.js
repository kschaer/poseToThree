import * as posenet from '@tensorflow-models/posenet';
const imageScaleFactor = 0.50;
const flipHorizontal = false;
const outputStride = 16;
const imageElement = document.getElementById('cat');
// load the posenet model


// working with one image!!!
/*
export async function bindPage(){
  const net = await posenet.load();
const pose = await net.estimateSinglePose(imageElement, scaleFactor, flipHorizontal, outputStride);
console.log('pose?', pose)
}
bindPage()
*/


const videoWidth = 600;
const videoHeight = 500;

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined : videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}
async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}


// //consts for posenet
// const guiState = {
//   algorithm: 'single-pose',
//   input: {
//     mobileNetArchitecture: isMobile() ? '0.50' : '0.75',
//     outputStride: 16,
//     imageScaleFactor: 0.5,
//   },
//   singlePoseDetection: {
//     minPoseConfidence: 0.1,
//     minPartConfidence: 0.5,
//   },
//   multiPoseDetection: {
//     maxPoseDetections: 5,
//     minPoseConfidence: 0.15,
//     minPartConfidence: 0.1,
//     nmsRadius: 30.0,
//   },
//   output: {
//     showVideo: true,
//     showSkeleton: true,
//     showPoints: true,
//   },
//   net: null,
// };

// function detectPoseInRealTime(video, net) {
//   const canvas = document.getElementById('output');
//   const ctx = canvas.getContext('2d');
//   // since images are being fed from a webcam
//   const flipHorizontal = true;

//   canvas.width = videoWidth;
//   canvas.height = videoHeight;

//   async function poseDetectionFrame() {
//     if (guiState.changeToArchitecture) {
//       // Important to purge variables and free up GPU memory
//       guiState.net.dispose();

//       // Load the PoseNet model weights for either the 0.50, 0.75, 1.00, or 1.01
//       // version
//       guiState.net = await posenet.load(+guiState.changeToArchitecture);

//       guiState.changeToArchitecture = null;
//     }

//     // Begin monitoring code for frames per second
//     stats.begin();

//     // Scale an image down to a certain factor. Too large of an image will slow
//     // down the GPU
//     const imageScaleFactor = guiState.input.imageScaleFactor;
//     const outputStride = +guiState.input.outputStride;

//     let poses = [];
//     let minPoseConfidence;
//     let minPartConfidence;
//     switch (guiState.algorithm) {
//       case 'single-pose':
//         const pose = await guiState.net.estimateSinglePose(
//             video, imageScaleFactor, flipHorizontal, outputStride);
//         poses.push(pose);

//         minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
//         minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;
//         break;
//       case 'multi-pose':
//         poses = await guiState.net.estimateMultiplePoses(
//             video, imageScaleFactor, flipHorizontal, outputStride,
//             guiState.multiPoseDetection.maxPoseDetections,
//             guiState.multiPoseDetection.minPartConfidence,
//             guiState.multiPoseDetection.nmsRadius);

//         minPoseConfidence = +guiState.multiPoseDetection.minPoseConfidence;
//         minPartConfidence = +guiState.multiPoseDetection.minPartConfidence;
//         break;
//     }

//     ctx.clearRect(0, 0, videoWidth, videoHeight);

//     if (guiState.output.showVideo) {
//       ctx.save();
//       ctx.scale(-1, 1);
//       ctx.translate(-videoWidth, 0);
//       ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
//       ctx.restore();
//     }

//     // For each pose (i.e. person) detected in an image, loop through the poses
//     // and draw the resulting skeleton and keypoints if over certain confidence
//     // scores
//     poses.forEach(({score, keypoints}) => {
//       if (score >= minPoseConfidence) {
//         if (guiState.output.showPoints) {
//           drawKeypoints(keypoints, minPartConfidence, ctx);
//         }
//         if (guiState.output.showSkeleton) {
//           drawSkeleton(keypoints, minPartConfidence, ctx);
//         }
//       }
//     });

//     // End monitoring code for frames per second
//     stats.end();

//     requestAnimationFrame(poseDetectionFrame);
//   }

//   poseDetectionFrame();
// }

// /**
//  * Kicks off the demo by loading the posenet model, finding and loading
//  * available camera devices, and setting off the detectPoseInRealTime function.
//  */
// export async function bindPage() {
//   // Load the PoseNet model weights with architecture 0.75
//   const net = await posenet.load(0.75);

//   document.getElementById('loading').style.display = 'none';
//   document.getElementById('main').style.display = 'block';

//   let video;

//   try {
//     video = await loadVideo();
//   } catch (e) {
//     let info = document.getElementById('info');
//     info.textContent = 'this browser does not support video capture,' +
//         'or this device does not have a camera';
//     info.style.display = 'block';
//     throw e;
//   }

//   setupFPS();
//   detectPoseInRealTime(video, net);
// }

// navigator.getUserMedia = navigator.getUserMedia ||
//     navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// // kick off the demo
// bindPage();
