import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useProfileStore from '../store/profile';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    profile,
    isLoading,
    isSubmitting,
    locationLoading,
    error,
    formErrors,
    locationError,
    fetchProfile,
    saveProfile,
    getLocation,
    clearErrors,
  } = useProfileStore();

  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    target_weight: '',
    fitness_goal: '减脂' as '减脂' | '增肌',
    fitness_frequency: '3',
    training_cycle_days: '28',
    selected_muscle_groups: [] as string[],
    location_lat: '',
    location_lng: '',
  });

  const [locationName, setLocationName] = useState('');

  const isEditMode = !!profile;

  // BMI calculation
  const bmi = useMemo(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
      return (w / ((h / 100) ** 2)).toFixed(1);
    }
    return null;
  }, [formData.height, formData.weight]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: '偏瘦', color: 'text-blue-600' };
    if (val < 24) return { label: '正常', color: 'text-green-600' };
    if (val < 28) return { label: '偏胖', color: 'text-yellow-600' };
    return { label: '肥胖', color: 'text-red-600' };
  }, [bmi]);

  // Load existing profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Populate form when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age?.toString() || '',
        height: profile.height?.toString() || '',
        weight: profile.weight?.toString() || '',
        target_weight: profile.target_weight?.toString() || '',
        fitness_goal: profile.fitness_goal || '减脂',
        fitness_frequency: profile.fitness_frequency?.toString() || '3',
        training_cycle_days: profile.training_cycle_days?.toString() || '28',
        selected_muscle_groups: profile.selected_muscle_groups || [],
        location_lat: profile.location_lat?.toString() || '',
        location_lng: profile.location_lng?.toString() || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearErrors();
  };

  const toggleMuscleGroup = (group: string) => {
    setFormData(prev => {
      const groups = prev.selected_muscle_groups.includes(group)
        ? prev.selected_muscle_groups.filter(g => g !== group)
        : [...prev.selected_muscle_groups, group];
      return { ...prev, selected_muscle_groups: groups };
    });
  };

  const ALL_MUSCLE_GROUPS = ['胸', '背', '肩', '腿', '手臂', '腹部', '有氧'];

  const handleGetLocation = async () => {
    clearErrors();
    const location = await getLocation();
    if (location) {
      setFormData(prev => ({
        ...prev,
        location_lat: location.lat.toFixed(6),
        location_lng: location.lng.toFixed(6),
      }));

      // Try to get location name using reverse geocoding (simplified)
      fetchLocationName(location.lat, location.lng);
    }
  };

  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      // Using OpenStreetMap Nominatim API (no key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=zh`
      );
      const data = await response.json();
      if (data.display_name) {
        setLocationName(data.display_name.split(',')[0]); // Get first part of address
      }
    } catch (error) {
      console.log('Could not fetch location name:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Validate required fields
    const requiredFields = ['age', 'height', 'weight', 'fitness_frequency'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      toast.error('请填写所有必填字段');
      return;
    }

    // Convert form data to proper types
    const profileData = {
      age: parseInt(formData.age, 10),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      target_weight: formData.target_weight ? parseFloat(formData.target_weight) : undefined,
      fitness_goal: formData.fitness_goal,
      fitness_frequency: parseInt(formData.fitness_frequency, 10),
      training_cycle_days: parseInt(formData.training_cycle_days, 10),
      cycle_start_date: new Date().toISOString().split('T')[0],
      selected_muscle_groups: formData.selected_muscle_groups.length > 0 ? formData.selected_muscle_groups : undefined,
      location_lat: formData.location_lat ? parseFloat(formData.location_lat) : undefined,
      location_lng: formData.location_lng ? parseFloat(formData.location_lng) : undefined,
    };

    await saveProfile(profileData);
    // Navigate to dashboard after successful save
    const { profile: savedProfile } = useProfileStore.getState();
    if (savedProfile) {
      navigate('/dashboard');
    }
  };

  const fitnessFrequencyOptions = [1, 2, 3, 4, 5, 6, 7];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载个人信息中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? '编辑个人信息' : '个人信息填写'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEditMode
            ? '更新您的个人信息，AI将重新为您生成健身计划'
            : '填写您的个人信息，AI将为您生成个性化健身计划'}
        </p>
      </div>

      {(error || locationError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || locationError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                年龄 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="10"
                  max="100"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="例如：25"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">岁</span>
                </div>
              </div>
              {formErrors.age && (
                <p className="mt-1 text-sm text-red-600">{formErrors.age}</p>
              )}
            </div>

            {/* Height */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                身高 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  min="100"
                  max="250"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="例如：175.5"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">cm</span>
                </div>
              </div>
              {formErrors.height && (
                <p className="mt-1 text-sm text-red-600">{formErrors.height}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                体重 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  min="30"
                  max="300"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="例如：68.5"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">kg</span>
                </div>
              </div>
              {formErrors.weight && (
                <p className="mt-1 text-sm text-red-600">{formErrors.weight}</p>
              )}
              {bmi && bmiCategory && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-600">BMI 指数</span>
                  <span className="text-sm font-medium">
                    {bmi} <span className={bmiCategory.color}>({bmiCategory.label})</span>
                  </span>
                </div>
              )}
            </div>

            {/* Fitness Goal */}
            <div>
              <label htmlFor="fitness_goal" className="block text-sm font-medium text-gray-700 mb-1">
                健身目标 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${formData.fitness_goal === '减脂' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input type="radio" name="fitness_goal" value="减脂" checked={formData.fitness_goal === '减脂'} onChange={handleChange} className="sr-only" />
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">减脂</div>
                    <div className="text-sm text-gray-500 mt-1">降低体脂，塑造线条</div>
                  </div>
                </label>
                <label className={`relative flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${formData.fitness_goal === '增肌' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input type="radio" name="fitness_goal" value="增肌" checked={formData.fitness_goal === '增肌'} onChange={handleChange} className="sr-only" />
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">增肌</div>
                    <div className="text-sm text-gray-500 mt-1">增加肌肉，提升力量</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Target Weight */}
            <div>
              <label htmlFor="target_weight" className="block text-sm font-medium text-gray-700 mb-1">
                目标体重
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="target_weight"
                  name="target_weight"
                  value={formData.target_weight}
                  onChange={handleChange}
                  min="30"
                  max="300"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="例如：65.0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">kg</span>
                </div>
              </div>
              {formData.weight && formData.target_weight && (
                <p className="mt-1 text-xs text-gray-500">
                  {parseFloat(formData.weight) > parseFloat(formData.target_weight)
                    ? `需减重 ${(parseFloat(formData.weight) - parseFloat(formData.target_weight)).toFixed(1)} kg`
                    : `需增重 ${(parseFloat(formData.target_weight) - parseFloat(formData.weight)).toFixed(1)} kg`}
                </p>
              )}
            </div>

            {/* Fitness Frequency */}
            <div>
              <label htmlFor="fitness_frequency" className="block text-sm font-medium text-gray-700 mb-1">
                每周健身频次 <span className="text-red-500">*</span>
              </label>
              <select
                id="fitness_frequency"
                name="fitness_frequency"
                value={formData.fitness_frequency}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">选择每周健身次数</option>
                {fitnessFrequencyOptions.map(num => (
                  <option key={num} value={num}>
                    {num} 次/周
                  </option>
                ))}
              </select>
              {formErrors.fitness_frequency && (
                <p className="mt-1 text-sm text-red-600">{formErrors.fitness_frequency}</p>
              )}
            </div>

            {/* Training Cycle */}
            <div>
              <label htmlFor="training_cycle_days" className="block text-sm font-medium text-gray-700 mb-1">
                训练周期
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="training_cycle_days"
                  name="training_cycle_days"
                  value={formData.training_cycle_days}
                  onChange={handleChange}
                  min="7"
                  max="180"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="例如：30"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">天</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">建议7-180天，系统将在周期内合理分配训练计划</p>
            </div>

            {/* Muscle Group Selector */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                训练肌群选择 <span className="text-xs text-gray-400">(选择本周期要训练的肌群，系统自动分配每日组合)</span>
              </label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {ALL_MUSCLE_GROUPS.map(group => {
                  const selected = formData.selected_muscle_groups.includes(group);
                  const icons: Record<string, string> = { '胸': '🫁', '背': '🔙', '肩': '💪', '腿': '🦵', '手臂': '💪', '腹部': '🎯', '有氧': '🏃' };
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleMuscleGroup(group)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        selected
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-2xl mb-1">{icons[group]}</span>
                      <span className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-gray-600'}`}>{group}</span>
                    </button>
                  );
                })}
              </div>
              {formData.selected_muscle_groups.length > 0 && (
                <p className="mt-2 text-sm text-blue-600">
                  已选 {formData.selected_muscle_groups.length} 个肌群，系统将根据频次自动分配每日训练组合
                </p>
              )}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  地理位置（用于饮食推荐）
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locationLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      获取中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      获取当前位置
                    </>
                  )}
                </button>
              </div>

              {locationName && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-800">当前位置：{locationName}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location_lat" className="block text-sm font-medium text-gray-700 mb-1">
                    纬度
                  </label>
                  <input
                    type="number"
                    id="location_lat"
                    name="location_lat"
                    value={formData.location_lat}
                    onChange={handleChange}
                    step="any"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="例如：39.9042"
                  />
                </div>
                <div>
                  <label htmlFor="location_lng" className="block text-sm font-medium text-gray-700 mb-1">
                    经度
                  </label>
                  <input
                    type="number"
                    id="location_lng"
                    name="location_lng"
                    value={formData.location_lng}
                    onChange={handleChange}
                    step="any"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="例如：116.4074"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                授权获取位置后，AI可以根据当地气候和饮食习惯为您推荐合适的健身计划和饮食建议。
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">为什么需要这些信息？</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>年龄、身高、体重用于计算基础代谢率和制定合适的运动强度</li>
                    <li>健身目标（减脂/增肌）决定了您的训练方向和饮食计划</li>
                    <li>健身频次帮助AI合理安排每周训练计划，避免过度训练</li>
                    <li>地理位置信息用于考虑当地气候和饮食习惯，提供更个性化的建议</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors"
            >
              返回
            </button>
            <div className="space-x-4">
              <button
                type="button"
                onClick={() => {
                  // Fill with sample data for testing
                  setFormData({
                    age: '28',
                    height: '175.5',
                    weight: '72.3',
                    target_weight: '68.0',
                    fitness_goal: '减脂',
                    fitness_frequency: '4',
                    training_cycle_days: '60',
                    selected_muscle_groups: ['胸', '背', '肩', '腿', '有氧'],
                    location_lat: '39.9042',
                    location_lng: '116.4074',
                  });
                  setLocationName('北京');
                  toast.success('已填充示例数据');
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors"
              >
                填充示例
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </span>
                ) : (
                  isEditMode ? '更新并重新生成计划' : '保存并生成计划'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tips Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">个性化计划</h3>
          </div>
          <p className="text-sm text-gray-600">
            AI将根据您的个人信息生成完全个性化的健身计划，包括训练内容、饮食建议和进度跟踪。
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">科学安全</h3>
          </div>
          <p className="text-sm text-gray-600">
            所有计划都基于运动科学原理设计，确保训练强度和频率在安全合理的范围内。
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">动态调整</h3>
          </div>
          <p className="text-sm text-gray-600">
            系统会定期评估您的进度和反馈，动态调整计划以确保最佳效果。
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;