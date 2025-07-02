import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
//import { checkin } from "../../../worktime-server/controllers/System/system.controller";

export default function Home() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isInOffice, setIsInOffice] = useState(false);
  const [distance, setDistance] = useState(null);
  const [address, setAddress] = useState("");
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkinStatus, setCheckinStatus] = useState({
    checkedIn: false,
    checkedOut: false,
    checkin_time: null,
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [workTime, setWorkTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [checkinTime, setCheckinTime] = useState(null);
  const [cameraMode, setCameraMode] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const token = localStorage.getItem("token");

  // Office coordinates
  const officeLocation = {
    lat: 13.77652,
    lng: 100.7542,
    name: "GROUP MAKER",
    radius: 500,
  };

  // คำนวณเวลาทำงาน
  const calculateWorkTime = (checkinTime) => {
    if (!checkinTime) return { hours: 0, minutes: 0, seconds: 0 };

    const now = new Date();
    const checkin = new Date(checkinTime);

    if (isNaN(checkin.getTime())) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const diffMs = now - checkin;
    if (diffMs < 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  // ฟังก์ชันดึงเวลา checkin จาก API ใหม่
  const fetchCheckinTime = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/checkin-time`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Fetched checkin time:", result.data);

        if (result.data.checkin_time && !result.data.checkout_time) {
          // มี checkin_time และยัง checkout ไม่ได้
          setCheckinTime(result.data.checkin_time);
          return result.data.checkin_time;
        } else {
          // ไม่มี checkin_time หรือ checkout แล้ว
          setCheckinTime(null);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching checkin time:", error);
      return null;
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      // อัพเดทเวลาทำงานทุกวินาที ถ้า checkin แล้ว
      if (checkinTime) {
        const workTimeCalc = calculateWorkTime(checkinTime);
        setWorkTime(workTimeCalc);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [checkinTime]);

  // ฟังก์ชันดึงสถานะ checkin จาก API
  const fetchCheckinStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const status = await response.json();
        setCheckinStatus(status);

        // ถ้า checkin แล้วแต่ยัง checkout ไม่ได้ ให้ดึงเวลา checkin จาก API ใหม่
        if (status.checkedIn && !status.checkedOut) {
          const timeFromAPI = await fetchCheckinTime();
          if (timeFromAPI) {
            setCheckinTime(timeFromAPI);
            // คำนวณเวลาทำงานทันที
          }
        } else {
          setCheckinTime(null);
          setWorkTime({ hours: 0, minutes: 0, seconds: 0 });
        }
      } else {
        console.error("Failed to fetch checkin status");
      }
    } catch (error) {
      console.error("Error fetching checkin status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // เรียก API เมื่อ component โหลด
  useEffect(() => {
    fetchCheckinStatus();
  }, []);

  // คำนวณสถานะปุ่ม
  const getButtonStatus = () => {
    if (isLoadingStatus) {
      return { type: "loading", text: "กำลังโหลด...", disabled: true };
    }

    // ถ้ายังไม่ checkin หรือ checkout แล้ว = แสดงปุ่ม CHECK IN
    if (!checkinStatus.checkedIn || checkinStatus.checkedOut) {
      return {
        type: "checkin",
        text: "CHECK IN",
        disabled: !isInOffice,
        icon: "👉",
      };
    }

    // ถ้า checkin แล้วแต่ยัง checkout ไม่ได้ = แสดงปุ่ม CHECK OUT พร้อมเวลาทำงาน
    if (checkinStatus.checkedIn && !checkinStatus.checkedOut) {
      return {
        type: "checkout",
        text: "CHECK OUT",
        workTime: `${workTime.hours
          .toString()
          .padStart(2, "0")}:${workTime.minutes
          .toString()
          .padStart(2, "0")}:${workTime.seconds.toString().padStart(2, "0")}`,
        disabled: !isInOffice,
        icon: "👋",
      };
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Get current GPS location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          const dist = calculateDistance(
            location.lat,
            location.lng,
            officeLocation.lat,
            officeLocation.lng
          );

          setCurrentLocation(location);
          setDistance(Math.round(dist));

          const inOffice = dist <= officeLocation.radius;
          setIsInOffice(inOffice);

          try {
            await getAddressFromCoords(location.lat, location.lng);
          } catch (error) {
            console.error("Address fetch failed:", error);
          }

          resolve({ location, isInOffice: inOffice, distance: dist });
        },
        (error) => {
          console.error("GPS Error:", error);
          let errorMessage = "ไม่สามารถเข้าถึง GPS ได้";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "กรุณาอนุญาตการใช้งาน GPS ในเบราว์เซอร์";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "ไม่สามารถระบุตำแหน่งได้";
              break;
            case error.TIMEOUT:
              errorMessage = "การค้นหาตำแหน่งใช้เวลานานเกินไป";
              break;
          }

          Swal.fire({
            icon: "error",
            title: "GPS Error",
            text: errorMessage,
          });
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000,
        }
      );
    });
  };

  // Get address from coordinates
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`
      );

      if (!response.ok) throw new Error("Address API failed");

      const data = await response.json();

      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const openCamera = async (mode = "checkin") => {
    setIsCheckingLocation(true);
    setCameraMode(mode);

    try {
      const locationResult = await getCurrentLocation();

      if (mode === "checkin" && !locationResult.isInOffice) {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถเช็คอินได้",
          text: `คุณอยู่ห่างจากบริษัท ${Math.round(
            locationResult.distance
          )} เมตร\nต้องอยู่ในรัศมี ${officeLocation.radius} เมตรเท่านั้น`,
        });
        setIsCheckingLocation(false);
        return;
      }

      setIsOpen(true);
      setIsCheckingLocation(false);

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
    } catch (err) {
      console.error("Error:", err);
      setIsCheckingLocation(false);
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const newWidth = 640;
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

    if (!isInOffice) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเช็คอินได้",
        text: "คุณต้องอยู่ในบริเวณบริษัทเพื่อเช็คอิน",
      });
      return;
    }

    const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/user/checkin`;
    const formData = new FormData();

    formData.append("photo", dataURItoBlob(image));
  


    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

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

        // รีเฟรชสถานะหลังจาก checkin สำเร็จ
        await fetchCheckinStatus();
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
    const formData = new FormData();

    formData.append("checkout_photo", dataURItoBlob(image));
    

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
          title: "CHECK OUT SUCCESS!",
          text: `ลงเวลาออกงานสำเร็จ`,
          timer: 3000,
          showConfirmButton: false,
        });

        // รีเซ็ตเวลา
        setCheckinTime(null);
        setWorkTime({ hours: 0, minutes: 0, seconds: 0 });

        // รีเฟรชสถานะหลังจาก checkout สำเร็จ
        await fetchCheckinStatus();
        closePopup();
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

  const closePopup = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsOpen(false);
    setImage(null);
    setCameraMode(null);
  };

  useEffect(() => {
    getCurrentLocation().catch(console.error);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const buttonStatus = getButtonStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="px-6 py-4">
          <div className="text-center">
            <h1 className="text-lg font-bold text-orange-500 mb-1">
              GROUP MAKER WORKTIME
            </h1>
            <p className="text-sm text-gray-600">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Time Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {formatTime(currentTime)}
            </h2>
            <p className="text-sm text-gray-600">{formatDate(currentTime)}</p>

            {/* Display work time if checked in */}
            {checkinStatus.checkedIn &&
              !checkinStatus.checkedOut &&
              checkinTime && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">
                    คุณทำงานมาแล้ว
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {workTime.hours.toString().padStart(2, "0")}:
                    {workTime.minutes.toString().padStart(2, "0")}:
                    {workTime.seconds.toString().padStart(2, "0")}
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Location Status Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              📍 สถานะตำแหน่ง
            </h3>

            {currentLocation ? (
              <div className="space-y-3">
                <div
                  className={`flex items-center justify-center p-4 rounded-xl ${
                    isInOffice
                      ? "bg-green-50 border-2 border-green-200"
                      : "bg-red-50 border-2 border-red-200"
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`text-3xl mb-2 ${
                        isInOffice ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isInOffice ? "✅" : "❌"}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        isInOffice ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {isInOffice ? "อยู่ในบริษัท" : "อยู่นอกบริษัท"}
                    </div>
                    <div
                      className={`text-sm ${
                        isInOffice ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ระยะทาง {distance} เมตร
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-gray-600">กำลังค้นหาตำแหน่ง...</div>
                <div className="text-sm text-gray-500 mt-1">
                  กรุณาอนุญาตการใช้งาน GPS
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            className={`w-full h-24 rounded-2xl font-bold text-xl transition-all duration-300 transform ${
              isCheckingLocation || buttonStatus?.disabled
                ? "bg-gray-400 cursor-not-allowed scale-95"
                : buttonStatus?.type === "checkout"
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            } text-white`}
            onClick={
              buttonStatus?.type === "checkout"
                ? () => openCamera("checkout")
                : buttonStatus?.type === "checkin"
                ? () => openCamera("checkin")
                : undefined
            }
            disabled={isCheckingLocation || buttonStatus?.disabled}
          >
            {isCheckingLocation ? (
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-base">ตรวจสอบตำแหน่ง...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="text-3xl mr-3">
                  {buttonStatus?.icon || "⏳"}
                </span>
                <div className="flex flex-col">
                  <span>{buttonStatus?.text || "กำลังโหลด..."}</span>

                  {buttonStatus?.type === "checkin" && !isInOffice && (
                    <span className="text-sm font-normal opacity-75">
                      ต้องอยู่ในบริษัทก่อน
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
          <Link
            to="/OT"
            className="w-full h-24 rounded-2xl font-bold text-xl bg-amber-300
                 inline-flex items-center justify-center
                 text-black no-underline
                 hover:bg-amber-400 active:bg-amber-500
                 transition-colors duration-200"
            style={{
              // เพิ่ม style เพื่อให้เหมือน button
              border: "none",
              outline: "none",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            📝 ส่งเรื่อง OT
          </Link>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-blue-600 text-sm">
            💡 <strong>คำแนะนำ:</strong> ต้องอยู่ในรัศมี {officeLocation.radius}{" "}
            เมตร จากบริษัทเพื่อเช็คอิน <br />
            สำหรับคนออกหน้างานมาเช็คอินที่บริษัทไม่ได้ <br />{" "}
            <Link to="/checkinOutsize" className="text-red-500 ">
              คลิ๊กที่นี้{" "}
            </Link>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  {cameraMode === "checkout" ? "👋 CHECK OUT" : "👉 CHECK IN"}
                </h2>
                <button
                  onClick={closePopup}
                  className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4">
              <div
                className={`w-full p-3 rounded-lg mb-4 text-center ${
                  cameraMode === "checkin"
                    ? isInOffice
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">
                    {cameraMode === "checkout"
                      ? "👋"
                      : isInOffice
                      ? "✅"
                      : "❌"}
                  </span>
                  <span className="font-medium">
                    {cameraMode === "checkout"
                      ? "กำลังเลิกงาน"
                      : isInOffice
                      ? "อยู่ในบริษัท"
                      : "อยู่นอกบริษัท"}
                  </span>
                  <span className="text-sm opacity-75">({distance}m)</span>
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {formatTime(currentTime)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-56 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {image && (
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={image}
                      alt="Captured"
                      className="w-full h-56 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      ✅ ถ่ายแล้ว
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {!image ? (
                    <button
                      onClick={captureImage}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center"
                    >
                      <span className="mr-2">📷</span>
                      ถ่ายภาพ
                    </button>
                  ) : (
                    <button
                      onClick={cameraMode === "checkout" ? checkOut : checkIn}
                      disabled={cameraMode === "checkin" && !isInOffice}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center ${
                        cameraMode === "checkin" && !isInOffice
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : cameraMode === "checkout"
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      <span className="mr-2">
                        {cameraMode === "checkout" ? "👋" : "✅"}
                      </span>
                      {cameraMode === "checkout"
                        ? "ยืนยันเลิกงาน"
                        : "ยืนยันเช็คอิน"}
                    </button>
                  )}

                  <button
                    onClick={closePopup}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all active:scale-95"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
