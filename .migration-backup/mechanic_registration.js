document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('mechanicProposalForm');
    
    // File upload handlers
    setupFileUploads();
    
    // Form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        // Clear previous errors
        document.querySelectorAll('.error').forEach(el => el.textContent = '');
        document.getElementById('formSuccess').textContent = '';
        
        // Validate form
        if (!validateForm()) return;
        
        document.getElementById('spinner').style.display = 'block';
        
        try {
            const formData = new FormData(form);
            const fileFields = ['profilePhoto', 'skillCerts', 'eduCert', 'nidPhoto', 'birthCertPhoto', 'workPhotos'];
            
            // Collect all file data as base64
            const filesToSend = {};
            for (const field of fileFields) {
                const files = formData.getAll(field);
                if (files.length > 0) {
                    filesToSend[field] = [];
                    for (const file of files) {
                        const base64 = await fileToBase64(file);
                        filesToSend[field].push(base64);
                    }
                }
            }
            
            // Prepare payload
            const payload = {
                full_name: formData.get('fullName'),
                email: formData.get('email'),
                password: formData.get('password'),
                age: formData.get('age') || null,
                mobile: formData.get('mobile'),
                dob: formData.get('dob') || null,
                address: formData.get('address'),
                workshop_name: formData.get('workshopName'),
                experience_years: parseInt(formData.get('experience')),
                hourly_rate: parseFloat(formData.get('hourlyRate')),
                working_hours: formData.get('workingHours'),
                skills: formData.get('skills'),
                expertise: formData.get('skills'),
                education: formData.get('education'),
                nid_number: formData.get('nidNumber'),
                birth_certificate_number: formData.get('birthCertNumber'),
                work_history: formData.get('workHistory'),
                profile_photo: filesToSend.profilePhoto?.[0] || null,
                skill_certificates: filesToSend.skillCerts || [],
                education_certificate: filesToSend.eduCert?.[0] || null,
                nid_photo: filesToSend.nidPhoto?.[0] || null,
                birth_certificate_photo: filesToSend.birthCertPhoto?.[0] || null,
                work_photos: filesToSend.workPhotos || [],
                files: filesToSend
            };
            
            const response = await fetch('/mechanic/submit-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            
            let data = null;
            document.getElementById('spinner').style.display = 'none';

            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (err) {
                    document.getElementById('formError').textContent = 'Invalid JSON response from server.';
                    return;
                }
            } else {
                // Server returned plain text or HTML (e.g. error page). Show it to the user.
                const text = await response.text();
                // If the text is JSON-like, try to parse it; otherwise display raw text.
                try {
                    data = JSON.parse(text);
                } catch (err) {
                    document.getElementById('formError').textContent = text || 'Server error. Please try again later.';
                    return;
                }
            }

            if (data && data.success) {
                document.getElementById('formSuccess').textContent = '✅ Proposal submitted! Redirecting to your dashboard...';
                setTimeout(() => {
                    window.location.href = '/mechanic_dashboard.html';
                }, 1500);
            } else {
                document.getElementById('formError').textContent = (data && data.message) || 'Error submitting proposal';
            }
        } catch (error) {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('formError').textContent = 'Error: ' + error.message;
        }
    });
});

function setupFileUploads() {
    const fileUploads = [
        { id: 'profilePhotoUpload', preview: 'profilePhotoPreview', single: true },
        { id: 'skillCertUpload', preview: 'skillCertPreview', single: false },
        { id: 'eduCertUpload', preview: 'eduCertPreview', single: true },
        { id: 'nidPhotoUpload', preview: 'nidPhotoPreview', single: true },
        { id: 'birthCertUpload', preview: 'birthCertPreview', single: true },
        { id: 'workPhotoUpload', preview: 'workPhotoPreview', single: false }
    ];
    
    fileUploads.forEach(upload => {
        const element = document.getElementById(upload.id);
        const input = element.querySelector('input[type="file"]');
        const preview = document.getElementById(upload.preview);
        
        element.addEventListener('click', () => input.click());
        
        input.addEventListener('change', function () {
            const files = Array.from(this.files);
            
            if (upload.single && files.length > 1) {
                files = [files[0]];
            }
            
            preview.innerHTML = '';
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const item = document.createElement('div');
                    item.className = 'preview-item';
                    item.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="remove-btn" data-index="${index}">×</button>
                    `;
                    preview.appendChild(item);
                };
                reader.readAsDataURL(file);
            });
        });
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

function validateForm() {
    const form = document.getElementById('mechanicProposalForm');
    let isValid = true;
    
    // Check required fields
    const fullName = form.querySelector('[name="fullName"]').value.trim();
    if (!fullName) {
        document.getElementById('fullNameError').textContent = 'Full name is required';
        isValid = false;
    }
    
    const email = form.querySelector('[name="email"]').value.trim();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        document.getElementById('emailError').textContent = 'Valid email is required';
        isValid = false;
    }
    
    const password = form.querySelector('[name="password"]').value;
    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    
    const mobile = form.querySelector('[name="mobile"]').value.trim();
    if (!mobile) {
        document.getElementById('mobileError').textContent = 'Mobile number is required';
        isValid = false;
    }
    
    const agreement = form.querySelector('[name="agreement"]').checked;
    if (!agreement) {
        document.getElementById('agreementError').textContent = 'You must agree to the terms';
        isValid = false;
    }
    
    return isValid;
}
