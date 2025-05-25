import express from 'express';
import Doctor from '../models/Doctor.js';
import Pathologist from '../models/Pathologist.js';
import Patient from '../models/Patient.js';

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const { email, role } = req.query;
        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role query parameters are required.' });
        }
        let user;
        if (role === 'doctor') {
            user = await Doctor.findOne({ email });
        } else if (role === 'pathologist') {
            user = await Pathologist.findOne({ email });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


router.get('/:id/patients', async (req, res) => {
    try {

        const doctor = await Doctor.findById(req.params.id).populate({
            path: 'patients',
            model: 'Patient',
            select: 'name email age gender address images detectedDisease reportStatus',
        });
        //console.log('DEBUG doctor inside controller:', doctor);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }
        let patients = doctor.patients;
        //console.log('DEBUG patients:', patients);

        patients = (patients || []).filter(Boolean);

        const result = patients.map(p => ({
            id: p._id ? p._id.toString() : p.id,
            name: p.name,
            email: p.email,
            age: p.age,
            gender: p.gender,
            address: p.address,
            images: p.images || [],
            detectedDisease: p.detectedDisease || '',
            reportStatus: p.reportStatus || ''
        }));
        //console.log('DEBUG result:', result);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

export default router;
