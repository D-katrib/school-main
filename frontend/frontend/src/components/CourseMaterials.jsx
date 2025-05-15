import React, { useState, useEffect } from 'react';
import { courseService, handleApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faVideo, faLink, faFileAlt, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const CourseMaterials = ({ courseId }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    type: 'file',
    url: '',
    content: ''
  });
  const { currentUser } = useAuth();
  const isTeacher = currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';
  const canManageMaterials = isTeacher || isAdmin;

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseMaterials(courseId);
      setMaterials(response.data.data);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!newMaterial.title) {
      setError('Please provide a title for the material');
      return;
    }
    
    if (!selectedFile && !newMaterial.url) {
      setError('Please either upload a file or provide a URL');
      return;
    }
    
    try {
      setLoading(true);
      setIsUploading(true);
      setError(null); // Clear any previous errors
      
      // If a file is selected, use FormData to upload it
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', newMaterial.title);
        
        if (newMaterial.description) {
          formData.append('description', newMaterial.description);
        }
        
        formData.append('type', newMaterial.type || 'file'); // Default to 'file' if not specified
        
        if (newMaterial.content) {
          formData.append('content', newMaterial.content);
        }
        
        // If URL is provided, include it
        if (newMaterial.url) {
          formData.append('url', newMaterial.url);
        }
        
        console.log('Uploading file with FormData');
        await courseService.addCourseMaterial(courseId, formData, true);
      } else {
        // If no file is selected, make sure we have a URL
        if (!newMaterial.url) {
          setError('Please provide a URL for the material');
          setLoading(false);
          setIsUploading(false);
          return;
        }
        
        console.log('Adding material with JSON data');
        await courseService.addCourseMaterial(courseId, newMaterial);
      }
      
      setShowAddModal(false);
      setNewMaterial({
        title: '',
        description: '',
        type: 'file',
        url: '',
        content: ''
      });
      setSelectedFile(null);
      await fetchMaterials();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Auto-fill title with filename if empty
      if (!newMaterial.title) {
        const fileName = file.name.split('.')[0]; // Remove extension
        setNewMaterial(prev => ({
          ...prev,
          title: fileName
        }));
      }
    }
  };

  const handleRemoveMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to remove this material?')) {
      try {
        setLoading(true);
        await courseService.removeCourseMaterial(courseId, materialId);
        await fetchMaterials();
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'file':
        return <FontAwesomeIcon icon={faFile} className="me-2" />;
      case 'video':
        return <FontAwesomeIcon icon={faVideo} className="me-2" />;
      case 'link':
        return <FontAwesomeIcon icon={faLink} className="me-2" />;
      case 'text':
        return <FontAwesomeIcon icon={faFileAlt} className="me-2" />;
      default:
        return <FontAwesomeIcon icon={faFile} className="me-2" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading && materials.length === 0) {
    return <div className="text-center my-4">Loading course materials...</div>;
  }

  return (
    <div className="course-materials mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Course Materials</h3>
        {canManageMaterials && (
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Material
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {materials.length === 0 ? (
        <p className="text-muted">No materials available for this course yet.</p>
      ) : (
        <div className="list-group">
          {materials.map((material) => (
            <div key={material._id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <div>
                {getMaterialIcon(material.type)}
                <a href={material.url} target="_blank" rel="noopener noreferrer">
                  {material.title}
                </a>
                {material.description && (
                  <p className="text-muted small mb-0">{material.description}</p>
                )}
                <div className="text-muted small">
                  Added on {formatDate(material.uploadDate)} by {material.addedBy?.firstName} {material.addedBy?.lastName}
                </div>
              </div>
              {canManageMaterials && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleRemoveMaterial(material._id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Material Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Course Material</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddMaterial}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={newMaterial.title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={newMaterial.description}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Material Type</Form.Label>
              <Form.Select
                name="type"
                value={newMaterial.type}
                onChange={handleInputChange}
                required
              >
                <option value="file">File</option>
                <option value="video">Video</option>
                <option value="link">Link</option>
                <option value="text">Text</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload File</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                className="mb-2"
              />
              <Form.Text className="text-muted d-block mb-3">
                Upload a file directly or provide a URL below. Maximum file size: 10MB.
              </Form.Text>
              
              <Form.Label>URL {selectedFile ? '(Optional when uploading a file)' : '(Required)'}</Form.Label>
              <Form.Control
                type="url"
                name="url"
                value={newMaterial.url}
                onChange={handleInputChange}
                required={!selectedFile}
                placeholder="https://example.com/resource"
                disabled={isUploading}
              />
              <Form.Text className="text-muted">
                If not uploading a file, enter a URL for the material (YouTube, Google Drive, etc.).
              </Form.Text>
            </Form.Group>

            {newMaterial.type === 'text' && (
              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="content"
                  value={newMaterial.content}
                  onChange={handleInputChange}
                  placeholder="Enter text content here..."
                />
              </Form.Group>
            )}

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Material
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CourseMaterials;
