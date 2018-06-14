let socket;
let capture;
function setup(){
  createCanvas(400, 400);
  capture = createCapture(VIDEO);
  capture.size(320,240);
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
  //nothing here yet
  image(capture, 0, 0, 320, 240)
  image(pg, 0, 0, 400, 400)
  // fill(200)
  // noStroke()
  // ellipse(mouseX,mouseY,20,20)
}
