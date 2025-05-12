import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  
  useEffect(() => {
    if (currentUser) {
      reset({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone || '',
        address: currentUser.address || '',
      });
    }
  }, [currentUser, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await userService.updateUser(currentUser._id, data);
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 page-transition">
      <h1 className="fs-2 fw-bold mb-4">Profile</h1>

      <div className="card mb-4 shadow-sm fade-in">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-4 mb-md-0 text-center">
              <div className="d-flex flex-column align-items-center">
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3" style={{ width: '128px', height: '128px' }}>
                  <span className="fs-1 fw-bold text-secondary">
                    {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                  </span>
                </div>
                <h2 className="fs-4 fw-semibold mb-1">
                  {currentUser.firstName} {currentUser.lastName}
                </h2>
                <p className="text-muted small text-capitalize mb-1">
                  {currentUser.role}
                </p>
                <p className="text-muted small mb-0">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div className="col-md-8">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label htmlFor="firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                      {...register('firstName', { required: 'First name is required' })}
                    />
                    {errors.firstName && (
                      <div className="invalid-feedback">{errors.firstName.message}</div>
                    )}
                  </div>

                  <div className="col-sm-6">
                    <label htmlFor="lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                      {...register('lastName', { required: 'Last name is required' })}
                    />
                    {errors.lastName && (
                      <div className="invalid-feedback">{errors.lastName.message}</div>
                    )}
                  </div>

                  <div className="col-sm-6">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="form-control bg-light"
                      {...register('email')}
                      disabled
                    />
                  </div>

                  <div className="col-sm-6">
                    <label htmlFor="phone" className="form-label">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="form-control"
                      {...register('phone')}
                    />
                  </div>

                  <div className="col-12">
                    <label htmlFor="address" className="form-label">
                      Address
                    </label>
                    <textarea
                      id="address"
                      rows="3"
                      className="form-control"
                      {...register('address')}
                    ></textarea>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm slide-in-up" style={{animationDelay: '0.1s'}}>
        <div className="card-body">
          <h2 className="fs-4 fw-semibold mb-3">Change Password</h2>
          <form>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="currentPassword" className="form-label">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  className="form-control"
                />
              </div>
              
              <div className="w-100"></div>
              
              <div className="col-md-6">
                <label htmlFor="newPassword" className="form-label">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="btn btn-primary"
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
