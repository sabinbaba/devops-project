const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database('./duhigure.db', (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        // Families table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS families (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                family_name TEXT NOT NULL,
                head_of_family TEXT NOT NULL,
                phone_number TEXT,
                email TEXT,
                sector TEXT NOT NULL,
                cell TEXT,
                village TEXT,
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Family members table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS family_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                family_id INTEGER NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                national_id TEXT,
                birth_date DATE,
                gender TEXT,
                marital_status TEXT,
                education_level TEXT,
                occupation TEXT,
                role_in_family TEXT,
                phone_number TEXT,
                email TEXT,
                is_head_of_family BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE
            )
        `);

        // Performance contracts table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS performance_contracts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                family_id INTEGER NOT NULL,
                contract_year INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE
            )
        `);

        // Individual member duties table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS member_duties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contract_id INTEGER NOT NULL,
                member_id INTEGER NOT NULL,
                duty_title TEXT NOT NULL,
                duty_description TEXT,
                target_value TEXT,
                current_value TEXT DEFAULT '0',
                unit TEXT,
                due_date DATE,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'medium',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contract_id) REFERENCES performance_contracts (id) ON DELETE CASCADE,
                FOREIGN KEY (member_id) REFERENCES family_members (id) ON DELETE CASCADE
            )
        `);

        // Shared family duties table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS family_duties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contract_id INTEGER NOT NULL,
                duty_title TEXT NOT NULL,
                duty_description TEXT,
                target_value TEXT,
                current_value TEXT DEFAULT '0',
                unit TEXT,
                due_date DATE,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'medium',
                responsible_members TEXT, -- JSON array of member IDs
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contract_id) REFERENCES performance_contracts (id) ON DELETE CASCADE
            )
        `);

        // Users table for authentication
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'family',
                family_id INTEGER,
                full_name TEXT,
                email TEXT,
                phone_number TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE
            )
        `);

        // Create default admin user if not exists
        this.db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
            if (err) {
                console.error('Error checking admin user:', err);
            } else if (!row) {
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                this.db.run(
                    'INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)',
                    ['admin', hashedPassword, 'administrator', 'System Administrator', 'admin@duhigure.rw'],
                    (err) => {
                        if (err) {
                            console.error('Error creating admin user:', err);
                        } else {
                            console.log('Default admin user created');
                        }
                    }
                );
            }
        });

        // Create demo users
        const demoUsers = [
            { username: 'fam_kib_001', password: 'Family@2024', role: 'family', full_name: 'John Mukamana', email: 'john.mukamana@example.com' },
            { username: 'intore_001', password: 'Intore@2024', role: 'intore', full_name: 'Marie Uwimana', email: 'marie.uwimana@example.com' },
            { username: 'admin_kibungo', password: 'Admin@2024', role: 'administrator', full_name: 'Peter Nkurunziza', email: 'peter.nkurunziza@kibungo.gov.rw' }
        ];

        demoUsers.forEach(user => {
            this.db.get('SELECT * FROM users WHERE username = ?', [user.username], (err, row) => {
                if (err) {
                    console.error(`Error checking demo user ${user.username}:`, err);
                } else if (!row) {
                    const hashedPassword = bcrypt.hashSync(user.password, 10);
                    this.db.run(
                        'INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)',
                        [user.username, hashedPassword, user.role, user.full_name, user.email],
                        (err) => {
                            if (err) {
                                console.error(`Error creating demo user ${user.username}:`, err);
                            } else {
                                console.log(`Demo user ${user.username} created`);
                            }
                        }
                    );
                }
            });
        });
    }

    // Family operations
    createFamily(familyData, callback) {
        const { family_name, head_of_family, phone_number, email, sector, cell, village, address } = familyData;
        this.db.run(
            `INSERT INTO families (family_name, head_of_family, phone_number, email, sector, cell, village, address) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [family_name, head_of_family, phone_number, email, sector, cell, village, address],
            function(err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    getAllFamilies(callback) {
        this.db.all('SELECT * FROM families ORDER BY created_at DESC', callback);
    }

    getFamilyById(id, callback) {
        this.db.get('SELECT * FROM families WHERE id = ?', [id], callback);
    }

    updateFamily(id, familyData, callback) {
        const { family_name, head_of_family, phone_number, email, sector, cell, village, address } = familyData;
        this.db.run(
            `UPDATE families SET family_name = ?, head_of_family = ?, phone_number = ?, email = ?, 
             sector = ?, cell = ?, village = ?, address = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [family_name, head_of_family, phone_number, email, sector, cell, village, address, id],
            callback
        );
    }

    deleteFamily(id, callback) {
        this.db.run('DELETE FROM families WHERE id = ?', [id], callback);
    }

    // Family member operations
    addFamilyMember(memberData, callback) {
        const { family_id, first_name, last_name, national_id, birth_date, gender, marital_status, 
                education_level, occupation, role_in_family, phone_number, email, is_head_of_family } = memberData;
        
        this.db.run(
            `INSERT INTO family_members (family_id, first_name, last_name, national_id, birth_date, gender, 
             marital_status, education_level, occupation, role_in_family, phone_number, email, is_head_of_family) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [family_id, first_name, last_name, national_id, birth_date, gender, marital_status, 
             education_level, occupation, role_in_family, phone_number, email, is_head_of_family || false],
            function(err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    getFamilyMembers(family_id, callback) {
        this.db.all('SELECT * FROM family_members WHERE family_id = ? ORDER BY is_head_of_family DESC, first_name', [family_id], callback);
    }

    getMemberById(id, callback) {
        this.db.get('SELECT * FROM family_members WHERE id = ?', [id], callback);
    }

    updateMember(id, memberData, callback) {
        const { first_name, last_name, national_id, birth_date, gender, marital_status, 
                education_level, occupation, role_in_family, phone_number, email, is_head_of_family } = memberData;
        
        this.db.run(
            `UPDATE family_members SET first_name = ?, last_name = ?, national_id = ?, birth_date = ?, gender = ?, 
             marital_status = ?, education_level = ?, occupation = ?, role_in_family = ?, phone_number = ?, 
             email = ?, is_head_of_family = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [first_name, last_name, national_id, birth_date, gender, marital_status, 
             education_level, occupation, role_in_family, phone_number, email, is_head_of_family || false, id],
            callback
        );
    }

    deleteMember(id, callback) {
        this.db.run('DELETE FROM family_members WHERE id = ?', [id], callback);
    }

    // Performance contract operations
    createPerformanceContract(contractData, callback) {
        const { family_id, contract_year, title, description, start_date, end_date } = contractData;
        this.db.run(
            `INSERT INTO performance_contracts (family_id, contract_year, title, description, start_date, end_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [family_id, contract_year, title, description, start_date, end_date],
            function(err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    getFamilyContracts(family_id, callback) {
        this.db.all('SELECT * FROM performance_contracts WHERE family_id = ? ORDER BY contract_year DESC', [family_id], callback);
    }

    getContractById(id, callback) {
        this.db.get('SELECT * FROM performance_contracts WHERE id = ?', [id], callback);
    }

    // Member duties operations
    addMemberDuty(dutyData, callback) {
        const { contract_id, member_id, duty_title, duty_description, target_value, unit, due_date, priority } = dutyData;
        this.db.run(
            `INSERT INTO member_duties (contract_id, member_id, duty_title, duty_description, target_value, unit, due_date, priority) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [contract_id, member_id, duty_title, duty_description, target_value, unit, due_date, priority],
            function(err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    getMemberDuties(contract_id, callback) {
        this.db.all(`
            SELECT md.*, fm.first_name, fm.last_name 
            FROM member_duties md 
            JOIN family_members fm ON md.member_id = fm.id 
            WHERE md.contract_id = ? 
            ORDER BY md.priority DESC, md.due_date ASC
        `, [contract_id], callback);
    }

    updateMemberDuty(id, updates, callback) {
        const { current_value, status } = updates;
        this.db.run(
            `UPDATE member_duties SET current_value = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [current_value, status, id],
            callback
        );
    }

    // Family duties operations
    addFamilyDuty(dutyData, callback) {
        const { contract_id, duty_title, duty_description, target_value, unit, due_date, priority, responsible_members } = dutyData;
        this.db.run(
            `INSERT INTO family_duties (contract_id, duty_title, duty_description, target_value, unit, due_date, priority, responsible_members) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [contract_id, duty_title, duty_description, target_value, unit, due_date, priority, JSON.stringify(responsible_members)],
            function(err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    getFamilyDuties(contract_id, callback) {
        this.db.all('SELECT * FROM family_duties WHERE contract_id = ? ORDER BY priority DESC, due_date ASC', [contract_id], callback);
    }

    updateFamilyDuty(id, updates, callback) {
        const { current_value, status } = updates;
        this.db.run(
            `UPDATE family_duties SET current_value = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [current_value, status, id],
            callback
        );
    }

    // User authentication operations
    getUserByUsername(username, callback) {
        this.db.get('SELECT * FROM users WHERE username = ?', [username], callback);
    }

    createUser(userData, callback) {
        const { username, password, role, family_id, full_name, email, phone_number } = userData;
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        this.db.run(
            `INSERT INTO users (username, password, role, family_id, full_name, email, phone_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, role, family_id, full_name, email, phone_number],
            function(err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compareSync(plainPassword, hashedPassword);
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;
