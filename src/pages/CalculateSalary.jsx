import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';

const CalculateSalary = () => {
  const [otData, setOtData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
     
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/getAllOTRequestsTotal`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // เพิ่ม authorization header ถ้าจำเป็น
           'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

     

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      
      // ตรวจสอบ structure ของ response
      if (result && result.success && Array.isArray(result.data)) {
        
        setOtData(result.data);
      } else if (result && Array.isArray(result.data)) {
        // กรณีที่ไม่มี success field
      
        setOtData(result.data);
      } else if (Array.isArray(result)) {
        // กรณีที่ response เป็น array โดยตรง
       
        setOtData(result);
      } else {
        
        throw new Error('รูปแบบข้อมูลจาก API ไม่ถูกต้อง');
      }
      
    } catch (error) {
      
      setError(`เกิดข้อผิดพลาด: ${error.message}`);
      
      
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique months for filter
  const uniqueMonths = [...new Set(otData.map(item => item.month_year))].sort();
  
  // Get unique employees for filter
  const uniqueEmployees = [...new Set(otData.map(item => `${item.first_name} ${item.last_name}`))].sort();

  // Filter data based on selections
  const filteredData = otData.filter(item => {
    const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
    const matchesMonth = !selectedMonth || item.month_year === selectedMonth;
    const matchesEmployee = !selectedEmployee || `${item.first_name} ${item.last_name}` === selectedEmployee;
    const matchesSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase());
    
    return matchesMonth && matchesEmployee && matchesSearch;
  });

  // Group data by month for summary
  const monthlySummary = otData.reduce((acc, item) => {
    if (!acc[item.month_year]) {
      acc[item.month_year] = {
        totalHours: 0,
        employeeCount: 0,
        employees: []
      };
    }
    acc[item.month_year].totalHours += parseInt(item.total_hours) || 0;
    acc[item.month_year].employeeCount++;
    acc[item.month_year].employees.push({
      name: `${item.first_name} ${item.last_name}`,
      hours: parseInt(item.total_hours) || 0
    });
    return acc;
  }, {});

  const clearFilters = () => {
    setSelectedMonth('');
    setSelectedEmployee('');
    setSearchTerm('');
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล OT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">สรุป OT รายเดือน</h1>
             
            </div>
            
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline w-4 h-4 mr-1" />
                ค้นหาพนักงาน
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ใส่ชื่อพนักงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                เลือกเดือน
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">ทุกเดือน</option>
                {uniqueMonths.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div className="min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                เลือกพนักงาน
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">ทุกคน</option>
                {uniqueEmployees.map(employee => (
                  <option key={employee} value={employee}>{employee}</option>
                ))}
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <Filter className="inline w-4 h-4 mr-1" />
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">รายละเอียด OT</h2>
              <div className="text-sm text-gray-500">
                แสดง {filteredData.length} จาก {otData.length} รายการ
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เดือน/ปี
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    นามสกุล
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Clock className="inline w-4 h-4 mr-1" />
                    ชั่วโมง OT
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{item.month_year}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          parseInt(item.total_hours) > 20 
                            ? 'bg-red-100 text-red-800' 
                            : parseInt(item.total_hours) > 10 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {item.total_hours} ชม.
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium mb-2">
                          {otData.length === 0 ? 'ไม่มีข้อมูล OT' : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'}
                        </p>
                        {otData.length === 0 && (
                          <div className="text-sm text-gray-400 space-y-1">
                            <p>กรุณาตรวจสอบ:</p>
                            <p>• การเชื่อมต่อ API</p>
                            <p>• การตั้งค่า VITE_API_URL</p>
                            <p>• สิทธิ์ในการเข้าถึงข้อมูล</p>
                          </div>
                        )}
                        <button
                          onClick={handleRefresh}
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          โหลดข้อมูลใหม่
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          ข้อมูลอัพเดทล่าสุด: {new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default CalculateSalary;