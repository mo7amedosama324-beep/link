document.addEventListener('DOMContentLoaded', () => {

    // ===================== AUTHENTICATION CHECK =====================
    let currentUser = null;
    let userRole = 'viewer'; // Default to viewer mode (guest)
    let isAuthenticated = false;

    // Check authentication on page load (optional - no redirect)
    async function checkAuth() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/me', {
                credentials: 'include',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                userRole = data.user.role;
                isAuthenticated = true;
                
                // Store user info
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update UI based on role
                updateUIForRole();
                return true;
            } else {
                // Not authenticated - continue as guest viewer
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                currentUser = null;
                userRole = 'viewer';
                isAuthenticated = false;
                
                // Update UI for guest viewer
                updateUIForRole();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // Continue as guest viewer
            currentUser = null;
            userRole = 'viewer';
            isAuthenticated = false;
            updateUIForRole();
            return false;
        }
    }

    // Apply role restrictions to UI elements
    function applyRoleRestrictions() {
        const canEdit = userRole === 'admin' || userRole === 'editor';
        
        if (!canEdit) {
            // Hide all forms
            document.querySelectorAll('form').forEach(form => {
                if (form.id !== 'logoutForm') {
                    form.style.display = 'none';
                }
            });
            
            // Hide all delete buttons
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.style.display = 'none';
            });
        }
    }

    // Update UI based on user role
    function updateUIForRole() {
        applyRoleRestrictions();
        
        // Show viewer message with login prompt if not authenticated
        const canEdit = userRole === 'admin' || userRole === 'editor';
        if (!canEdit) {
            const existingNote = document.querySelector('.viewer-note');
            if (!existingNote) {
                const viewerNote = document.createElement('div');
                viewerNote.className = 'viewer-note';
                viewerNote.style.cssText = `
                    background: rgba(167, 139, 250, 0.1);
                    border: 1px solid rgba(167, 139, 250, 0.3);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 20px;
                    color: rgba(255,255,255,0.8);
                    font-size: 0.9rem;
                `;
                
                if (isAuthenticated) {
                    viewerNote.innerHTML = `
                        <strong>👁️ Viewer Mode:</strong> You have read-only access. Contact an admin for edit permissions.
                    `;
                } else {
                    viewerNote.innerHTML = `
                        <strong>👁️ Guest Mode:</strong> You're viewing in read-only mode. 
                        <a href="/login" style="color: #4f8ef7; font-weight: 600; text-decoration: underline;">Login</a> 
                        to add, edit, or delete data.
                    `;
                }
                
                const mainHeader = document.querySelector('.main header');
                if (mainHeader) {
                    mainHeader.after(viewerNote);
                }
            }
        }
        
        // Update user info in sidebar
        updateUserInfo();
    }

    // Update user info display
    function updateUserInfo() {
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (!sidebarFooter) return;
        
        // Remove existing user info if any
        const existingInfo = document.querySelector('.user-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        if (isAuthenticated && currentUser) {
            // Show logged-in user info
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <div style="padding: 16px 15px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #4f8ef7, #a78bfa); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
                            ${currentUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${currentUser.name || currentUser.username}
                            </div>
                            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); text-transform: capitalize;">
                                ${currentUser.role}
                            </div>
                        </div>
                    </div>
                    <button onclick="logout()" style="width: 100%; padding: 10px; background: rgba(220, 38, 38, 0.15); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.3s ease; font-family: 'Poppins', sans-serif;">
                        🚪 Logout
                    </button>
                </div>
            `;
            sidebarFooter.insertBefore(userInfo, sidebarFooter.firstChild);
        } else {
            // Show login button for guests
            const loginInfo = document.createElement('div');
            loginInfo.className = 'user-info';
            loginInfo.innerHTML = `
                <div style="padding: 16px 15px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 12px;">
                    <div style="text-align: center; margin-bottom: 12px; color: rgba(255,255,255,0.6); font-size: 0.85rem;">
                        👁️ Guest Mode
                    </div>
                    <a href="/login" style="display: block; width: 100%; padding: 10px; background: linear-gradient(135deg, #4f8ef7, #a78bfa); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; text-align: center; text-decoration: none; font-family: 'Poppins', sans-serif; transition: all 0.3s ease;">
                        🔐 Login to Edit
                    </a>
                </div>
            `;
            sidebarFooter.insertBefore(loginInfo, sidebarFooter.firstChild);
        }
        
        // Show/hide Users tab for admins only
        const usersTab = document.getElementById('usersTab');
        if (usersTab) {
            if (userRole === 'admin' && isAuthenticated) {
                usersTab.style.display = 'flex';
            } else {
                usersTab.style.display = 'none';
            }
        }
    }

    // Logout function (make it global)
    window.logout = async function() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    // Check auth and load app (no redirect needed)
    checkAuth().then(authenticated => {
        // Continue with app initialization regardless of auth status
        initializeApp();
    });

    function initializeApp() {

    // ===================== MOBILE MENU TOGGLE =====================
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuToggle && sidebar && sidebarOverlay) {
        // Toggle sidebar and overlay
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        
        // Close sidebar when clicking overlay
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            menuToggle.classList.remove('active');
        });
        
        // Close sidebar when window is resized to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }

    // ===================== TABS =====================
    const navLinks = document.querySelectorAll('.nav-link');
    const tabs = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');
    const titles = { dashboard: 'Dashboard', students: 'Members', councils: 'Councils', heads: 'Heads', users: 'User Management' };

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const tab = link.dataset.tab;
            navLinks.forEach(l => l.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
            pageTitle.textContent = titles[tab];
            
            // Close sidebar on mobile when clicking a nav link
            if (window.innerWidth <= 768 && sidebar && sidebarOverlay && menuToggle) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    });

    // ===================== TOAST =====================
    function toast(msg, isError = false) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.className = 'toast show' + (isError ? ' error' : '');
        setTimeout(() => el.classList.remove('show'), 3000);
    }

    // ===================== API HELPERS =====================
    async function apiGet(url) {
        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const res = await fetch(url, {
                credentials: 'include',
                headers: headers
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        } catch (err) {
            toast(`Error loading data: ${err.message}`, true);
            return [];
        }
    }
    async function apiPost(url, data) {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const res = await fetch(url, { 
                method: 'POST', 
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(data) 
            });
            return { ok: res.ok, data: await res.json() };
        } catch (err) {
            toast(`Network error: ${err.message}`, true);
            return { ok: false, data: { error: err.message } };
        }
    }
    async function apiDelete(url) {
        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const res = await fetch(url, { 
                method: 'DELETE',
                credentials: 'include',
                headers: headers
            });
            return res.ok;
        } catch (err) {
            toast(`Delete failed: ${err.message}`, true);
            return false;
        }
    }

    // ===================== COUNCILS =====================
    async function loadCouncils() {
        const councils = await apiGet('/api/councils');
        const tbody = document.getElementById('councilsBody');
        const selStudent = document.getElementById('sCouncil');
        const selHead = document.getElementById('hCouncil');

        tbody.innerHTML = '';
        selStudent.innerHTML = '<option value="">-- Select Council (optional) --</option>';
        selHead.innerHTML = '<option value="">-- Select Council --</option>';

        document.getElementById('statCouncils').textContent = councils.length;

        if (councils.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.3);font-style:italic;">No councils yet</td></tr>';
            applyRoleRestrictions();
            return;
        }
        councils.forEach(c => {
            tbody.innerHTML += `<tr>
                <td><span class="badge">${c.name}</span></td>
                <td>${c.description || '<span class="no-data">—</span>'}</td>
                <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                <td><button class="btn-delete" onclick="deleteCouncil('${c._id}')">🗑️ Delete</button></td>
            </tr>`;
            selStudent.innerHTML += `<option value="${c._id}">${c.name}</option>`;
            selHead.innerHTML += `<option value="${c._id}">${c.name}</option>`;
        });
        
        // Apply role restrictions after rendering
        applyRoleRestrictions();
    }

    window.deleteCouncil = async (id) => {
        if (!confirm('Delete this council? All related heads and students will be removed.')) return;
        await apiDelete(`/api/councils/${id}`);
        toast('Council deleted');
        loadAll();
    };

    document.getElementById('addCouncilForm').addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('cName').value.trim();
        const description = document.getElementById('cDesc').value.trim();
        const { ok, data } = await apiPost('/api/councils', { name, description });
        if (ok) { e.target.reset(); loadAll(); toast('Council added!'); }
        else toast(data.error, true);
    });

    // ===================== HEADS =====================
    async function loadHeads() {
        const heads = await apiGet('/api/heads');
        const tbody = document.getElementById('headsBody');
        const selStudent = document.getElementById('sHead');

        tbody.innerHTML = '';
        if (selStudent) {
            selStudent.innerHTML = '<option value="">-- Select Head --</option>';
        }

        if (heads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.3);font-style:italic;">No heads yet</td></tr>';
            applyRoleRestrictions();
            return;
        }
        heads.forEach(h => {
            tbody.innerHTML += `<tr>
                <td><strong>${h.name}</strong></td>
                <td>${h.email || '<span class="no-data">—</span>'}</td>
                <td>${h.council ? `<span class="badge">${h.council.name}</span>` : '<span class="no-data">—</span>'}</td>
                <td><button class="btn-delete" onclick="deleteHead('${h._id}')">🗑️ Delete</button></td>
            </tr>`;
            if (selStudent) selStudent.innerHTML += `<option value="${h._id}">${h.name}</option>`;
        });
        
        // Apply role restrictions after rendering
        applyRoleRestrictions();
    }

    window.deleteHead = async (id) => {
        if (!confirm('Delete this head?')) return;
        await apiDelete(`/api/heads/${id}`);
        toast('Head deleted');
        loadAll();
    };

    document.getElementById('addHeadForm').addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('hName').value.trim();
        const email = document.getElementById('hEmail').value.trim();
        const councilId = document.getElementById('hCouncil').value;
        const { ok, data } = await apiPost('/api/heads', { name, email, councilId });
        if (ok) { e.target.reset(); loadAll(); toast('Head added!'); }
        else toast(data.error, true);
    });

    // ===================== STUDENTS =====================
    let allStudents = [];

    async function loadStudents() {
        allStudents = await apiGet('/api/students');
        console.log('Loaded students:', allStudents);
        document.getElementById('statStudents').textContent = allStudents.length;
        document.getElementById('statDirectors').textContent = allStudents.filter(s => s.role === 'Director').length;
        document.getElementById('statRoleHeads').textContent  = allStudents.filter(s => s.role === 'Head').length;
        document.getElementById('statDelegates').textContent  = allStudents.filter(s => s.role === 'Delegate').length;
        renderStudents(allStudents);
    }

    function renderStudents(students) {
        const tbody = document.getElementById('studentsBody');
        console.log('Rendering students:', students);
        tbody.innerHTML = '';
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:rgba(255,255,255,0.3);font-style:italic;">No members yet</td></tr>';
            return;
        }
        students.forEach(s => {
            const roleBadgeClass = s.role === 'Director' ? 'badge-director' : s.role === 'Head' ? 'badge-head' : 'badge-delegate';
            const roleIcon = s.role === 'Director' ? '🔷' : s.role === 'Head' ? '🔶' : '🔹';
            tbody.innerHTML += `<tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.studentId}</td>
                <td><span class="badge ${roleBadgeClass}">${roleIcon} ${s.role || '—'}</span></td>
                <td>${s.council ? `<span class="badge">${s.council.name}</span>` : '<span class="no-data">—</span>'}</td>
                <td>${new Date(s.createdAt).toLocaleDateString()}</td>
                <td><button class="btn-delete" onclick="deleteStudent('${s._id}')">🗑️ Delete</button></td>
            </tr>`;
        });
        console.log('Rendered', students.length, 'students to table');
        
        // Apply role restrictions after rendering
        applyRoleRestrictions();
    }

    document.getElementById('searchStudent').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        renderStudents(allStudents.filter(s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)));
    });

    window.deleteStudent = async (id) => {
        if (!confirm('Delete this student?')) return;
        await apiDelete(`/api/students/${id}`);
        toast('Student deleted');
        loadStudents();
    };

    document.getElementById('addStudentForm').addEventListener('submit', async e => {
        e.preventDefault();
        const errDiv = document.getElementById('formError');
        errDiv.style.display = 'none';

        const name = document.getElementById('sName').value.trim();
        const studentId = document.getElementById('sId').value.trim();
        const role = document.getElementById('sRole').value;
        const councilId = document.getElementById('sCouncil').value;

        if (!role) {
            errDiv.textContent = 'Please select a role.';
            errDiv.style.display = 'block';
            return;
        }

        const { ok, data } = await apiPost('/api/students', { name, studentId, role, councilId });
        if (ok) {
            e.target.reset();
            errDiv.style.display = 'none';
            loadStudents();
            toast('Member added!');
        } else {
            errDiv.textContent = data.error || 'Failed to add member.';
            errDiv.style.display = 'block';
            toast(data.error || 'Error', true);
        }
    });

    // ===================== LOAD ALL =====================
    async function loadAll() {
        await loadCouncils();
        await loadHeads();
        await loadStudents();
        
        // Load users if admin and authenticated
        if (userRole === 'admin' && isAuthenticated) {
            await loadUsers();
        }
        
        // Apply role restrictions after data is loaded
        applyRoleRestrictions();
    }

    loadAll();

    // ===================== USER MANAGEMENT (Admin Only) =====================
    async function loadUsers() {
        if (userRole !== 'admin' || !isAuthenticated) return;
        
        const users = await apiGet('/api/users');
        const tbody = document.getElementById('usersBody');
        if (!tbody) return;
        
        tbody.innerHTML = users.map(u => {
            const roleColors = {
                admin: '#ef4444',
                editor: '#f59e0b',
                viewer: '#10b981'
            };
            const roleIcons = {
                admin: '🔴',
                editor: '🟡',
                viewer: '🟢'
            };
            
            return `
                <tr>
                    <td style="font-weight: 600;">${u.username}</td>
                    <td>${u.name || '<span class="no-data">-</span>'}</td>
                    <td>
                        <span style="color: ${roleColors[u.role]}; font-weight: 600;">
                            ${roleIcons[u.role]} ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                    </td>
                    <td>
                        <span class="badge" style="background: ${u.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${u.isActive ? '#10b981' : '#ef4444'}; border-color: ${u.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                            ${u.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                    </td>
                    <td style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                        ${new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                        ${u._id !== currentUser.id ? `
                            <button onclick="toggleUserStatus('${u._id}', ${!u.isActive})" class="btn-delete" style="margin-right: 8px; ${u.isActive ? 'background: rgba(251, 191, 36, 0.15); color: #fbbf24; border-color: rgba(251, 191, 36, 0.3);' : 'background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: rgba(16, 185, 129, 0.3);'}">
                                ${u.isActive ? '⏸ Disable' : '▶ Enable'}
                            </button>
                            <button onclick="deleteUser('${u._id}')" class="btn-delete">🗑 Delete</button>
                        ` : '<span class="no-data">You</span>'}
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.deleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        const success = await apiDelete(`/api/users/${id}`);
        if (success) {
            toast('User deleted successfully');
            loadUsers();
        }
    };

    window.toggleUserStatus = async (id, isActive) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                body: JSON.stringify({ isActive })
            });

            if (res.ok) {
                toast(`User ${isActive ? 'enabled' : 'disabled'} successfully`);
                loadUsers();
            } else {
                const data = await res.json();
                toast(data.error || 'Failed to update user', true);
            }
        } catch (error) {
            toast('Network error', true);
        }
    };

    if (userRole === 'admin') {
        document.getElementById('addUserForm')?.addEventListener('submit', async e => {
            e.preventDefault();
            const errDiv = document.getElementById('userFormError');
            
            const username = document.getElementById('uUsername').value.trim();
            const password = document.getElementById('uPassword').value;
            const name = document.getElementById('uName').value.trim();
            const role = document.getElementById('uRole').value;

            if (!username || !password || !role) {
                errDiv.textContent = 'Username, password, and role are required.';
                errDiv.style.display = 'block';
                return;
            }

            if (password.length < 6) {
                errDiv.textContent = 'Password must be at least 6 characters.';
                errDiv.style.display = 'block';
                return;
            }

            const { ok, data } = await apiPost('/api/users', { username, password, name, role });
            
            if (ok) {
                e.target.reset();
                errDiv.style.display = 'none';
                loadUsers();
                toast('User created successfully!');
            } else {
                errDiv.textContent = data.error || 'Failed to create user.';
                errDiv.style.display = 'block';
                toast(data.error || 'Error', true);
            }
        });
    }

    } // End of initializeApp()
});