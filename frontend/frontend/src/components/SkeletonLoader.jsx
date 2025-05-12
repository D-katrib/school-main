import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="row g-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="col-md-6 col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div className="w-100">
                  {/* Title skeleton */}
                  <div className="skeleton-title mb-2"></div>
                  
                  {/* Course name skeleton */}
                  <div className="skeleton-text mb-2"></div>
                  
                  {/* Description skeleton */}
                  <div className="skeleton-text mb-2"></div>
                  <div className="skeleton-text mb-2"></div>
                </div>
                
                <div className="mt-3 mt-md-0">
                  {/* Status badge skeleton */}
                  <div className="skeleton-badge mb-2"></div>
                  
                  {/* Due date skeleton */}
                  <div className="skeleton-text"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader; 