const express = require('express');
const path = require('path');
const session = require('express-session');
const Database = require('./database');

const app = express();
const PORT = 3000;

// Initialize database
const db = new Database();


// ============ MIDDLEWARE ============

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'duhigure-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// ============ AUTHENTICATION MIDDLEWARE ============

// Check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
}

// Check if user is administrator
function isAdmin(req, res, next) {
    if (req.session && req.session.userRole === 'administrator') {
        next();
    } else {
        res.status(403).json({ error: 'Administrator access required' });
    }
}

// ============ API ROUTES ============

// Authentication routes
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    db.getUserByUsername(username, (err, user) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user || !db.verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.userRole = user.role;
        req.session.familyId = user.family_id;
        req.session.fullName = user.full_name;
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                familyId: user.family_id,
                fullName: user.full_name
            }
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

app.get('/api/auth/me', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.userRole,
        familyId: req.session.familyId,
        fullName: req.session.fullName
    });
});

// Family routes
app.post('/api/families', isAuthenticated, (req, res) => {
    const familyData = req.body;
    
    if (!familyData.family_name || !familyData.head_of_family || !familyData.sector) {
        return res.status(400).json({ error: 'Family name, head of family, and sector are required' });
    }
    
    db.createFamily(familyData, (err, familyId) => {
        if (err) {
            console.error('Create family error:', err);
            return res.status(500).json({ error: 'Failed to create family' });
        }
        
        res.status(201).json({ 
            message: 'Family created successfully',
            familyId: familyId 
        });
    });
});

app.get('/api/families', isAuthenticated, isAdmin, (req, res) => {
    db.getAllFamilies((err, families) => {
        if (err) {
            console.error('Get families error:', err);
            return res.status(500).json({ error: 'Failed to fetch families' });
        }
        res.json(families);
    });
});

app.get('/api/families/:id', isAuthenticated, (req, res) => {
    const familyId = req.params.id;
    
    // Check if user can access this family
    if (req.session.userRole !== 'administrator' && req.session.familyId != familyId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    db.getFamilyById(familyId, (err, family) => {
        if (err) {
            console.error('Get family error:', err);
            return res.status(500).json({ error: 'Failed to fetch family' });
        }
        
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }
        
        res.json(family);
    });
});

app.put('/api/families/:id', isAuthenticated, (req, res) => {
    const familyId = req.params.id;
    const familyData = req.body;
    
    // Check if user can update this family
    if (req.session.userRole !== 'administrator' && req.session.familyId != familyId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    db.updateFamily(familyId, familyData, (err) => {
        if (err) {
            console.error('Update family error:', err);
            return res.status(500).json({ error: 'Failed to update family' });
        }
        
        res.json({ message: 'Family updated successfully' });
    });
});

app.delete('/api/families/:id', isAuthenticated, isAdmin, (req, res) => {
    const familyId = req.params.id;
    
    db.deleteFamily(familyId, (err) => {
        if (err) {
            console.error('Delete family error:', err);
            return res.status(500).json({ error: 'Failed to delete family' });
        }
        
        res.json({ message: 'Family deleted successfully' });
    });
});

// Family member routes
app.post('/api/families/:familyId/members', isAuthenticated, (req, res) => {
    const familyId = req.params.familyId;
    const memberData = { ...req.body, family_id: familyId };
    
    // Check if user can add members to this family
    if (req.session.userRole !== 'administrator' && req.session.familyId != familyId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!memberData.first_name || !memberData.last_name) {
        return res.status(400).json({ error: 'First name and last name are required' });
    }
    
    db.addFamilyMember(memberData, (err, memberId) => {
        if (err) {
            console.error('Add member error:', err);
            return res.status(500).json({ error: 'Failed to add family member' });
        }
        
        res.status(201).json({ 
            message: 'Family member added successfully',
            memberId: memberId 
        });
    });
});

app.get('/api/families/:familyId/members', isAuthenticated, (req, res) => {
    const familyId = req.params.familyId;
    
    // Check if user can view members of this family
    if (req.session.userRole !== 'administrator' && req.session.familyId != familyId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    db.getFamilyMembers(familyId, (err, members) => {
        if (err) {
            console.error('Get members error:', err);
            return res.status(500).json({ error: 'Failed to fetch family members' });
        }
        res.json(members);
    });
});

app.get('/api/members/:id', isAuthenticated, (req, res) => {
    const memberId = req.params.id;
    
    db.getMemberById(memberId, (err, member) => {
        if (err) {
            console.error('Get member error:', err);
            return res.status(500).json({ error: 'Failed to fetch member' });
        }
        
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        // Check access
        if (req.session.userRole !== 'administrator' && req.session.familyId != member.family_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json(member);
    });
});

app.put('/api/members/:id', isAuthenticated, (req, res) => {
    const memberId = req.params.id;
    const memberData = req.body;
    
    // First get the member to check access
    db.getMemberById(memberId, (err, member) => {
        if (err) {
            console.error('Get member error:', err);
            return res.status(500).json({ error: 'Failed to fetch member' });
        }
        
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        // Check access
        if (req.session.userRole !== 'administrator' && req.session.familyId != member.family_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        db.updateMember(memberId, memberData, (err) => {
            if (err) {
                console.error('Update member error:', err);
                return res.status(500).json({ error: 'Failed to update member' });
            }
            
            res.json({ message: 'Member updated successfully' });
        });
    });
});

app.delete('/api/members/:id', isAuthenticated, (req, res) => {
    const memberId = req.params.id;
    
    // First get the member to check access
    db.getMemberById(memberId, (err, member) => {
        if (err) {
            console.error('Get member error:', err);
            return res.status(500).json({ error: 'Failed to fetch member' });
        }
        
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        // Check access
        if (req.session.userRole !== 'administrator' && req.session.familyId != member.family_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        db.deleteMember(memberId, (err) => {
            if (err) {
                console.error('Delete member error:', err);
                return res.status(500).json({ error: 'Failed to delete member' });
            }
            
            res.json({ message: 'Member deleted successfully' });
        });
    });
});

// Performance contract routes
app.post('/api/families/:familyId/contracts', isAuthenticated, (req, res) => {
    const familyId = req.params.familyId;
    const contractData = { ...req.body, family_id: familyId };
    
    // Check if user can create contracts for this family
    if (req.session.userRole !== 'administrator' && req.session.familyId != familyId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!contractData.title || !contractData.start_date || !contractData.end_date) {
        return res.status(400).json({ error: 'Title, start date, and end date are required' });
    }
    
    contractData.contract_year = new Date().getFullYear();
    
    db.createPerformanceContract(contractData, (err, contractId) => {
        if (err) {
            console.error('Create contract error:', err);
            return res.status(500).json({ error: 'Failed to create performance contract' });
        }
        
        res.status(201).json({ 
            message: 'Performance contract created successfully',
            contractId: contractId 
        });
    });
});

app.get('/api/families/:familyId/contracts', isAuthenticated, (req, res) => {
    const familyId = req.params.familyId;
    
    // Check if user can view contracts for this family
    if (req.session.userRole !== 'administrator' && req.session.familyId != familyId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    db.getFamilyContracts(familyId, (err, contracts) => {
        if (err) {
            console.error('Get contracts error:', err);
            return res.status(500).json({ error: 'Failed to fetch contracts' });
        }
        res.json(contracts);
    });
});

app.get('/api/contracts/:id', isAuthenticated, (req, res) => {
    const contractId = req.params.id;
    
    db.getContractById(contractId, (err, contract) => {
        if (err) {
            console.error('Get contract error:', err);
            return res.status(500).json({ error: 'Failed to fetch contract' });
        }
        
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        
        // Check access
        if (req.session.userRole !== 'administrator' && req.session.familyId != contract.family_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json(contract);
    });
});

// Member duties routes
app.post('/api/contracts/:contractId/member-duties', isAuthenticated, (req, res) => {
    const contractId = req.params.contractId;
    const dutyData = { ...req.body, contract_id: contractId };
    
    // Get contract to check access
    db.getContractById(contractId, (err, contract) => {
        if (err) {
            console.error('Get contract error:', err);
            return res.status(500).json({ error: 'Failed to fetch contract' });
        }
        
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        
        // Check access
        if (req.session.userRole !== 'administrator' && req.session.familyId != contract.family_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (!dutyData.member_id || !dutyData.duty_title) {
            return res.status(400).json({ error: 'Member ID and duty title are required' });
        }
        
        db.addMemberDuty(dutyData, (err, dutyId) => {
            if (err) {
                console.error('Add member duty error:', err);
                return res.status(500).json({ error: 'Failed to add member duty' });
            }
            
            res.status(201).json({ 
                message: 'Member duty added successfully',
                dutyId: dutyId 
            });
        });
    });
});

app.get('/api/contracts/:contractId/member-duties', isAuthenticated, (req, res) => {
    const contractId = req.params.contractId;
    
    // Get contract to check access
    db.getContractById(contractId, (err, contract) => {
        if (err) {
            console.error('Get contract error:', err);
            return res.status(500).json({ error: 'Failed to fetch contract' });
        }
        
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        
        // Check access
        if (req.session.userRole !== 'administrator' && req.session.familyId != contract.family_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        db.getMemberDuties(contractId, (err, duties) => {
            if (err) {
                console.error('Get member duties error:', err);
                return res.status(500).json({ error: 'Failed to fetch member duties' });
            }
            res.json(duties);
        });
    });
});

app.put('/api/member-duties/:id', isAuthenticated, (req, res) => {
    const dutyId = req.params.id;
    const updates = req.body;
    
    db.updateMemberDuty(dutyId, updates, (err) => {
        if (err) {
            console.error('Update member duty error:', err);
            return res.status(500).json({ error: 'Failed to update member duty' });
        }
        
        res.json({ message: 'Member duty updated successfully' });
    });
});

// Family duties routes
app.post('/api/contracts/:contractId/family-duties', isAuthenticated, (req, res) => {
    const contractId = req.params.contractId;
    const dutyData = { ...req.body, contract_id: contractId };
    
    // Get contract to check access
    db.getContractById(contractId, (err, contract) => {
        if (err) {
            console.error('Get contract error:', err);
            return res.status(500).json({ error: 'Failed to fetch contract' });
        }
        
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        
        // Check access
        if (req.session.userRole !== 'administrator' && req.session.familyId != contract.family_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (!dutyData.duty_title) {
            return res.status(400).json({ error: 'Duty title is required' });
        }
        
        db.addFamilyDuty(dutyData, (err, dutyId) => {
            if (err) {
                console.error('Add family duty error:', err);
                return res.status(500).json({ error: 'Failed to add family duty' });
            }
            
            res.status(201).json({ 
                message: 'Family duty added successfully',
                dutyId: dutyId 
            });
        });
    });
});

app.get('/api/contracts/:contractId/family-duties', isAuthenticated, (req, res) => {
    const contractId = req.params.contractId;
    
    // Get contract to check access
    db.getContractById(contractId, (err, contract) => {
        if (err) {
            console.error('Get contract error:', err);
            return res.status(500).json({ error: 'Failed to fetch contract' });
        }
        
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        
        // Check access
        if (req.session.userRole !== 'administrator' && req.session.familyId != contract.family_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        db.getFamilyDuties(contractId, (err, duties) => {
            if (err) {
                console.error('Get family duties error:', err);
                return res.status(500).json({ error: 'Failed to fetch family duties' });
            }
            res.json(duties);
        });
    });
});

app.put('/api/family-duties/:id', isAuthenticated, (req, res) => {
    const dutyId = req.params.id;
    const updates = req.body;
    
    db.updateFamilyDuty(dutyId, updates, (err) => {
        if (err) {
            console.error('Update family duty error:', err);
            return res.status(500).json({ error: 'Failed to update family duty' });
        }
        
        res.json({ message: 'Family duty updated successfully' });
    });
});

// ============ SERVE STATIC FILES ============

// Serve HTML files from public-section
app.use(express.static('public-section'));

// Serve system files
app.use(express.static('system'));

// Serve CSS files from css directory
app.use('/css', express.static('css'));

// Serve other assets (if they exist)
app.use('/assets', express.static('assets'));
app.use('/js', express.static('js'));
app.use('/images', express.static('images'));

// ============ ROUTES FOR PAGES ============

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'index.html'));
});

// About page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'about.html'));
});

// Contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'contact.html'));
});

// Guide page
app.get('/guide', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'guide.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'system-login.html'));
});

// Media page
app.get('/media', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'media.html'));
});

// Social page
app.get('/social', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'social.html'));
});

// System pages
app.get('/system', (req, res) => {
    res.sendFile(path.join(__dirname, 'system', 'index.html'));
});

app.get('/system/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'system-login.html'));
});

app.get('/system/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'system', 'dashboard.html'));
});

app.get('/system/family-profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'system', 'family-profile.html'));
});

app.get('/system/members', (req, res) => {
    res.sendFile(path.join(__dirname, 'system', 'members.html'));
});

app.get('/system/performance-contract', (req, res) => {
    res.sendFile(path.join(__dirname, 'system', 'performance-contract.html'));
});

app.get('/system/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'system', 'reports.html'));
});

// ============ 404 HANDLER ============
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public-section', '404.html'));
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║     🚀 Express Server Running!      ║
    ║     http://localhost:${PORT}            ║
    ╚══════════════════════════════════════╝
    
    📁 Serving your directory structure:
    
    project/
    ├── main.js
    ├── package.json
    ├── public-section/
    │   ├── index.html      → http://localhost:${PORT}/
    │   ├── about.html      → http://localhost:${PORT}/about
    │   ├── contact.html    → http://localhost:${PORT}/contact
    │   ├── guide.html      → http://localhost:${PORT}/guide
    │   ├── login.html      → http://localhost:${PORT}/login
    │   ├── media.html      → http://localhost:${PORT}/media
    │   └── social.html     → http://localhost:${PORT}/social
    ├── css/
    │   ├── style.css       → http://localhost:${PORT}/css/style.css
    │   ├── siderbar.css    → http://localhost:${PORT}/css/siderbar.css
    │   └── responsive.css  → http://localhost:${PORT}/css/responsive.css
    └── system/
        ├── index.html      → http://localhost:${PORT}/system
        ├── login.html      → http://localhost:${PORT}/system/login
        ├── dashboard.html  → http://localhost:${PORT}/system/dashboard
        ├── family-profile.html → http://localhost:${PORT}/system/family-profile
        ├── members.html    → http://localhost:${PORT}/system/members
        ├── performance-contract.html → http://localhost:${PORT}/system/performance-contract
        └── reports.html    → http://localhost:${PORT}/system/reports
    
    ⚠️  IMPORTANT: In your HTML files, use:
    <link rel="stylesheet" href="/css/style.css">
    (with leading slash /)
    `);
});
