import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
const OT = () => {
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    reason: ''
  });
  
  const [totalHours, setTotalHours] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // คำนวณเวลารวม
  useEffect(() => {
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime > startDateTime) {
        const diffMs = endDateTime - startDateTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        
        setTotalHours(hours);
        setTotalMinutes(minutes);
      } else {
        setTotalHours(0);
        setTotalMinutes(0);
      }
    } else {
      setTotalHours(0);
      setTotalMinutes(0);
    }
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleSubmit = async () => {
    // Validation with shake effect
    const newErrors = {};
    
    if (!formData.startDate) newErrors.startDate = true;
    if (!formData.startTime || formData.startTime === ':') newErrors.startTime = true;
    if (!formData.endDate) newErrors.endDate = true;
    if (!formData.endTime || formData.endTime === ':') newErrors.endTime = true;
    if (!formData.reason.trim()) newErrors.reason = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Trigger shake animation
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) || 
                          document.querySelector(`[data-field="${firstErrorField}"]`);
      
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          if (errorElement.style) {
            errorElement.style.animation = '';
          }
        }, 500);
      }
      
      return;
    }
    
    if (totalHours === 0 && totalMinutes === 0) {
      alert('กรุณาตรวจสอบวันเวลาที่กรอก');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // สร้าง datetime strings
      const startTime = `${formData.startDate}T${formData.startTime}:00`;
      const endTime = `${formData.endDate}T${formData.endTime}:00`;
      
      // เรียก API
      const token = localStorage.getItem('token'); // หรือ sessionStorage
      
      console.log('Sending OT request:', {
        startTime,
        endTime,
        reason: formData.reason.trim()
      });
      
      const response = await fetch('http://localhost:8000/api/v1/user/ot-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startTime: startTime,
          endTime: endTime,
          reason: formData.reason.trim()
        })
      });
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        // Show success message
        alert(`${result.message}\nOT ID: ${result.data.ot_id}\nรวมเวลา: ${totalHours} ชั่วโมง ${totalMinutes} นาที`);
        
        // Reset form
        setFormData({
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          reason: ''
        });
        setErrors({});
        
      } else {
        // Show error message from server
        alert(result.message || 'เกิดข้อผิดพลาดในการยื่นเรื่อง OT');
      }
      
    } catch (error) {
      console.error('API Error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

 

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      {/* CSS for shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">⏰</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ยื่นเรื่อง OT</h1>
            <p className="text-gray-600">กรอกข้อมูลการทำงานล่วงเวลา</p>
            <p className='text-emerald-500 font-bold'><Link to = '/MyOT'>ดูรายการ OT ของฉัน</Link></p>
          </div>
        </div>
      </div>

      {/* Start Date & Time */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🟢</span>
          <h2 className="text-lg font-bold text-gray-800">เวลาเริ่มต้น</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่เริ่ม
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-xl 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        bg-gray-50 text-gray-900 transition-all duration-300 ${
                        errors.startDate 
                          ? 'border-red-500 ring-2 ring-red-200 bg-red-50' 
                          : 'border-gray-300'
                      }`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เวลาเริ่ม
            </label>
            <div className="flex gap-2" data-field="startTime">
              <select
                value={formData.startTime.split(':')[0] || ''}
                onChange={(e) => {
                  const hour = e.target.value;
                  const minute = formData.startTime.split(':')[1] || '00';
                  setFormData(prev => ({
                    ...prev,
                    startTime: `${hour}:${minute}`
                  }));
                  
                  // Clear error when user selects
                  if (errors.startTime) {
                    setErrors(prev => ({
                      ...prev,
                      startTime: false
                    }));
                  }
                }}
                className={`flex-1 p-3 border rounded-xl 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          bg-gray-50 text-gray-900 transition-all duration-300 ${
                          errors.startTime 
                            ? 'border-red-500 ring-2 ring-red-200 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                style={{ maxHeight: '200px' }}
              >
                <option value="">ชั่วโมง</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              
              <select
                value={formData.startTime.split(':')[1] || ''}
                onChange={(e) => {
                  const hour = formData.startTime.split(':')[0] || '00';
                  const minute = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    startTime: `${hour}:${minute}`
                  }));
                  
                  // Clear error when user selects
                  if (errors.startTime) {
                    setErrors(prev => ({
                      ...prev,
                      startTime: false
                    }));
                  }
                }}
                className={`flex-1 p-3 border rounded-xl 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          bg-gray-50 text-gray-900 transition-all duration-300 ${
                          errors.startTime 
                            ? 'border-red-500 ring-2 ring-red-200 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                style={{ maxHeight: '200px' }}
              >
                <option value="">นาที</option>
                {['00', '15', '30', '45'].map(minute => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* End Date & Time */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🔴</span>
          <h2 className="text-lg font-bold text-gray-800">เวลาสิ้นสุด</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              min={formData.startDate}
              className={`w-full p-3 border rounded-xl 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        bg-gray-50 text-gray-900 transition-all duration-300 ${
                        errors.endDate 
                          ? 'border-red-500 ring-2 ring-red-200 bg-red-50' 
                          : 'border-gray-300'
                      }`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เวลาสิ้นสุด
            </label>
            <div className="flex gap-2" data-field="endTime">
              <select
                value={formData.endTime.split(':')[0] || ''}
                onChange={(e) => {
                  const hour = e.target.value;
                  const minute = formData.endTime.split(':')[1] || '00';
                  setFormData(prev => ({
                    ...prev,
                    endTime: `${hour}:${minute}`
                  }));
                  
                  // Clear error when user selects
                  if (errors.endTime) {
                    setErrors(prev => ({
                      ...prev,
                      endTime: false
                    }));
                  }
                }}
                className={`flex-1 p-3 border rounded-xl 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          bg-gray-50 text-gray-900 transition-all duration-300 ${
                          errors.endTime 
                            ? 'border-red-500 ring-2 ring-red-200 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                style={{ maxHeight: '200px' }}
              >
                <option value="">ชั่วโมง</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              
              <select
                value={formData.endTime.split(':')[1] || ''}
                onChange={(e) => {
                  const hour = formData.endTime.split(':')[0] || '00';
                  const minute = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    endTime: `${hour}:${minute}`
                  }));
                  
                  // Clear error when user selects
                  if (errors.endTime) {
                    setErrors(prev => ({
                      ...prev,
                      endTime: false
                    }));
                  }
                }}
                className={`flex-1 p-3 border rounded-xl 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          bg-gray-50 text-gray-900 transition-all duration-300 ${
                          errors.endTime 
                            ? 'border-red-500 ring-2 ring-red-200 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                style={{ maxHeight: '200px' }}
              >
                <option value="">นาที</option>
                {['00', '15', '30', '45'].map(minute => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Total Time Display */}
      {(totalHours > 0 || totalMinutes > 0) && (
        <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <span className="text-lg font-bold text-gray-800">รวมเวลา OT</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">
                {totalHours} ชม. {totalMinutes} นาที
              </div>
              <div className="text-sm text-green-600">
                ({totalHours + (totalMinutes / 60).toFixed(1)} ชั่วโมง)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">📝</span>
          <h2 className="text-lg font-bold text-gray-800">เหตุผลที่ต้องทำ OT</h2>
        </div>
        
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          placeholder="กรุณาระบุเหตุผลที่ต้องทำงานล่วงเวลา เช่น งานเร่งด่วน, โปรเจคพิเศษ, ลูกค้าต้องการ..."
          rows="4"
          className={`w-full p-4 border rounded-xl 
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    bg-gray-50 text-gray-900 resize-none transition-all duration-300 ${
                    errors.reason 
                      ? 'border-red-500 ring-2 ring-red-200 bg-red-50' 
                      : 'border-gray-300'
                  }`}
        />
        <div className="text-right text-sm text-gray-500 mt-2">
          {formData.reason.length}/500 ตัวอักษร
        </div>
      </div>

      {/* Submit Button */}
      <div className="mb-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (totalHours === 0 && totalMinutes === 0)}
          className={`w-full h-16 rounded-2xl font-bold text-xl transition-all duration-300 transform ${
            isSubmitting || (totalHours === 0 && totalMinutes === 0)
              ? 'bg-gray-400 cursor-not-allowed scale-95'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105 active:scale-100'
          } text-white shadow-lg`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังยื่นเรื่อง...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">📤</span>
              <span>ยื่นเรื่อง OT</span>
            </div>
          )}
        </button>
      </div>


    </div>
  );
};

export default OT;