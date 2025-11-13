import { prisma } from '../config/db.js';

export async function registerCustomer(req, res, next) {
  try {
    const { email, name, phone } = req.body;
    const customer = await prisma.customer.create({ data: { email, name, phone } });
    res.status(201).json(customer);
  } catch (e) { next(e); }
}

export async function listCustomers(req, res, next) {
  try {
    const customers = await prisma.customer.findMany({ include: { policies: true } });
    res.json(customers);
  } catch (e) { next(e); }
}


