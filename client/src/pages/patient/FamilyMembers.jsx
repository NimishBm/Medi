import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { patientNav } from '../../components/PatientNav';
import { userAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export const FamilyMembers = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Child',
    dateOfBirth: '',
    gender: 'M',
    allergies: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter member name');
      return;
    }

    setIsSubmitting(true);
    try {
      const allergiesArray = formData.allergies
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a);

      const newMember = {
        name: formData.name.trim(),
        relationship: formData.relationship,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        allergies: allergiesArray,
      };

      const updatedFamilyMembers = [...(user.familyMembers || []), newMember];
      const response = await userAPI.updateMe({
        familyMembers: updatedFamilyMembers,
      });

      dispatch(
        setUser({
          user: response.data,
          token,
        })
      );

      toast.success(`${formData.name} added successfully!`);
      setFormData({
        name: '',
        relationship: 'Child',
        dateOfBirth: '',
        gender: 'M',
        allergies: '',
      });
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add family member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (index) => {
    if (window.confirm('Are you sure you want to remove this family member?')) {
      setIsSubmitting(true);
      try {
        const updatedFamilyMembers = user.familyMembers.filter((_, i) => i !== index);
        const response = await userAPI.updateMe({
          familyMembers: updatedFamilyMembers,
        });

        dispatch(
          setUser({
            user: response.data,
            token,
          })
        );

        toast.success('Family member removed');
      } catch (error) {
        toast.error('Failed to remove family member');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={patientNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Family Members" />
        <div className="p-8 max-w-4xl mx-auto w-full">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Family Members</h2>
              {!showForm && (
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  + Add Member
                </button>
              )}
            </div>

            {showForm && (
              <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Family Member</h3>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter member name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                      <select
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Grandparent">Grandparent</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allergies (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        placeholder="e.g. Penicillin, Aspirin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary"
                    >
                      {isSubmitting ? 'Saving...' : 'Add Member'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {user?.familyMembers?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.familyMembers.map((member, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.relationship}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(index)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    {member.dateOfBirth && (
                      <p className="text-sm text-gray-600 mb-2">
                        DOB: {new Date(member.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}

                    {member.gender && (
                      <p className="text-sm text-gray-600 mb-2">Gender: {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : 'Other'}</p>
                    )}

                    {member.allergies?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Allergies:</p>
                        <div className="flex flex-wrap gap-1">
                          {member.allergies.map((allergy, idx) => (
                            <span key={idx} className="badge badge-danger text-xs">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No family members added yet</p>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="btn-primary">
                    Add Your First Family Member
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
