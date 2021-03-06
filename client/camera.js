/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licnses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from '@tensorflow-models/posenet';
import Stats from 'stats.js';
import {drawKeypoints, drawSkeleton} from './demo_util';
import {
  animateCloth,
  leftWristController,
  rightWristController,
} from './threeCloth';
import Typed from 'typed.js';

const videoWidth = 600;
const videoHeight = 500;
const docWidth = window.innerWidth;
const docHeight = window.innerHeight;
const stats = new Stats();

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}

let typerOptions = {
  strings: [
    'welcome',
    'this is an experiment by Kaitlin Schaer',
    'playing with pose and gesture in the browser',
    'turn on your webcam to interact',
    ':)',
    'poseToThree.js',
  ],
  typeSpeed: 40,
  loop: false,
  showCursor: true,
  cursorChar: '|',
  backDelay: 1000,
};
let typer = new Typed('.typer', typerOptions);

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser API navigator.mediaDevices.getUserMedia not available'
    );
  }

  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
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

const guiState = {
  algorithm: 'single-pose',
  input: {
    // mobileNetArchitecture: isMobile() ? '0.50' : '0.75',
    mobileNetArchitecture: 0.75,
    outputStride: 16,
    imageScaleFactor: 0.3,
  },
  singlePoseDetection: {
    minPoseConfidence: 0.25,
    minPartConfidence: 0.5,
  },
  multiPoseDetection: {
    maxPoseDetections: 5,
    minPoseConfidence: 0.15,
    minPartConfidence: 0.1,
    nmsRadius: 30.0,
  },
  output: {
    showVideo: false,
    showSkeleton: true,
    showPoints: true,
  },
  net: null,
};

/**
 * Sets up dat.gui controller on the top-right of the window
 */
function setupGui(cameras, net) {
  guiState.net = net;

  if (cameras.length > 0) {
    guiState.camera = cameras[0].deviceId;
  }
}

/**
 * Sets up a frames per second panel on the top-left of the window
 */
function setupFPS() {
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
}

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */

let leftWristX = 0;
let leftWristY = 0;
let rightWristX = 0;
let rightWristY = 0;

// make a moving average queue:
const maxBuffer = 10;
const reducer = (a, b) => a + b;
const reduceAvg = function(arr) {
  return arr.reduce(reducer) / arr.length;
};
let bufferLX = [];
let bufferLY = [];
let bufferRX = [];
let bufferRY = [];
let avgLX;
let avgLY;
let avgRX;
let avgRY;

function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');
  // since images are being fed from a webcam
  const flipHorizontal = true;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function poseDetectionFrame() {
    // Begin monitoring code for frames per second
    stats.begin();

    const imageScaleFactor = guiState.input.imageScaleFactor;
    const outputStride = +guiState.input.outputStride;

    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;

    const pose = await guiState.net.estimateSinglePose(
      video,
      imageScaleFactor,
      flipHorizontal,
      outputStride
    );
    poses.push(pose);

    minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
    minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;

    ctx.clearRect(0, 0, videoWidth, videoHeight);

    if (guiState.output.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      ctx.restore();
    }

    // if we don't have points yet, find them:
    if (!leftWristX || !leftWristY) {
      leftWristX =
        poses[0].keypoints[10].position.x - videoWidth / 2 + docWidth / 2;
      leftWristY =
        poses[0].keypoints[10].position.y - videoHeight / 2 + docHeight / 2;
    }
    if (!rightWristX || !rightWristY) {
      rightWristX =
        poses[0].keypoints[9].position.x - videoWidth / 2 + docWidth / 2;
      rightWristY =
        poses[0].keypoints[9].position.y - videoHeight / 2 + docHeight / 2;
    }
    leftWristX =
      poses[0].keypoints[10].position.x - videoWidth / 2 + docWidth / 2;
    leftWristY =
      poses[0].keypoints[10].position.y - videoHeight / 2 + docHeight / 2;
    rightWristX =
      poses[0].keypoints[9].position.x - videoWidth / 2 + docWidth / 2;
    rightWristY =
      poses[0].keypoints[9].position.y - videoHeight / 2 + docHeight / 2;

    if (bufferLX.length > maxBuffer) {
      // shift off first ele:
      bufferLX.shift();
      bufferLY.shift();
      bufferRX.shift();
      bufferRY.shift();
    }
    // push latest pose coords to their arrays
    bufferLX.push(leftWristX);
    bufferLY.push(leftWristY);
    bufferRX.push(rightWristX);
    bufferRY.push(rightWristY);
    // calculate avgs in the buffers
    if (bufferLX.length) {
      avgLX = reduceAvg(bufferLX);
      avgLY = reduceAvg(bufferLY);
      avgRX = reduceAvg(bufferRX);
      avgRY = reduceAvg(bufferRY);
    } else {
      avgLX = leftWristX;
      avgLY = leftWristY;
      avgRX = rightWristX;
      avgRY = rightWristY;
    }

    poses.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
          // send to THREE
          leftWristController(avgLX, avgLY);
          rightWristController(avgRX, avgRY);
        }
        if (guiState.output.showSkeleton) {
          drawSkeleton(keypoints, minPartConfidence, ctx);
        }
      }
    });

    // End monitoring code for frames per second
    stats.end();
    // CALL THE THREE ANIMATION
    animateCloth();
    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

export async function bindPage() {
  // Load the PoseNet model weights with architecture 0.75
  const net = await posenet.load(0.75);

  document.getElementById('loading').style.display = 'none';
  document.getElementById('main').style.display = 'block';

  let video;

  try {
    video = await loadVideo();
  } catch (e) {
    let info = document.getElementById('info');
    info.textContent =
      'this browser does not support video capture,' +
      'or this device does not have a camera';
    info.style.display = 'block';
    throw e;
  }

  setupGui([], net);
  setupFPS();
  detectPoseInRealTime(video, net);
}

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
// kick off the demo
bindPage();
