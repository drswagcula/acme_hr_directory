const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// PostgreSQL connection pool
const pool = new Pool({
    user: 'your_db_user', 
    host: 'localhost',
    database: 'acme_hr', 
    password: 'your_db_password', 
    port: 3000, 
});

// Helper function to handle database errors
const handleDBError = (res, error) => {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
};

// GET /api/employees: Returns array of employees
app.get('/api/employees', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM employees');
        res.json(rows);
    } catch (error) {
        handleDBError(res, error);
    }
});

// GET /api/departments: Returns an array of departments
app.get('/api/departments', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM departments');
        res.json(rows);
    } catch (error) {
        handleDBError(res, error);
    }
});

// POST /api/employees: Returns a created employee
app.post('/api/employees', async (req, res) => {
    const { name, department_id } = req.body;
    if (!name || !department_id) {
        return res.status(400).json({ error: 'Name and department_id are required' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *',
            [name, department_id]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        handleDBError(res, error);
    }
});

// DELETE /api/employees/:id: Returns nothing
app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM employees WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: `Employee with ID ${id} not found` });
        }
        res.sendStatus(204); // No content
    } catch (error) {
        handleDBError(res, error);
    }
});

// PUT /api/employees/:id: Returns an updated employee
app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { name, department_id } = req.body;
    if (!name || !department_id) {
        return res.status(400).json({ error: 'Name and department_id are required' });
    }
    try {
        const { rows } = await pool.query(
            'UPDATE employees SET name = $1, department_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [name, department_id, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: `Employee with ID ${id} not found` });
        }
        res.json(rows[0]);
    } catch (error) {
        handleDBError(res, error);
    }
});

// Error handling route (as requested)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Have the express server listen
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});