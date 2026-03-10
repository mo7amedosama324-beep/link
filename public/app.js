document.addEventListener('DOMContentLoaded', () => {

    // ===================== TABS =====================
    const navLinks = document.querySelectorAll('.nav-link');
    const tabs = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');
    const titles = { dashboard: 'Dashboard', students: 'Members', councils: 'Councils', heads: 'Heads' };

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const tab = link.dataset.tab;
            navLinks.forEach(l => l.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
            pageTitle.textContent = titles[tab];
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
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        } catch (err) {
            toast(`Error loading data: ${err.message}`, true);
            return [];
        }
    }
    async function apiPost(url, data) {
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            return { ok: res.ok, data: await res.json() };
        } catch (err) {
            toast(`Network error: ${err.message}`, true);
            return { ok: false, data: { error: err.message } };
        }
    }
    async function apiDelete(url) {
        try {
            const res = await fetch(url, { method: 'DELETE' });
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
    }

    loadAll();
});