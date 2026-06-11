const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, ...data });
};

const sendError = (res, message = 'Error', statusCode = 400, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  res.status(statusCode).json(payload);
};

const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
