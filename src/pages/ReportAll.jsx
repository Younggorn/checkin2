import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function ReportAll() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/Admin/getuser`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.status === "success") {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const getUserData = async () => {
    if (!selectedUserId) return;
    
    setIsLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/user/getUserCheckingData`;

      const response = await axios.post(
        apiUrl,
        {
          user_id: selectedUserId,
          page,
          limit,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      getUserData();
    }
  }, [selectedUserId, page]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === "Not Checked Out") return "ยังไม่ออก";
    
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateWorkingHours = (timeDiff) => {
    if (!timeDiff || timeDiff === "Not Checked Out") return "ยังไม่ออก";
    
    const [hours, minutes] = timeDiff.split(':');
    return `${hours}ชม ${minutes}นาที`;
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.user_id === selectedUserId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 text-center">
            📊 รายงานเวลาทำงาน
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Employee Selection Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            👥 เลือกพนักงาน
          </h2>
          
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              setData([]);
              setPage(1);
            }}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- เลือกพนักงาน --</option>
            {employees.map((emp) => (
              <option key={emp.user_id} value={emp.user_id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>

          {selectedUserId && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">
                <span className="font-medium">พนักงานที่เลือก:</span> {getSelectedEmployee()?.first_name} {getSelectedEmployee()?.last_name}
              </div>
            </div>
          )}
        </div>

        {/* Date Filter Card */}
        {selectedUserId && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              📅 ช่วงวันที่
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={getUserData}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 active:scale-98'
                } text-white flex items-center justify-center`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    🔍 ค้นหาข้อมูล
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Data Cards */}
        {data.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 px-1">
              📋 ข้อมูลการเข้างาน ({data.length} รายการ)
            </h3>

            {data.map((entry) => (
              <div key={entry.checkin_id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Date Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center">
                      📅 {formatDate(entry.date)}
                    </h4>
                    <div className="text-sm opacity-90">
                      {entry.checkin_time && entry.checkout_time ? '✅ สมบูรณ์' : '⏳ ไม่สมบูรณ์'}
                    </div>
                  </div>
                </div>

                {/* Time Info */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-600 font-medium mb-1">เวลาเข้า</div>
                      <div className="text-lg font-bold text-green-700">
                        {formatTime(entry.checkin_time)}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xs text-red-600 font-medium mb-1">เวลาออก</div>
                      <div className="text-lg font-bold text-red-700">
                        {formatTime(entry.checkout_time)}
                      </div>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium mb-1">เวลาทำงาน</div>
                    <div className="text-lg font-bold text-blue-700">
                      {calculateWorkingHours(entry.time_difference)}
                    </div>
                  </div>

                  {/* Image */}
                  {entry.photo_url && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">รูปภาพเช็คอิน</div>
                      <button
                        onClick={() => openImageModal(`${import.meta.env.VITE_API_URL}/${entry.photo_url.replace(/\\/g, "/")}`)}
                        className="inline-block"
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL}/${entry.photo_url.replace(/\\/g, "/")}`}
                          alt="Check-in"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                        />
                      </button>
                      <div className="text-xs text-gray-500 mt-1">แตะเพื่อขยาย</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Data State */}
        {selectedUserId && !isLoading && data.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ไม่พบข้อมูล
            </h3>
            <p className="text-gray-500">
              ลองเปลี่ยนช่วงวันที่หรือเลือกพนักงานคนอื่น
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1 || isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  page === 1 || isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                }`}
              >
                ← ก่อนหน้า
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  หน้า {page} จาก {totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  page === totalPages || isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                }`}
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}

        {/* Welcome State */}
        {!selectedUserId && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ยินดีต้อนรับ
            </h3>
            <p className="text-gray-500">
              เริ่มต้นด้วยการเลือกพนักงานที่ต้องการดูรายงาน
            </p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white text-xl bg-black bg-opacity-50 w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Check-in Full Size"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}