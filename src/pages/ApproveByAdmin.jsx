import React, { useState, useEffect } from 'react';
import { Check, X, Clock, User, Calendar, MessageCircle, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';

const ApproveByAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState(1); // 1=รออนุมัติ, 3=อนุมัติแล้ว, 4=ไม่อนุมัติ
  const [rejectedReasons, setRejectedReasons] = useState({}); // เก็บเหตุผลที่ไม่อนุมัติ
  const [rejectDetails, setRejectDetails] = useState({}); // เก็บรายละเอียดการไม่อนุมัติ

  // Configuration
  const token = localStorage.getItem('token');

  // สถานะและสีที่ใช้แสดงผล
  const statusConfig = {
    1: { text: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    3: { text: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800', icon: '✅' },
    4: { text: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800', icon: '❌' },
    2: { text: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800', icon: '❌' },
    0: { text: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800', icon: '❌' }
  };

  // ดึงข้อมูลเหตุผลและผู้ไม่อนุมัติ
  const fetchRejectDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/getRejectOTbyadmin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          const detailsMap = {};
          result.forEach(item => {
            detailsMap[item.ot_id] = {
              reason_reject: item.reason_reject,
              approve_admin: item.approve_admin
            };
          });
          setRejectDetails(detailsMap);
          
          // อัปเดต rejectedReasons เพื่อให้ backward compatible
          const reasonsMap = {};
          result.forEach(item => {
            reasonsMap[item.ot_id] = item.reason_reject;
          });
          setRejectedReasons(reasonsMap);
        }
      }
    } catch (error) {
      console.error("Error fetching reject details:", error);
    }
  };

  // ดึงเหตุผลที่ไม่อนุมัติ (เก่า - เก็บไว้เพื่อ backup)
  const fetchRejectedReasons = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/getOTStatus2`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const reasonsMap = {};
          result.data.forEach(item => {
            reasonsMap[item.ot_id] = item.reason_reject;
          });
          setRejectedReasons(reasonsMap);
        }
      }
    } catch (error) {
      console.error("Error fetching rejected reasons:", error);
    }
  };

  // ฟังก์ชันหาชื่อพนักงานจาก user_id
  const getEmployeeName = (userId) => {
    if (!userId) return 'ไม่ระบุ';
    const employee = employees.find(emp => emp.user_id === userId);
    return employee ? `${employee.first_name} ${employee.last_name}` : userId;
  };

  // Fetch data from API
  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchOTStatus();
      fetchRejectDetails(); // ใช้ API ใหม่
      fetchRejectedReasons(); // เก็บไว้เป็น backup
    }
  }, [selectedUserId]);

  // ดึงข้อมูลพนักงานทั้งหมด
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/getuser`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.status === "success") {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOTStatus = async () => {
    if (!selectedUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/getOTStatus1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // กรองข้อมูลตาม user_id ที่เลือก
        let filteredRequests = result.data;
        
        if (selectedUserId !== "all") {
          filteredRequests = result.data.filter(request => {
            const possibleUserIds = [
              request.user_id,
              request.employee_id, 
              request.created_by,
              request.requester_id,
              request.emp_id
            ];
            
            return possibleUserIds.includes(selectedUserId);
          });
        }
        
        setRequests(filteredRequests);
        
        if (filteredRequests.length === 0) {
          setError(selectedUserId === "all" ? 'ไม่มีคำขอ OT' : 'ไม่มีคำขอ OT สำหรับพนักงานคนนี้');
        }
      } else {
        console.error('API returned unsuccessful response:', result);
        setError('ไม่สามารถโหลดข้อมูลได้');
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching OT status:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMs = end - start;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return Math.max(0, diffInHours);
  };

  // แยกข้อมูลตามสถานะ
  const getPendingRequests = () => {
    return requests.filter(request => request.status === 1);
  };

  const getApprovedRequests = () => {
    return requests.filter(request => request.status === 3);
  };

  const getRejectedRequests = () => {
    return requests.filter(request => request.status === 4);
  };

  // ข้อมูลที่จะแสดงตาม tab ที่เลือก
  const getFilteredData = () => {
    switch (activeTab) {
      case 1: return getPendingRequests();
      case 3: return getApprovedRequests();
      case 4: return getRejectedRequests();
      default: return getPendingRequests();
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHours = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours} ชม.`;
    } else {
      return `${wholeHours} ชม. ${minutes} นาที`;
    }
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status];
    if (!config) return null;
    
    return (
      <div className={`flex items-center gap-1 ${config.color} px-2 py-1 rounded-full text-xs`}>
        <span>{config.icon}</span>
        {config.text}
      </div>
    );
  };

  const handleApprove = async (index, requestId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการอนุมัติ',
      text: 'คุณต้องการอนุมัติคำขอนี้หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ใช่, อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      setProcessingId(requestId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/updateOTStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: requestId,
          status: 3
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // อัปเดต status ใน array requests
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === requestId ? { ...req, status: 3 } : req
          )
        );
        
        await Swal.fire({
          title: 'สำเร็จ!',
          text: 'อนุมัติคำขอเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonColor: '#10b981',
          timer: 2000,
          timerProgressBar: true
        });
      } else {
        console.error('Failed to approve request:', result);
        await Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'ไม่สามารถอนุมัติคำขอได้',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      await Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'เกิดข้อผิดพลาดในการอนุมัติ',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (index, requestId) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'ไม่อนุมัติคำขอ OT',
      text: 'กรุณาระบุเหตุผลในการไม่อนุมัติ',
      input: 'textarea',
      inputAttributes: {
        placeholder: 'เช่น ไม่จำเป็นต้องทำ OT ในช่วงเวลานี้...',
        maxlength: 200,
        rows: 4
      },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ยืนยันไม่อนุมัติ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return 'กรุณาระบุเหตุผลในการไม่อนุมัติ';
        }
        if (value.trim().length < 5) {
          return 'เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร';
        }
        return null;
      }
    });

    if (!isConfirmed || !reason) return;
    
    try {
      setProcessingId(requestId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/rejectOTbyAdmin/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason_reject: reason.trim(),
          status: 4
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // อัปเดต status ใน array requests เป็น 4
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === requestId ? { ...req, status: 4 } : req
          )
        );
        
        // รีเฟรชข้อมูลการไม่อนุมัติ
        await fetchRejectDetails();
        
        await Swal.fire({
          title: 'สำเร็จ!',
          text: 'ไม่อนุมัติคำขอเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonColor: '#10b981',
          timer: 2000,
          timerProgressBar: true
        });
      } else {
        console.error('Failed to reject request:', result);
        await Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'ไม่สามารถไม่อนุมัติคำขอได้',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      await Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'เกิดข้อผิดพลาดในการไม่อนุมัติ',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredData = getFilteredData();

  // ได้พนักงานที่เลือก
  const getSelectedEmployee = () => {
    if (selectedUserId === "all") return { first_name: "ทุกคน", last_name: "" };
    return employees.find(emp => emp.user_id === selectedUserId);
  };

  if (loading && (requests.length === 0 || !selectedUserId)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">อนุมัติคำขอ OT</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Selection Card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          👥 เลือกพนักงาน
        </h2>
        
        <select
          value={selectedUserId}
          onChange={(e) => {
            setSelectedUserId(e.target.value);
            setRequests([]);
            setActiveTab(1);
          }}
          className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">ทุกคน</option>
          {employees.map((emp) => (
            <option key={emp.user_id} value={emp.user_id}>
              {emp.first_name} {emp.last_name}
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* Filter Tabs */}
          <div className="mx-4 bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex space-x-2 overflow-x-auto">
              <button 
                onClick={() => setActiveTab(1)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === 1 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                รออนุมัติ ({getPendingRequests().length})
              </button>
              <button 
                onClick={() => setActiveTab(3)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === 3 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                อนุมัติแล้ว ({getApprovedRequests().length})
              </button>
              <button 
                onClick={() => setActiveTab(4)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === 4 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ไม่อนุมัติ ({getRejectedRequests().length})
              </button>
            </div>
          </div>
        </>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mx-4 mt-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <p className="text-green-700 text-sm flex-1">{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage('')}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {selectedUserId ? (
          <>
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-red-700 text-sm flex-1">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {filteredData.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  ไม่มีคำขอ OT {statusConfig[activeTab]?.text}
                </h3>
                <p className="text-gray-600">
                  {selectedUserId === "all" 
                    ? "ยังไม่มีการร้องขอ OT ในสถานะนี้" 
                    : "พนักงานคนนี้ยังไม่มี OT ในสถานะนี้"}
                </p>
              </div>
            ) : (
              filteredData.map((request, index) => (
                <div key={request.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden border-l-4 ${
                  request.status === 1 ? 'border-yellow-400' :
                  request.status === 3 ? 'border-green-400' : 'border-red-400'
                }`}>
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{request.username}</span>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-4 space-y-3">
                    {/* Reason */}
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">เหตุผล</p>
                        <p className="text-sm text-gray-900">{request.reason}</p>
                      </div>
                    </div>

                    {/* Date & Time with Duration */}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">ระยะเวลา</p>
                        <div className="bg-gray-50 rounded-lg p-3 mt-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-500">เริ่ม</span>
                            <span className="text-sm text-gray-900">{formatDateTime(request.start_time)}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-500">สิ้นสุด</span>
                            <span className="text-sm text-gray-900">{formatDateTime(request.end_time)}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">รวมเวลา</span>
                              <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                {formatHours(calculateHours(request.start_time, request.end_time))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Approver */}
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">ผู้รับรอง</p>
                        <p className="text-sm text-gray-900">{request.approve}</p>
                      </div>
                    </div>

                    {/* แสดงข้อมูลการไม่อนุมัติ (รุ่นใหม่) */}
                    {request.status === 4 && rejectDetails[request.id] && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-red-500 font-medium mb-1">เหตุผลที่ไม่อนุมัติ</p>
                            <p className="text-sm text-red-800 bg-white border border-red-200 rounded p-2">
                              {rejectDetails[request.id].reason_reject}
                            </p>
                          </div>
                        </div>
                        
                        {rejectDetails[request.id].approve_admin && (
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-red-500 font-medium mb-1">ผู้ไม่อนุมัติ</p>
                              <p className="text-sm text-red-800 bg-white border border-red-200 rounded p-2">
                                {getEmployeeName(rejectDetails[request.id].approve_admin)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* แสดงเหตุผลที่ไม่อนุมัติ (เก่า - fallback) */}
                    {request.status === 4 && !rejectDetails[request.id] && rejectedReasons[request.id] && (
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-red-500">เหตุผลที่ไม่อนุมัติ</p>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mt-1">
                            {rejectedReasons[request.id]}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Only show for pending requests */}
                  {request.status === 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(index, request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingId === request.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              กำลังดำเนินการ...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              ไม่อนุมัติ
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleApprove(index, request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingId === request.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              กำลังดำเนินการ...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              อนุมัติ
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status Message for completed requests */}
                  {request.status !== 1 && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <p className="text-xs text-gray-500 text-center">
                        {request.status === 3 ? 'คำขอนี้ได้รับการอนุมัติแล้ว' : 'คำขอนี้ไม่ได้รับการอนุมัติ'}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading More */}
            {loading && requests.length > 0 && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
          </>
        ) : (
          /* Welcome State */
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ยินดีต้อนรับ
            </h3>
            <p className="text-gray-500">
              เริ่มต้นด้วยการเลือกพนักงานที่ต้องการดู OT
            </p>
          </div>
        )}
      </div>

      {/* Bottom Safe Area */}
      <div className="h-6"></div>
    </div>
  );
};

export default ApproveByAdmin;