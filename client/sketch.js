let socket;
let capture;
let poseNet;
let poses = [];
let skeletons = [];
function setup(){
  createCanvas(400, 300);
  capture = createCapture(VIDEO);
  capture.size(400,300);
  //hide the debug capture feed
  capture.hide()
  background(0);
  // Start a socket connection to the server
  // Some day we would run this server somewhere else
  socket = io.connect('http://localhost:3000');
  // We make a named event called 'mouse' and write an
  // anonymous callback function
  socket.on('mouse',
    // When we receive data
    function(data) {
      console.log("Got: " + data.x + " " + data.y);
      // Draw a blue circle
      fill(0,0,255);
      noStroke();
      ellipse(data.x, data.y, 20, 20);
    }
  );

  //graphics buffer
  pg = createGraphics(400,400)
  let options = {
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: true,
    minConfidence: 0.5,
    maxPoseDetections: 1,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single',
    multiplier: 0.75,
  }
  //get posenet from CDN
  poseNet = ml5.poseNet(capture, options, gotPoses);
  //graphics buffer for poses
  poser = createGraphics(400,300)
  socket.on('pose', function(data){
    console.log('receiving pose data')
    //function drawPosePoints() {

      // Loop through all the poses detected
      console.log(data)
      for(let i = 0; i < data.length; i++) {
        // For each pose detected, loop through all the keypoints
        //console.log(poses[0].pose.keypoints)
        for(let j = 0; j < data[i].pose.keypoints.length; j++) {
          //console.log()
          // A keypoint is an object describing a body part (like rightArm or leftShoulder)
          let keypoint = data[i].pose.keypoints[j];
          // Only draw an ellipse is the pose probability is bigger than 0.2
          if (keypoint.score > 0.2) {
            poser.ellipse(keypoint.position.x, keypoint.position.y, 10, 20);
          }
        }
      }
    //}
  })
}
//callback for when the pose model updates
function gotPoses(results) {
  poser.fill(40,200,244);
  poses = results;
  sendKeyPoints(results)
}
function sendKeyPoints(poseData) {
  // We are sending!
  //console.log("sendKeyPoints...");

  // Send that object to the socket
  socket.emit('pose',poseData);
}

function drawKeypoints() {
  // Loop through all the poses detected
  for(let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    //console.log(poses[0].pose.keypoints)
    for(let j = 0; j < poses[i].pose.keypoints.length; j++) {
      //console.log()
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = poses[i].pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}
// A function to draw the skeletons
function drawSkeleton() {
  strokeWeight(2)
  stroke(200,150,255)
  // Loop through all the skeletons detected
  for(let i = 0; i < poses.length; i++) {
    // For every skeleton, loop through all body connections
    for(let j = 0; j < poses[i].skeleton.length; j++) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}



function mouseDragged() {
  // Draw some white circles
  // fill(255);
  // noStroke();
  //ellipse(mouseX,mouseY,20,20);
  pg.noStroke()
  pg.fill(130,120,144)
  pg.ellipse(mouseX,mouseY,20,20)
  // Send the mouse coordinates
  sendmouse(mouseX,mouseY);
}
//emitting via socket
function sendmouse(xpos, ypos) {
  // We are sending!
  console.log("sendmouse: " + xpos + " " + ypos);
  // Make a little object with  and y
  var data = {
    x: xpos,
    y: ypos
  };

  // Send that object to the socket
  socket.emit('mouse',data);
}

function draw(){
  //image(capture, 0, 0, 400, 300)
  background(0,100)
  image(pg, 0, 0, 400, 400)
  drawKeypoints();
  drawSkeleton()
  image(poser, 0, 0, 400, 300)

  // fill(200)
  // noStroke()
  // ellipse(mouseX,mouseY,20,20)
}
