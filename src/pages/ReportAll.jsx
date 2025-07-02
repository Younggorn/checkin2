import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Calendar, Clock, TrendingUp, User, Image } from "lucide-react";

export default function ReportAll() {
 
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [data, setData] = useState([]);
  const [allEmployeesData, setAllEmployeesData] = useState([]); // เก็บข้อมูลของทุกคน
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // สร้างรายการเดือนสำหรับ dropdown
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
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

  // ดึงรายชื่อพนักงาน
  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/Admin/getuser`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const result = await response.json();
      if (result.status === "success") {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // ดึงข้อมูลการเข้างานของพนักงานคนเดียว
  const getUserData = async (userId) => {
    if (!userId || !selectedMonth) return null;

    try {
      const [month, year] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/user/getUserCheckingData`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            page: 1,
            limit: 100,
            startDate,
            endDate,
          }),
        }
      );

      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching user data:", error);
      return [];
    }
  };

  // ดึงข้อมูลของทุกคน
  const getAllEmployeesData = async () => {
    if (!selectedMonth || employees.length === 0) return;

    setIsLoading(true);
    
    try {
      // ดึงข้อมูลของทุกคนแบบ parallel
      const promises = employees.map(async (employee) => {
        const userData = await getUserData(employee.user_id);
        return {
          employee: employee,
          data: userData || []
        };
      });

      const results = await Promise.all(promises);
      setAllEmployeesData(results);
      
      // รวมข้อมูลของทุกคนเป็น array เดียว พร้อมข้อมูลพนักงาน
      const combinedData = results.flatMap(result => 
        result.data.map(entry => ({
          ...entry,
          employee_name: `${result.employee.first_name} ${result.employee.last_name}`,
          employee_id: result.employee.user_id
        }))
      );
      setData(combinedData);
      
    } catch (error) {
      console.error("Error fetching all employees data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมūลของพนักงานคนเดียว
  const getSingleUserData = async () => {
    if (!selectedUserId || !selectedMonth) return;

    setIsLoading(true);
    
    try {
      const userData = await getUserData(selectedUserId);
      setData(userData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      if (selectedUserId === "all") {
        getAllEmployeesData();
      } else if (selectedUserId) {
        getSingleUserData();
      }
    }
  }, [selectedUserId, selectedMonth, employees]);

  // สร้างปฏิทินสำหรับคนเดียว
  const generateSingleCalendar = (employeeData = null) => {
    if (!selectedMonth) return [];

    const [month, year] = selectedMonth.split('-');
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendar = [];
    const current = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dateString = current.toISOString().split('T')[0];
        const dayData = employeeData 
          ? employeeData.filter(entry => entry.date.split('T')[0] === dateString)
          : data.filter(entry => entry.date.split('T')[0] === dateString);
        
        weekDays.push({
          date: new Date(current),
          dateString: dateString,
          dayNumber: current.getDate(),
          isCurrentMonth: current.getMonth() === parseInt(month) - 1,
          workData: dayData,
          totalTime: calculateDayTotalTime(dayData)
        });
        
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
      
      if (current > lastDay && week >= 4) break;
    }

    return calendar;
  };

  // สร้างปฏิทินสำหรับทุกคน
  const generateAllCalendars = () => {
    if (!allEmployeesData || allEmployeesData.length === 0) return [];
    
    return allEmployeesData.map(employeeInfo => ({
      employee: employeeInfo.employee,
      calendar: generateSingleCalendar(employeeInfo.data)
    }));
  };

  // คำนวณเวลารวมของวัน (ปรับสำหรับคนเดียว)
  const calculateDayTotalTime = (dayData) => {
    if (!dayData || dayData.length === 0) return null;
    
    let totalMinutes = 0;
    
    dayData.forEach(entry => {
      if (entry.time_difference && entry.time_difference !== "Not Checked Out") {
        const [hours, minutes] = entry.time_difference.split(":");
        totalMinutes += parseInt(hours) * 60 + parseInt(minutes);
      }
    });
    
    if (totalMinutes === 0) return null;
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return { hours, minutes: mins, totalMinutes };
  };

  // สีตามจำนวณชั่วโมงทำงาน
  const getDayColor = (totalTime) => {
    if (!totalTime) return "bg-gray-50";
    
    if (totalTime.totalMinutes >= 480) return "bg-green-100 border-green-300";
    if (totalTime.totalMinutes >= 240) return "bg-yellow-100 border-yellow-300";
    if (totalTime.totalMinutes >= 60) return "bg-orange-100 border-orange-300";
    return "bg-red-100 border-red-300";
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

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.user_id === selectedUserId);
  };

  const selectedMonthLabel = monthOptions.find(option => option.value === selectedMonth)?.label || "";
  const calendar = selectedUserId !== "all" ? generateSingleCalendar() : [];
  const allCalendars = selectedUserId === "all" ? generateAllCalendars() : [];
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  // ข้อมูลของวันที่เลือก
  const selectedDayData = selectedDate ? data.filter(entry => 
    entry.date.split('T')[0] === selectedDate.toISOString().split('T')[0]
  ) : [];

  // สถิติรวมสำหรับทุกคน
  const getAllEmployeesStats = () => {
    if (selectedUserId !== "all" || allEmployeesData.length === 0) return null;
    
    const stats = {
      totalEmployees: allEmployeesData.length,
      activeEmployees: allEmployeesData.filter(emp => emp.data.length > 0).length,
      totalWorkingDays: data.length,
      totalWorkingHours: 0
    };
    
    data.forEach(entry => {
      if (entry.time_difference && entry.time_difference !== "Not Checked Out") {
        const [hours, minutes] = entry.time_difference.split(":");
        stats.totalWorkingHours += parseInt(hours) + parseInt(minutes) / 60;
      }
    });
    
    return stats;
  };

  const allStats = getAllEmployeesStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-1 flex items-center justify-center gap-2">
              <TrendingUp size={24} />
              รายงานเวลาทำงาน (Admin)
            </h1>
           
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Employee Selection Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <User size={20} />
            เลือกพนักงาน
          </h2>
          
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              setSelectedEmployee(getSelectedEmployee());
              setData([]);
              setAllEmployeesData([]);
              setSelectedDate(null);
            }}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">-- เลือกพนักงาน --</option>
            <option value="all" className="font-bold text-purple-600">🏢 ทุกคน (รายงานรวม)</option>
            {employees.map((emp) => (
              <option key={emp.user_id} value={emp.user_id}>
                👤 {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
        </div>

        

        {/* Month Filter Card */}
        {selectedUserId && (
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
        )}

        {/* Calendar - Single Employee */}
        {selectedUserId && selectedUserId !== "all" && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              ปฏิทินการทำงาน - {selectedMonthLabel}
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
                        onClick={() => day.isCurrentMonth && day.workData.length > 0 ? setSelectedDate(day.date) : null}
                        className={`
                          relative aspect-square border rounded-lg p-1 cursor-pointer transition-all duration-200
                          ${day.isCurrentMonth ? 'hover:shadow-md' : 'opacity-40'}
                          ${day.isCurrentMonth && day.workData.length > 0 ? getDayColor(day.totalTime) : 'bg-gray-50'}
                          ${selectedDate && day.date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-purple-500' : ''}
                        `}
                      >
                        <div className="text-sm font-medium text-gray-700">
                          {day.dayNumber}
                        </div>
                        
                        {day.workData.length > 0 && day.totalTime && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="text-xs text-center">
                              <div className="font-medium text-gray-800">
                                {day.totalTime.hours}:{day.totalTime.minutes.toString().padStart(2, '0')}
                              </div>
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
        )}

        {/* Calendars for All Employees */}
        {selectedUserId === "all" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                ปฏิทินการทำงานของทุกคน - {selectedMonthLabel}
              </h3>
              
              {/* คำอธิบายสี */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">คำอธิบายสี:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>8+ ชั่วโมง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                    <span>4-8 ชั่วโมง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                    <span>1-4 ชั่วโมง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span>น้อยกว่า 1 ชั่วโมง</span>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">กำลังโหลด...</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {allCalendars.map((employeeCalendar, empIndex) => (
                    <div key={employeeCalendar.employee.user_id} className="border border-gray-200 rounded-lg p-4">
                      {/* Employee Header */}
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                          <User size={18} />
                          {employeeCalendar.employee.first_name} {employeeCalendar.employee.last_name}
                        </h4>
                        
                      </div>

                      {/* Calendar for this employee */}
                      <div className="space-y-2">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {dayNames.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                              {day.substring(0, 3)}
                            </div>
                          ))}
                        </div>

                        {/* Calendar grid */}
                        {employeeCalendar.calendar.map((week, weekIndex) => (
                          <div key={weekIndex} className="grid grid-cols-7 gap-1">
                            {week.map((day, dayIndex) => (
                              <div
                                key={dayIndex}
                                onClick={() => day.isCurrentMonth && day.workData.length > 0 ? setSelectedDate(day.date) : null}
                                className={`
                                  relative aspect-square border rounded-lg p-1 cursor-pointer transition-all duration-200
                                  ${day.isCurrentMonth ? 'hover:shadow-md' : 'opacity-40'}
                                  ${day.isCurrentMonth && day.workData.length > 0 ? getDayColor(day.totalTime) : 'bg-gray-50'}
                                  ${selectedDate && day.date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-purple-500' : ''}
                                `}
                              >
                                <div className="text-xs font-medium text-gray-700">
                                  {day.dayNumber}
                                </div>
                                
                                {day.workData.length > 0 && day.totalTime && (
                                  <div className="absolute bottom-1 left-1 right-1">
                                    <div className="text-[10px] text-center">
                                      <div className="font-medium text-gray-800">
                                        {day.totalTime.hours}:{day.totalTime.minutes.toString().padStart(2, '0')}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Day Details */}
        {selectedDate && selectedDayData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Clock size={20} />
              รายละเอียดวันที่ {selectedDate.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long"
              })}
              {selectedUserId === "all" && (
                <span className="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full ml-2">
                  {selectedDayData.length} รายการ
                </span>
              )}
            </h3>

            <div className="space-y-3">
              {selectedDayData.map((entry, index) => (
                <div key={`${entry.checkin_id}-${entry.employee_id || ''}`} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {selectedUserId === "all" && (
                        <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          {entry.employee_name}
                        </span>
                      )}
                      {selectedUserId !== "all" && (
                        <span className="font-medium text-gray-700">ครั้งที่ {index + 1}</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTime(entry.checkin_time)} - {formatTime(entry.checkout_time)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-xs text-green-600 font-medium mb-1">เวลาเข้า</div>
                      <div className="font-bold text-green-700">{formatTime(entry.checkin_time)}</div>
                    </div>
                    
                    <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                      <div className="text-xs text-red-600 font-medium mb-1">เวลาออก</div>
                      <div className="font-bold text-red-700">{formatTime(entry.checkout_time)}</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-blue-50 rounded border border-blue-200 mb-3">
                    <div className="text-xs text-blue-600 font-medium mb-1">ระยะเวลา</div>
                    <div className="font-bold text-blue-700">{calculateWorkingHours(entry.time_difference)}</div>
                  </div>

                  {/* Photo */}
                  {(entry.photo_url || entry.photo_url_out) && (
  <div className="flex justify-center items-start gap-6">
    {/* เช็คอิน */}
    {entry.photo_url && (
      <div className="text-center">
        <div className="text-xs text-gray-600 mb-2 flex items-center justify-center gap-1">
          <Image size={12} />
          รูปภาพเช็คอิน
        </div>
        <button
          onClick={() =>
            openImageModal(
              `${import.meta.env.VITE_API_URL}/${entry.photo_url.replace(/\\/g, "/")}`
            )
          }
          className="inline-block hover:scale-105 transition-transform"
        >
          <img
            src={`${import.meta.env.VITE_API_URL}/${entry.photo_url.replace(/\\/g, "/")}`}
            alt="เช็คอิน"
            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </button>
        <div className="text-xs text-gray-500 mt-1">แตะเพื่อขยาย</div>
      </div>
    )}

    {/* เช็คเอ้า */}
    {entry.photo_url_out && (
      <div className="text-center">
        <div className="text-xs text-gray-600 mb-2 flex items-center justify-center gap-1">
          <Image size={12} />
          รูปภาพเช็คเอ้า
        </div>
        <button
          onClick={() =>
            openImageModal(
              `${import.meta.env.VITE_API_URL}/${entry.photo_url_out.replace(/\\/g, "/")}`
            )
          }
          className="inline-block hover:scale-105 transition-transform"
        >
          <img
            src={`${import.meta.env.VITE_API_URL}/${entry.photo_url_out.replace(/\\/g, "/")}`}
            alt="เช็คเอ้า"
            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </button>
        <div className="text-xs text-gray-500 mt-1">แตะเพื่อขยาย</div>
      </div>
    )}
  </div>
)}

                  
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              ปิด
            </button>
          </div>
        )}

        {/* No Data State */}
        {selectedUserId && !isLoading && data.length === 0 && selectedMonth && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ไม่พบข้อมูลในเดือนนี้
            </h3>
            <p className="text-gray-500">
              {selectedUserId === "all" 
                ? "ไม่มีพนักงานคนไหนมีข้อมูลการเช็คอินในเดือนที่เลือก"
                : "พนักงานคนนี้ไม่มีข้อมูลการเช็คอินในเดือนที่เลือก"
              }
            </p>
          </div>
        )}

        {/* Welcome State */}
        {!selectedUserId && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ยินดีต้อนรับสู่หน้า Admin
            </h3>
            <p className="text-gray-500">
              เริ่มต้นด้วยการเลือกพนักงานที่ต้องการดูรายงาน หรือเลือก "ทุกคน" เพื่อดูรายงานรวม
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