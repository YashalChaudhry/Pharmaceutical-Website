document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initialized - Fixed version');
    
    // DOM Elements
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const medicineForm = document.getElementById('medicineForm');
    const medicinesList = document.getElementById('medicinesList');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noMedicines = document.getElementById('noMedicines');
    const medicineFormTitle = document.getElementById('formTitle');
    const medicineSubmitBtn = document.getElementById('submitBtnText');
    const cancelBtn = document.getElementById('cancelBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const deleteMedicineName = document.getElementById('deleteMedicineName');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const alertToast = new bootstrap.Toast(document.getElementById('alertToast'));
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // Form fields
    const medicineId = document.getElementById('medicineId');
    const medicineName = document.getElementById('medicineName');
    const medicinePrice = document.getElementById('medicinePrice');
    const medicineDescription = document.getElementById('medicineDescription');
    const medicineCategory = document.getElementById('medicineCategory');
    const medicineImage = document.getElementById('medicineImage');
    const imagePreview = document.getElementById('imagePreview');

    // API Base URL
    const API_BASE_URL = 'http://localhost:3001/api';
    console.log('API Base URL:', API_BASE_URL);
    
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        showAdminPanel();
        loadMedicines();
    }

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    medicineForm.addEventListener('submit', handleMedicineSubmit);
    cancelBtn.addEventListener('click', resetForm);
    medicineImage.addEventListener('change', handleImagePreview);
    searchBtn.addEventListener('click', () => searchMedicines(searchInput.value));
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchMedicines(searchInput.value);
        }
    });

    // Login Handler
    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple admin credentials check (in a real app, this would be server-side)
        if (username === 'admin' && password === 'admin123') {
            // Store token (in a real app, this would be a JWT from the server)
            localStorage.setItem('adminToken', 'admin-token-placeholder');
            loginError.classList.add('d-none');
            showAdminPanel();
            loadMedicines();
        } else {
            loginError.classList.remove('d-none');
        }
    }

    // Logout Handler
    function handleLogout() {
        localStorage.removeItem('adminToken');
        showLoginPanel();
    }

    // Show Admin Panel
    function showAdminPanel() {
        loginSection.classList.add('d-none');
        adminPanel.classList.remove('d-none');
    }

    // Show Login Panel
    function showLoginPanel() {
        adminPanel.classList.add('d-none');
        loginSection.classList.remove('d-none');
    }

    // Load Medicines
    function loadMedicines() {
        showLoading(true);
        console.log('Loading medicines from API...');
        
        fetch(`${API_BASE_URL}/medicines`)
            .then(response => {
                console.log('Medicines API response status:', response.status);
                if (!response.ok) {
                    throw new Error(`Failed to fetch medicines: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Loaded ${data.length} medicines from API`);
                renderMedicines(data);
                showLoading(false);
            })
            .catch(error => {
                console.error('Error loading medicines:', error);
                showToast('Error', 'Failed to load medicines. Please try again.', 'error');
                showLoading(false);
            });
    }

    // Search Medicines
    function searchMedicines(query) {
        if (!query.trim()) {
            loadMedicines();
            return;
        }
        
        showLoading(true);
        console.log(`Searching medicines with query: ${query}`);
        
        fetch(`${API_BASE_URL}/medicines/search?query=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to search medicines');
                }
                return response.json();
            })
            .then(data => {
                renderMedicines(data);
                showLoading(false);
            })
            .catch(error => {
                console.error('Error searching medicines:', error);
                showToast('Error', 'Failed to search medicines. Please try again.', 'error');
                showLoading(false);
            });
    }

    // Render Medicines
    function renderMedicines(medicines) {
        medicinesList.innerHTML = '';
        console.log(`Rendering ${medicines ? medicines.length : 0} medicines`);
        
        if (!medicines || medicines.length === 0) {
            noMedicines.classList.remove('d-none');
            return;
        }
        
        noMedicines.classList.add('d-none');
        
        medicines.forEach(medicine => {
            const row = document.createElement('tr');
            
            // Format image URL
            let imageUrl = 'https://via.placeholder.com/150';
            if (medicine.image && medicine.image.data) {
                // Check if data is already a base64 string
                if (typeof medicine.image.data === 'string') {
                    imageUrl = `data:${medicine.image.contentType || 'image/jpeg'};base64,${medicine.image.data}`;
                } else if (medicine.image.data.data) {
                    // Handle buffer data
                    try {
                        const base64 = arrayBufferToBase64(medicine.image.data.data);
                        imageUrl = `data:${medicine.image.contentType || 'image/jpeg'};base64,${base64}`;
                    } catch (error) {
                        console.error('Error processing image data:', error);
                    }
                }
            }
            
            row.innerHTML = `
                <td><img src="${imageUrl}" alt="${medicine.name || 'No Name'}" class="medicine-image"></td>
                <td>${medicine.name || 'No Name'}</td>
                <td>Rs. ${medicine.price || 0}</td>
                <td><span class="category-badge">${medicine.category || 'Uncategorized'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary action-btn edit-btn" data-id="${medicine._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger action-btn delete-btn" data-id="${medicine._id}" data-name="${medicine.name || 'Unnamed Medicine'}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            medicinesList.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editMedicine(btn.getAttribute('data-id')));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                showDeleteConfirmation(id, name);
            });
        });
        
        showLoading(false);
    }

    // Show Delete Confirmation
    function showDeleteConfirmation(id, name) {
        deleteMedicineName.textContent = name;
        confirmDeleteBtn.onclick = () => {
            deleteMedicine(id);
            deleteModal.hide();
        };
        deleteModal.show();
    }

    // Edit Medicine
    function editMedicine(id) {
        showLoading(true);
        console.log('Editing medicine with ID:', id);
        
        fetch(`${API_BASE_URL}/medicines/${id}`)
            .then(response => {
                console.log('Edit medicine API response status:', response.status);
                if (!response.ok) {
                    throw new Error(`Failed to fetch medicine details: ${response.status}`);
                }
                return response.json();
            })
            .then(medicine => {
                console.log('Medicine details loaded:', medicine);
                // Populate form with medicine details
                medicineId.value = medicine._id;
                medicineName.value = medicine.name || '';
                medicinePrice.value = medicine.price || '';
                medicineDescription.value = medicine.description || '';
                medicineCategory.value = medicine.category || '';
                
                // Update image preview if available
                if (medicine.image && medicine.image.data) {
                    // Check if data is already a base64 string
                    let imageData;
                    if (typeof medicine.image.data === 'string') {
                        imageData = medicine.image.data;
                    } else if (medicine.image.data.data) {
                        imageData = arrayBufferToBase64(medicine.image.data.data);
                    }
                    
                    if (imageData) {
                        imagePreview.src = `data:${medicine.image.contentType || 'image/jpeg'};base64,${imageData}`;
                        imagePreview.classList.remove('d-none');
                    } else {
                        imagePreview.classList.add('d-none');
                    }
                } else {
                    imagePreview.classList.add('d-none');
                }
                
                // Update form title and button text
                medicineFormTitle.textContent = 'Edit Medicine';
                medicineSubmitBtn.textContent = 'Update Medicine';
                cancelBtn.classList.remove('d-none');
                
                showLoading(false);
            })
            .catch(error => {
                console.error('Error fetching medicine details:', error);
                showToast('Error', 'Failed to load medicine details. Please try again.', 'error');
                showLoading(false);
                resetForm(); // Reset form on error
            });
    }

    // Delete Medicine
    function deleteMedicine(id) {
        showLoading(true);
        console.log('Deleting medicine with ID:', id);
        
        fetch(`${API_BASE_URL}/medicines/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                console.log('Delete API response status:', response.status);
                if (!response.ok) {
                    throw new Error(`Failed to delete medicine: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Medicine deleted successfully:', data);
                showToast('Success', 'Medicine deleted successfully!', 'success');
                loadMedicines();
            })
            .catch(error => {
                console.error('Error deleting medicine:', error);
                showToast('Error', 'Failed to delete medicine. Please try again.', 'error');
                showLoading(false);
            });
    }

    // Handle Medicine Form Submit
    function handleMedicineSubmit(e) {
        e.preventDefault();
        
        const isEdit = medicineId.value !== '';
        const formData = new FormData();
        
        // Validate form data
        if (!medicineName.value.trim()) {
            showToast('Error', 'Medicine name is required', 'error');
            return;
        }
        
        if (!medicinePrice.value || isNaN(medicinePrice.value) || Number(medicinePrice.value) <= 0) {
            showToast('Error', 'Please enter a valid price', 'error');
            return;
        }
        
        formData.append('name', medicineName.value.trim());
        formData.append('price', medicinePrice.value);
        formData.append('description', medicineDescription.value.trim());
        formData.append('category', medicineCategory.value);
        
        if (medicineImage.files.length > 0) {
            formData.append('image', medicineImage.files[0]);
        }
        
        showLoading(true);
        console.log(`${isEdit ? 'Updating' : 'Adding'} medicine: ${medicineName.value}`);
        
        const url = isEdit 
            ? `${API_BASE_URL}/medicines/${medicineId.value}` 
            : `${API_BASE_URL}/medicines`;
        
        // Use PATCH for edit (as per the backend routes) and POST for new
        const method = isEdit ? 'PATCH' : 'POST';
        
        // Log form data for debugging
        console.log('Form data entries:');
        for (let pair of formData.entries()) {
            if (pair[0] !== 'image') {
                console.log(pair[0] + ': ' + pair[1]);
            } else {
                console.log(pair[0] + ': [File object]');
            }
        }
        
        fetch(url, {
            method: method,
            body: formData
            // Do not set Content-Type header when using FormData
            // The browser will set it automatically with the correct boundary
        })
            .then(response => {
                console.log('API response status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Failed to ${isEdit ? 'update' : 'add'} medicine: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log(`Medicine ${isEdit ? 'updated' : 'added'} successfully:`, data);
                showToast('Success', `Medicine ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
                resetForm();
                loadMedicines();
            })
            .catch(error => {
                console.error(`Error ${isEdit ? 'updating' : 'adding'} medicine:`, error);
                showToast('Error', `Failed to ${isEdit ? 'update' : 'add'} medicine. Please try again.`, 'error');
                showLoading(false);
            });
    }

    // Reset Form
    function resetForm() {
        medicineForm.reset();
        medicineId.value = '';
        imagePreview.classList.add('d-none');
        medicineFormTitle.textContent = 'Add New Medicine';
        medicineSubmitBtn.textContent = 'Add Medicine';
        cancelBtn.classList.add('d-none');
        showLoading(false);
    }

    // Handle Image Preview
    function handleImagePreview() {
        const file = medicineImage.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.classList.add('d-none');
        }
    }

    // Show Loading
    function showLoading(show) {
        if (show) {
            loadingSpinner.classList.remove('d-none');
        } else {
            loadingSpinner.classList.add('d-none');
        }
    }

    // Show Toast
    function showToast(title, message, type = 'info') {
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        const toast = document.getElementById('alertToast');
        toast.className = 'toast';
        toast.classList.add(`text-bg-${type === 'error' ? 'danger' : type}`);
        
        alertToast.show();
    }

    // Helper function to convert array buffer to base64
    function arrayBufferToBase64(buffer) {
        // Handle case when buffer is already a string
        if (typeof buffer === 'string') {
            return buffer;
        }
        
        try {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            
            return window.btoa(binary);
        } catch (error) {
            console.error('Error converting buffer to base64:', error);
            return '';
        }
    }
});
