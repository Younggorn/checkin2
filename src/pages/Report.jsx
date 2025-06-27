import { useState, useEffect , useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import CountUp from "react-countup";

export default function Report() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalWorkingHours, setTotalWorkingHours] = useState(0);

  // ดึงข้อมูลจาก API
  const getOwnData = async () => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      let apiUrl = `${
        import.meta.env.VITE_API_URL
      }/api/v1/user/getOwntime?page=${page}&limit=${limit}`;

      if (startDate) apiUrl += `&startDate=${startDate}`;
      if (endDate) apiUrl += `&endDate=${endDate}`;

      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data);
        setTotalPages(result.totalPages);

        // คำนวณชั่วโมงทำงานรวม
        const totalHours = result.data.reduce((total, entry) => {
          if (
            entry.time_difference &&
            entry.time_difference !== "Not Checked Out"
          ) {
            const [hours, minutes] = entry.time_difference.split(":");
            return total + parseInt(hours) + parseInt(minutes) / 60;
          }
          return total;
        }, 0);
        setTotalWorkingHours(totalHours);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    if (user) {
      getOwnData();
    }
  }, [user, page]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === "Not Checked Out") return "ยังไม่ออก";

    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateWorkingHours = (timeDiff) => {
    if (!timeDiff || timeDiff === "Not Checked Out") return "ยังไม่ออก";

    const [hours, minutes] = timeDiff.split(":");
    return `${hours}ชม ${minutes}นาที`;
  };

  const getWorkingStatus = (timeDiff) => {
    if (!timeDiff || timeDiff === "Not Checked Out")
      return { status: "incomplete", color: "gray" };

    const [hours] = timeDiff.split(":");
    const workHours = parseInt(hours);

    if (workHours >= 8) return { status: "complete", color: "green" };
    if (workHours >= 4) return { status: "partial", color: "yellow" };
    return { status: "short", color: "red" };
  };

  

  const countUpComponent = useMemo(() => {
    if (totalWorkingHours === 0) {
      return <span>0ชม 0นาที</span>;
    }
    
    return (
      <CountUp
        start={Math.round(totalWorkingHours *60 * 0.6)}
        end={Math.round(totalWorkingHours * 60)}
        duration={2}
        formattingFn={(totalMinutes) => {
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return `${hours}ชม ${minutes}นาที`;
        }}
      />
    );
  }, [totalWorkingHours]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-1">📊 รายงานเวลาทำงาน</h1>
            <p className="text-blue-100 text-sm">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        {data.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              📈 สรุปภาพรวม
            </h2>

            <div className="grid grid-cols-1 gap-5">
              <div className="text-center p-3 bg-green-50 rounded-lg ">
                <div className="text-xs text-green-600 font-medium mb-1">
                  ชั่วโมง Over Time
                </div>
                <div className="text-xl font-bold text-green-700">
                  {countUpComponent}
                  
                </div>
              </div>
            </div>
          </div>
        )}

         {/* Date Filter Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h3
            className="text-lg font-semibold text-gray-700 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span>🔍 เลือกช่วงเวลา</span>
            <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
              <ChevronDown size={20} />
            </div>
          </h3>
          
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <button
                onClick={getOwnData}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  isLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98]"
                } text-white flex items-center justify-center`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังโหลด...
                  </>
                ) : (
                  <>🔍 ค้นหาข้อมูล</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Data Cards */}
        {data.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 px-1">
              📋 ประวัติการเข้างาน
            </h3>

            {data.map((entry) => {
              const workingStatus = getWorkingStatus(entry.time_difference);

              return (
                <div
                  key={entry.checkin_id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center">
                        📅 {formatDate(entry.date)}
                      </h4>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-green-600 font-medium mb-1">
                          เวลาเข้า
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          {formatTime(entry.checkin_time)}
                        </div>
                      </div>

                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-xs text-red-600 font-medium mb-1">
                          เวลาออก
                        </div>
                        <div className="text-lg font-bold text-red-700">
                          {formatTime(entry.checkout_time)}
                        </div>
                      </div>
                    </div>

                    {/* Working Hours */}
                    <div
                      className={`text-center p-4 rounded-lg ${
                        workingStatus.color === "green"
                          ? "bg-green-50"
                          : workingStatus.color === "yellow"
                          ? "bg-yellow-50"
                          : workingStatus.color === "red"
                          ? "bg-red-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <div
                        className={`text-xs font-medium mb-1 ${
                          workingStatus.color === "green"
                            ? "text-green-600"
                            : workingStatus.color === "yellow"
                            ? "text-yellow-600"
                            : workingStatus.color === "red"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        ⏱️ เวลาทำงาน
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          workingStatus.color === "green"
                            ? "text-green-700"
                            : workingStatus.color === "yellow"
                            ? "text-yellow-700"
                            : workingStatus.color === "red"
                            ? "text-red-700"
                            : "text-gray-700"
                        }`}
                      >
                        {calculateWorkingHours(entry.time_difference)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Data State */}
        {!isLoading && data.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ไม่พบข้อมูล
            </h3>
            <p className="text-gray-500">
              ลองเปลี่ยนช่วงวันที่หรือตรวจสอบการเช็คอินของคุณ
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
                className={`px-4 py-2 rounded-lg font-medium  ${
                  page === 1 || isLoading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
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
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages || isLoading}
                className={`px-4 py-2 rounded-lg font-medium ${
                  page === totalPages || isLoading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                }`}
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
