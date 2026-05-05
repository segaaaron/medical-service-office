const prisma = require('../services/prisma.service');

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

async function listAppointments(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { treatment: { select: { id: true, name: true, tag: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(appointments);
  } catch (err) {
    next(err);
  }
}

async function getAppointment(req, res, next) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { treatment: { select: { id: true, name: true, tag: true } } },
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    return res.json(appointment);
  } catch (err) {
    next(err);
  }
}

async function createAppointment(req, res, next) {
  try {
    const { patientName, patientPhone, patientEmail, treatmentId, notes, scheduledAt } = req.body;

    const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId }, select: { id: true, active: true } });
    if (!treatment || !treatment.active) {
      return res.status(422).json({ error: 'El tratamiento seleccionado no está disponible' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientName,
        patientPhone,
        patientEmail,
        treatmentId,
        notes,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'PENDING',
      },
      include: { treatment: { select: { id: true, name: true, tag: true } } },
    });
    return res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
}

async function updateAppointment(req, res, next) {
  try {
    const { patientName, patientPhone, patientEmail, treatmentId, notes, status, scheduledAt } = req.body;
    const data = {};
    if (patientName !== undefined) data.patientName = patientName;
    if (patientPhone !== undefined) data.patientPhone = patientPhone;
    if (patientEmail !== undefined) data.patientEmail = patientEmail;
    if (treatmentId !== undefined) data.treatmentId = treatmentId;
    if (notes !== undefined) data.notes = notes;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      data.status = status;
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data,
      include: { treatment: { select: { id: true, name: true, tag: true } } },
    });
    return res.json(appointment);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Appointment not found' });
    next(err);
  }
}

async function deleteAppointment(req, res, next) {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Appointment not found' });
    next(err);
  }
}

module.exports = { listAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment };
