const validator = require('validator');

/**
 * Sanitize and validate user input to prevent XSS and injection attacks
 */
const sanitizeInput = input => {
  if (typeof input !== 'string') return input;
  return validator.escape(input.trim());
};

/**
 * Validate email format
 */
const isValidEmail = email => {
  return validator.isEmail(email);
};

/**
 * Validate password strength (min 6 characters)
 */
const isValidPassword = password => {
  return typeof password === 'string' && password.length >= 6;
};

/**
 * Validate UUID format
 */
const isValidUUID = id => {
  return validator.isUUID(id);
};

/**
 * Validate numeric value
 */
const isValidNumber = value => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate date format
 */
const isValidDate = date => {
  return validator.isISO8601(date);
};

/**
 * Middleware to validate registration input
 */
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  req.body.name = sanitizeInput(name);
  req.body.email = email.toLowerCase().trim();

  next();
};

/**
 * Middleware to validate login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  req.body.email = email.toLowerCase().trim();

  next();
};

/**
 * Middleware to validate transaction input (receitas/despesas)
 */
const validateTransaction = (req, res, next) => {
  const { descricao, valor, categoria } = req.body;

  if (!descricao || valor === undefined || !categoria) {
    return res.status(400).json({ message: 'Description, value, and category are required' });
  }

  if (!isValidNumber(valor) || valor < 0) {
    return res.status(400).json({ message: 'Value must be a positive number' });
  }

  req.body.descricao = sanitizeInput(descricao);
  req.body.categoria = sanitizeInput(categoria);

  if (req.body.cliente) req.body.cliente = sanitizeInput(req.body.cliente);
  if (req.body.fornecedor) req.body.fornecedor = sanitizeInput(req.body.fornecedor);
  if (req.body.observacoes) req.body.observacoes = sanitizeInput(req.body.observacoes);

  next();
};

/**
 * Middleware to validate consultation booking input
 */
const validateConsultation = (req, res, next) => {
  const { consultationDate, startTime } = req.body;

  if (!consultationDate || !startTime) {
    return res.status(400).json({ message: 'Date and start time are required' });
  }

  if (!isValidDate(consultationDate)) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  const validTimes = ['19:00', '20:00', '21:00'];
  if (!validTimes.includes(startTime)) {
    return res.status(400).json({ message: 'Start time must be 19:00, 20:00, or 21:00' });
  }

  if (req.body.notes) {
    req.body.notes = sanitizeInput(req.body.notes);
  }

  next();
};

module.exports = {
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  isValidUUID,
  isValidNumber,
  isValidDate,
  validateRegistration,
  validateLogin,
  validateTransaction,
  validateConsultation,
};
