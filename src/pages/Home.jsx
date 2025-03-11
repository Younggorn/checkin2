import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2"; // Import SweetAlert

export default function Home() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const token = localStorage.getItem("token");

  const openCamera = () => {
    setIsOpen(true);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        Swal.fire({
          icon: "error",
          title: "Camera Access Denied",
          text: "Please allow camera access in your browser settings.",
        });
        setIsOpen(false);
      });
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const newWidth = 200;
    const newHeight = (video.videoHeight / video.videoWidth) * newWidth;

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.drawImage(video, 0, 0, newWidth, newHeight);

    setImage(canvas.toDataURL("image/jpeg", 0.7));
  };

  const checkIn = async () => {
    if (!image) {
      Swal.fire({
        icon: "warning",
        title: "No Image Captured!",
        text: "Please capture an image before confirming.",
      });
      return;
    }

    const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/user/checkin`;

    const formData = new FormData();
    formData.append("photo", dataURItoBlob(image));
    formData.append("userId", user?.userid);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "CHECK IN SUCCESS!",
          text: "ลงเวลาเข้างานสำเร็จ",
          timer: 2000,
          showConfirmButton: false,
        });
        closePopup();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: result.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("API Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Cannot connect to the server.",
      });
    }
  };

  const dataURItoBlob = (dataURI) => {
    let byteString = atob(dataURI.split(",")[1]);
    let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const checkOut = async () => {
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/user/checkout`;
    const payload = { userId: user?.userid };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "CHECK OUT SUCCESS!",
          text: "ลงเวลาออกงานสำเร็จ",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: result.message,
        });
      }
    } catch (error) {
      console.error("API Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Cannot connect to the server.",
      });
    }
  };

  // ปิดกล้อง
  const closePopup = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsOpen(false);
    setImage(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full">
      <span className="text-lg text-orange-400 font-semibold">
        GROUPMAKER WORKTIME REGISTER
      </span>
      <div className="flex mt-10 space-x-5 w-full">
        <button
          className="w-1/2 h-[10rem] rounded-3xl bg-green-600 text-white font-semibold active:scale-90 transition-transform duration-150"
          onClick={openCamera}
        >
          CHECK IN
        </button>

        <button
          className="w-1/2 h-[10rem] rounded-3xl bg-red-600 text-white font-semibold active:scale-90 transition-transform duration-150"
          onClick={checkOut}
        >
          CHECK OUT
        </button>
      </div>

      {isOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <h2 className="text-lg font-bold">CHECK IN</h2>
            <video
              ref={videoRef}
              autoPlay
              className="w-[300px] h-[200px] my-2"
            ></video>
            <canvas
              ref={canvasRef}
              width={300}
              height={200}
              className="hidden"
            ></canvas>
            {image && (
              <img
                src={image}
                alt="Captured"
                className="w-[300px] h-[200px] my-2"
              />
            )}
            <div className="flex space-x-3 mt-3">
              {!image && (
                <button
                  onClick={captureImage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md active:scale-90 transition-transform duration-150"
                >
                  Capture
                </button>
              )}
              {image && (
                <button
                  onClick={checkIn}
                  className="bg-green-500 text-white px-4 py-2 rounded-md active:scale-90 transition-transform duration-150"
                >
                  Confirm
                </button>
              )}
              <button
                onClick={closePopup}
                className="bg-gray-500 text-white px-4 py-2 rounded-md active:scale-90 transition-transform duration-150"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
