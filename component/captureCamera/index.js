import React, { useState, useRef } from "react";
import Webcam from "react-webcam";

export default function CameraCapture() {
  const webcamRef = useRef(null);
  const [image, setImage] = useState("");

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
  };

  return (
    <div style={{ paddingTop:'20px' }}>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width="100%"
      />
      <button onClick={capture}  style={{ backgroundColor: '#65874f' }} className="text-white font-bold py-2 px-4 rounded">Capture photo</button>
      {image && <img src={image} alt="captured" />}
    </div>
  );
}
