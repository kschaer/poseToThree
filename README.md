# poseToThree: an experiment in pose-based browser interaction
### View the project in action at https://kschaer.github.io - requires Google Chrome (non-mobile) and a webcam. 
This experiment uses **Tensorflow.js** and the **Posenet** model to control a fabric simulation built with **Three.js**. Winner of the "nerd cred" award for most technically challenging project during a four day hackathon at Grace Hopper/Fullstack Academy!


## background and inspiration
Whole-body interaction is one of the classic themes in media artwork. From [Camille Utterback's Text Rain  (1999)](http://camilleutterback.com/projects/text-rain/) to [Golan Levin's Ghost Polle Propagator II (2016)](http://www.flong.com/projects/gpp-ii/), or the mechanical and software-based [Mirrors by Daniel Rozin](http://www.smoothware.com/danny/), and back to [Myron Kreuger's Videoplace(1975)](http://thedigitalage.pbworks.com/w/page/22039083/Myron%20Krueger) countless media artists have leveraged camera and sensor-based inputs to bring viewers directly into the artworks. 

Contrary to the experience a viewer might have looking at a static artwork, these works have a powerful and magnetic effect- the viewer sees the work, and as a mirror, the work looks back. The moment where a user realizes they are (1) being "detected" in some manner, and (2) that their presence is affecting the work, is distinct; the viewer will break from their normal posture and begin to move in a new way. Wiggling and shifting their weight from side to side, raising arms to wave, perhaps making silly faces- it's something of a funhouse-mirror moment. Whether to test the limits of how they can affect the artwork, investigate how the artwork is sensing its viewers, or simply in a moment of play and delight— the effect of these interactive artworks is undeniable. 

In recent years, the technology available for sensing and extracting data about a person's body, gestures, poses, and expressions has exploded. Putting aside the motivations for the development of these technologies, there are an incredible amount of tools available to artists wishing to make these kinds of interactive works. 
* [Artists hacked the Kinect](https://creators.vice.com/en_us/article/535k78/the-greatest-kinect-hacks-weve-seen-thus-far) basically immediately upon release
* [A "panoptic dome"](https://www.michelledoeswhat.com/point-cloud) becomes the ultimate motion-capture stage
* [a Playstation camera](https://en.wikipedia.org/wiki/EyeToy) is a cheap and incredibly capable device for experimenting with computer vision

A particularly exciting development has been machine-learning driven pose estimation, which allows the estimation of human pose and posture from a normal 2D image. The Google Creative Lab recently released an open-source version of the [Posenet model for Tensorflow.js](https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5), allowing the implementation of real-time pose estimation in the browser with minimal javascript. 

The Fabric simulation was created based on https://threejs.org/examples/#webgl_animation_cloth, and responds in real time based on the pose and motion of the user. 

The pose is detected in real time from the user's webcam feed using the Posenet model
