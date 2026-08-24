const Joi = require("joi");

function validateNote(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  next();
}

module.exports = validateNote;


//try to use joi method for others
//hardcodes status n=dont add read from packages