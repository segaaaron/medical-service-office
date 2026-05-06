const prisma = require('../services/prisma.service');

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
    if (treatmentId !== undefined) {
      const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId }, select: { id: true, active: true } });
      if (!treatment || !treatment.active) {
        return res.status(422).json({ error: 'El tratamiento seleccionado no está disponible' });
      }
      data.treatmentId = treatmentId;
    }
    if (notes !== undefined) data.notes = notes;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) data.status = status;

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data,
      include: { treatment: { select: { id: true, name: true, tag: true } } },
    });
    return res.json(appointment);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cita no encontrada' });
    next(err);
  }
}

async function deleteAppointment(req, res, next) {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cita no encontrada' });
    next(err);
  }
}

module.exports = { createAppointment, updateAppointment, deleteAppointment };
