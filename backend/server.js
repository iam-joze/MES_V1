require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/authRoutes');
const executiveRoutes = require('./routes/executiveRoutes');
const managerRoutes = require('./routes/managerRoutes');
const accountRoutes = require('./routes/accountRoutes');
const lineRoutes = require('./routes/lineRoutes');
const blueprintRoutes = require('./routes/blueprintRoutes');
const jobRoutes = require('./routes/jobroutes');
const operatorRoutes = require('./routes/operatorRoutes');
const runtimeRoutes = require('./routes/runtimeRoutes');
const erpRoutes = require('./routes/erpRoutes');
const faultRoutes = require('./routes/faultRoutes');
const emergencyStopRoutes = require('./routes/emergencyStopRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.json({ message: 'MES Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/executive', executiveRoutes);
app.use('/api/executive/managers', accountRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/executive/lines', lineRoutes);
app.use('/api/blueprints', blueprintRoutes);
app.use('/api/manager/jobs', jobRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/operator', runtimeRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/faults', faultRoutes);
app.use('/api/emergency-stop', emergencyStopRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(port, () => {
    console.log(`Server started on port ${port}`);
});