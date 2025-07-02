import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Search, Filter, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const CalculateSalary = () => {
  const [otData, setOtData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/getAllOTRequestsTotal`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
        setOtData(result.data);
      } else if (Array.isArray(result)) {
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

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedEmployee, searchTerm]);

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

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

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
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationPages = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">สรุป OT รายเดือน</h1>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 sm:items-end">
            {/* Search Input */}
            <div className="flex-1 min-w-full sm:min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline w-4 h-4 mr-1" />
                ค้นหาพนักงาน
              </label>
              <input
                type="text"
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="ใส่ชื่อพนักงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Month Select */}
            <div className="min-w-full sm:min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                เลือกเดือน
              </label>
              <select
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">ทุกเดือน</option>
                {uniqueMonths.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Employee Select */}
            <div className="min-w-full sm:min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                เลือกพนักงาน
              </label>
              <select
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">ทุกคน</option>
                {uniqueEmployees.map(employee => (
                  <option key={employee} value={employee}>{employee}</option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            <button
              onClick={clearFilters}
              className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              <Filter className="inline w-4 h-4 mr-1" />
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-2 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">รายละเอียด OT</h2>
              <div className="text-xs sm:text-sm text-gray-500">
                แสดง {Math.min(startIndex + 1, filteredData.length)}-{Math.min(endIndex, filteredData.length)} จาก {filteredData.length} รายการ
              </div>
            </div>
          </div>
          
          {/* Horizontal scrollable table container */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="min-w-full">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      เดือน/ปี
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      ชื่อ
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      นามสกุล
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <Clock className="inline w-4 h-4 mr-1" />
                      ชั่วโมง OT
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr key={startIndex + index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-gray-900">{item.month_year}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {item.first_name}
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {item.last_name}
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 sm:px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${
                            parseInt(item.total_hours) > 20 
                              ? 'bg-red-100 text-red-800' 
                              : parseInt(item.total_hours) > 10 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            {item.total_hours} ชม.
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-2 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mb-3 sm:mb-4" />
                          <p className="text-base sm:text-lg font-medium mb-2">
                            {otData.length === 0 ? 'ไม่มีข้อมูล OT' : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'}
                          </p>
                          {otData.length === 0 && (
                            <div className="text-xs sm:text-sm text-gray-400 space-y-1 mb-3 sm:mb-4">
                              <p>กรุณาตรวจสอบ:</p>
                              <p>• การเชื่อมต่อ API</p>
                              <p>• การตั้งค่า VITE_API_URL</p>
                              <p>• สิทธิ์ในการเข้าถึงข้อมูล</p>
                            </div>
                          )}
                          <button
                            onClick={handleRefresh}
                            className="px-2 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
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

          {/* Pagination */}
          {filteredData.length > itemsPerPage && (
            <div className="px-2 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                {/* Page Info */}
                <div className="text-xs sm:text-sm text-gray-700">
                  หน้า {currentPage} จาก {totalPages} 
                  <span className="mx-1">•</span>
                  รวม {filteredData.length} รายการ
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-1 sm:p-2 rounded-md text-xs sm:text-sm ${
                      currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>

                  {/* First page if not visible */}
                  {getPaginationPages()[0] > 1 && (
                    <>
                      <button
                        onClick={() => goToPage(1)}
                        className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md"
                      >
                        1
                      </button>
                      {getPaginationPages()[0] > 2 && (
                        <span className="px-1 text-gray-400">...</span>
                      )}
                    </>
                  )}

                  {/* Page Numbers */}
                  {getPaginationPages().map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md ${
                        page === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Last page if not visible */}
                  {getPaginationPages()[getPaginationPages().length - 1] < totalPages && (
                    <>
                      {getPaginationPages()[getPaginationPages().length - 1] < totalPages - 1 && (
                        <span className="px-1 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => goToPage(totalPages)}
                        className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  {/* Next Button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-1 sm:p-2 rounded-md text-xs sm:text-sm ${
                      currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 px-2">
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