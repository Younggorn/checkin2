import { useState, useEffect } from "react";
import { ChevronDown, Calendar, Clock, TrendingUp, RefreshCw, User, MapPin } from "lucide-react";

export default function Report() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otData, setOtData] = useState([]);
  const [currentMonthOT, setCurrentMonthOT] = useState(0);

  // สร้างรายการเดือนสำหรับ dropdown
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    // สร้าง 12 เดือนย้อนหลัง
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthValue = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      const monthLabel = date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long"
      });
      months.push({ value: monthValue, label: monthLabel });
    }
    
    return months;
  };

  const monthOptions = generateMonthOptions();

  // ตั้งค่าเดือนปัจจุบันเป็น default
  useEffect(() => {
    if (monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0].value);
    }
  }, [monthOptions, selectedMonth]);

  // ดึงข้อมูล OT จาก API ใหม่
  const getOTData = async () => {
    if (!user?.user_id) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/getOTTime/${user.user_id}`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        }
      );

      if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        setCurrentMonthOT(0);
        return;
      }

      const result = await response.json();
      
      if (result && Array.isArray(result)) {
        setOtData(result);
        
        const currentMonthData = result.find(item => {
          if (!item.month_year) return false;
          
          const [month, year] = item.month_year.split('/');
          const apiMonth = `${month.padStart(2, '0')}-${parseInt(year) - 543}`;
          return apiMonth === selectedMonth;
        });
        
        setCurrentMonthOT(currentMonthData ? parseInt(currentMonthData.total_hours) || 0 : 0);
      } else {
        console.warn("Invalid API response format:", result);
        setCurrentMonthOT(0);
      }
    } catch (error) {
      console.error("Error fetching OT data:", error);
      setCurrentMonthOT(0);
    }
  };

  // ดึงข้อมูลการเข้างานทั้งหมด
  const getWorkData = async () => {
    
    setIsLoading(true);
    
    try {
      let apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/user/getOwntime?page=1&limit=300`;

      

      const response = await fetch(apiUrl, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });

    
      
      const result = await response.json();
     

      if (result.status === "success") {
      
        setData(result.data);

        if (result.data.length > 0 && !user) {
          const userData = {
            user_id: result.user_id || result.data[0].user_id,
            first_name: result.user?.first_name || result.data[0].user?.first_name || "ผู้ใช้",
            last_name: result.user?.last_name || result.data[0].user?.last_name || ""
          };
          
          setUser(userData);
        }
      } else {
        console.error('❌ API Error:', result);
      }
    } catch (error) {
      console.error("💥 Error fetching work data:", error);
    } finally {
      setIsLoading(false);
     
    }
  };

  // ฟังก์ชัน refresh ข้อมูล
  const refreshData = () => {
   
    setData([]);
    setUser(null);
    setSelectedDate(null);
    getWorkData();
  };

  useEffect(() => {
    getWorkData();
  }, []);

  useEffect(() => {
    if (user && selectedMonth) {
      getOTData();
    }
  }, [user, selectedMonth]);

  // กรองข้อมูลตามเดือนที่เลือก
  const filteredData = data.filter(entry => {
    if (!selectedMonth) return true;
    
    const [month, year] = selectedMonth.split('-');
    const entryDate = new Date(entry.date);
    const entryMonth = (entryDate.getMonth() + 1).toString().padStart(2, '0');
    const entryYear = entryDate.getFullYear().toString();
    
    return entryMonth === month && entryYear === year;
  });

  // สร้างปฏิทิน (แก้ไขการคำนวณ)
  const generateCalendar = () => {
    if (!selectedMonth) return [];



    const [month, year] = selectedMonth.split('-');
    const monthInt = parseInt(month) - 1; // 0-based month
    const yearInt = parseInt(year);
  
    
    const firstDay = new Date(yearInt, monthInt, 1);
    const lastDay = new Date(yearInt, monthInt + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendar = [];
    const current = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        // ใช้ local date แทน ISO string เพื่อหลีกเลี่ยงปัญหา timezone
        const currentYear = current.getFullYear();
        const currentMonth = (current.getMonth() + 1).toString().padStart(2, '0');
        const currentDay = current.getDate().toString().padStart(2, '0');
        const dateString = `${currentYear}-${currentMonth}-${currentDay}`;
        
        
        
        const dayData = filteredData.filter(entry => {
          const entryDate = entry.date.split('T')[0];
          const match = entryDate === dateString;
          if (match) {
           
          } else if (entryDate.includes(currentDay)) {
            
          }
          return match;
        });
        
        weekDays.push({
          date: new Date(current),
          dateString: dateString,
          dayNumber: current.getDate(),
          isCurrentMonth: current.getMonth() === monthInt,
          workData: dayData,
          totalTime: calculateDayTotalTime(dayData)
        });
        
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
      
      if (current > lastDay && week >= 4) break;
    }

   
    calendar.forEach((week, weekIndex) => {
      week.forEach((day) => {
        if (day.workData.length > 0) {
         
        }
      });
    });
    
    return calendar;
  };

  // คำนวณเวลารวมของวัน (แก้ไขให้แสดงข้อมูลแม้เวลาเป็น 0)
  const calculateDayTotalTime = (dayData) => {
    if (!dayData || dayData.length === 0) return null;
    
    let totalMinutes = 0;
    let hasAnyActivity = false;
    

    
    dayData.forEach(entry => {
      hasAnyActivity = true; // มีข้อมูลการเช็คอิน = มีกิจกรรม
      
      if (entry.time_difference && 
          entry.time_difference !== "Not Checked Out" && 
          entry.time_difference !== null) {
        
        const timeParts = entry.time_difference.split(":");
        if (timeParts.length === 2) {
          const hours = parseInt(timeParts[0]) || 0;
          const minutes = parseInt(timeParts[1]) || 0;
          
          // ตรวจสอบว่าเป็นค่าที่สมเหตุสมผล (ไม่ติดลบ)
          if (hours >= 0 && minutes >= 0 && hours < 24) {
            totalMinutes += hours * 60 + minutes;
           
          }
        }
      } else {
       
      }
    });
    
    // ⭐ สำคัญ: ถ้ามีกิจกรรมให้แสดงเสมอ ไม่ว่าเวลาจะเป็น 0 หรือไม่
    if (hasAnyActivity) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      
      const result = { 
        hours, 
        minutes: mins, 
        totalMinutes, 
        hasActivity: true,
        entryCount: dayData.length 
      };
      
 
      return result;
    }
    
    return null;
  };

  // สีตามจำนวนชั่วโมงทำงาน (แก้ไขให้รองรับกรณีมีกิจกรรมแต่เวลา 0)
  const getDayColor = (totalTime, workDataLength) => {
    if (!totalTime && workDataLength === 0) return "bg-gray-50";
    
    // ถ้ามีกิจกรรมแต่เวลาเป็น 0 หรือไม่มี totalTime
    if ((!totalTime || totalTime.totalMinutes === 0) && workDataLength > 0) {
      return "bg-blue-100 border-blue-300"; // สีน้ำเงินแสดงว่ามีกิจกรรม
    }
    
    if (totalTime && totalTime.totalMinutes > 0) {
      if (totalTime.totalMinutes >= 480) return "bg-green-100 border-green-300"; // 8+ ชั่วโมง
      if (totalTime.totalMinutes >= 240) return "bg-yellow-100 border-yellow-300"; // 4+ ชั่วโมง
      if (totalTime.totalMinutes >= 60) return "bg-orange-100 border-orange-300"; // 1+ ชั่วโมง
      return "bg-red-100 border-red-300"; // น้อยกว่า 1 ชั่วโมง
    }
    
    return "bg-gray-50";
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    });
  };

  const selectedMonthLabel = monthOptions.find(option => option.value === selectedMonth)?.label || "";
  const calendar = generateCalendar();
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  // ข้อมูลของวันที่เลือก (แก้ไขการ match วันที่)
  const selectedDayData = selectedDate ? filteredData.filter(entry => {
    const entryDate = entry.date.split('T')[0];
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const selectedDay = selectedDate.getDate().toString().padStart(2, '0');
    const selectedDateString = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    
   
    return entryDate === selectedDateString;
  }) : [];
  


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-1 flex items-center justify-center gap-2">
              <TrendingUp size={24} />
              รายงานเวลาทำงาน
            </h1>
            
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        

        {/* OT Summary Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock size={20} />
            สรุปชั่วโมง OT - {selectedMonthLabel}
          </h2>

          <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-600 font-medium mb-2">
              ชั่วโมง Overtime ทั้งเดือน
            </div>
            <div className="text-3xl font-bold text-orange-700">
              {currentMonthOT} ชั่วโมง
            </div>
            {otData.length === 0 && (
              <div className="text-xs text-gray-500 mt-2">
                ⚠️ ไม่สามารถโหลดข้อมูล OT ได้
              </div>
            )}
          </div>
        </div>

        {/* Month Filter Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h3
            className="text-lg font-semibold text-gray-700 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <span className="flex items-center gap-2">
              <Calendar size={20} />
              เลือกเดือน
            </span>
            <div className={`transform transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`}>
              <ChevronDown size={20} />
            </div>
          </h3>
          
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isFilterOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  เลือกเดือน/ปี
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setSelectedDate(null);
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            ปฏิทินการทำงาน - {selectedMonthLabel}
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2">กำลังโหลด...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {calendar.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      onClick={() => {
                        if (day.isCurrentMonth && day.workData.length > 0) {
                          
                          setSelectedDate(day.date);
                        } else {
                          
                        }
                      }}
                      className={`
                        relative aspect-square border rounded-lg p-1 cursor-pointer transition-all duration-200
                        ${day.isCurrentMonth ? 'hover:shadow-md' : 'opacity-40'}
                        ${day.isCurrentMonth ? getDayColor(day.totalTime, day.workData.length) : 'bg-gray-50'}
                        ${selectedDate && day.date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <div className="text-sm font-medium text-gray-700">
                        {day.dayNumber}
                      </div>
                      
                      {day.workData.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="text-xs text-center">
                           
                            
                            {day.totalTime && day.totalTime.totalMinutes > 0 ? (
                              <div className="font-medium text-gray-800">
                                {day.totalTime.hours}:{day.totalTime.minutes.toString().padStart(2, '0')}
                              </div>
                            ) : (
                              <div className="font-medium text-blue-600 text-xs">
                                มีกิจกรรม
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Day Details (แบบใหม่) */}
        {selectedDate && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Clock size={20} />
              รายละเอียดวันที่ {formatDate(selectedDate.toISOString().split('T'))}
            </h3>

            {selectedDayData.length > 0 ? (
              <div className="space-y-3">
                {selectedDayData.map((entry, index) => (
                  <div key={entry.checkin_id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700 flex items-center gap-2">
                        <Clock size={16} className="text-green-600" />
                        ครั้งที่ {index + 1}
                      </span>
                      
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                        <div className="text-xs text-green-600 font-medium mb-1">เวลาเข้า</div>
                        <div className="font-bold text-green-700">{formatTime(entry.checkin_time)}</div>
                      </div>
                      
                      <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                        <div className="text-xs text-red-600 font-medium mb-1">เวลาออก</div>
                        <div className="font-bold text-red-700">{formatTime(entry.checkout_time)}</div>
                      </div>
                      
                      <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs text-blue-600 font-medium mb-1">ระยะเวลา</div>
                        <div className="font-bold text-blue-700">{calculateWorkingHours(entry.time_difference)}</div>
                      </div>
                    </div>

                    
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-500">
                  ไม่พบข้อมูลสำหรับวันที่นี้
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Debug: Selected date = {selectedDate.toISOString().split('T')[0]}
                </div>
                <div className="text-sm text-gray-400">
                  Available dates: {filteredData.map(entry => entry.date.split('T')[0]).join(', ')}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              ปิด
            </button>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && filteredData.length === 0 && selectedMonth && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ไม่พบข้อมูลในเดือนนี้
            </h3>
            <p className="text-gray-500">
              ลองเลือกเดือนอื่นหรือตรวจสอบการเช็คอินของคุณ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}